import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { GoogleGenAI } from '@google/genai';

export class AiController {

    static async parseTransaction(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const parseSchema = z.object({
                text: z.string().min(1, "O texto é obrigatório"),
                group_id: z.string().uuid()
            });

            const data = parseSchema.parse(req.body);

            // 1. Verifica permissão no grupo
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: data.group_id }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão neste grupo' });
            }

            // 2. Busca todas as categorias disponíveis para ensinar a IA
            const categories = await prisma.category.findMany();
            const categoryNames = categories.map(c => c.name).join(', ');

            // 3. Monta o Prompt para a IA
            const systemPrompt = `Você é um assistente financeiro especialista em extrair dados de textos naturais.
O usuário vai enviar uma frase relatando um gasto ou receita. Você DEVE analisar a frase e retornar ESTRITAMENTE um JSON estruturado. NÃO inclua nenhuma formatação markdown (como \`\`\`json), responda apenas com as chaves e valores.

O JSON deve seguir EXATAMENTE esta estrutura:
{
  "description": "Uma descrição curta e clara do que foi (string)",
  "amount": Valor numérico positivo (number),
  "type": "INCOME" se for receita/ganho, "EXPENSE" se for gasto/despesa (string),
  "category": Escolha UMA das categorias exatas da lista a seguir, a que melhor se encaixar: [${categoryNames}] (string),
  "is_installment": true se a pessoa falar que parcelou/dividiu, false caso contrário (boolean),
  "installments_count": Quantidade de parcelas se for parcelado, ou null se não for (number | null),
  "date": "Data que a transação ocorreu ou a primeira parcela vence, no formato YYYY-MM-DDT00:00:00Z. Se não for informada, use a data de hoje" (string)
}`;

            // 4. Inicializa o cliente do Gemini
            // Em testes, isso será mockado. Em produção, passamos o objeto (mesmo que vazio para usar process.env default, ou explicito).
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

            let aiResponseText = "";

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: data.text,
                    config: {
                        systemInstruction: systemPrompt,
                        temperature: 0.1 // Temperatura baixa para ser estritamente técnico e previsível
                    }
                });
                aiResponseText = response.text || "";
            } catch (error) {
                console.error("Erro na API do Google:", error);
                return res.status(500).json({ error: 'Erro ao se comunicar com a Inteligência Artificial.' });
            }

            // 5. Tenta fazer o parse do JSON retornado
            let aiData;
            try {
                // Remove qualquer possível sujeira de markdown caso a IA desobedeça
                const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(cleanJson);
            } catch (error) {
                console.error("Erro ao fazer parse do JSON da IA:", aiResponseText);
                return res.status(400).json({ error: 'Erro ao interpretar a resposta da IA. Tente reescrever a frase de forma mais clara.' });
            }

            // 6. Valida o formato devolvido pela IA com Zod
            const aiOutputSchema = z.object({
                description: z.string(),
                amount: z.number().positive(),
                type: z.enum(['INCOME', 'EXPENSE']),
                category: z.string(),
                is_installment: z.boolean(),
                installments_count: z.number().nullable().optional(),
                date: z.string()
            });

            const parsedAiData = aiOutputSchema.parse(aiData);

            // 7. Acha o ID real da categoria baseado no nome que a IA escolheu
            const categoryMatch = categories.find(c => c.name.toLowerCase() === parsedAiData.category.toLowerCase());
            if (!categoryMatch) {
                return res.status(400).json({ error: `Categoria "${parsedAiData.category}" não foi encontrada no sistema.` });
            }

            // 8. Roteamento: É Parcelamento ou Transação simples?
            if (parsedAiData.is_installment && parsedAiData.installments_count && parsedAiData.installments_count > 1) {
                // Criação de Parcelamento
                const installmentValue = parsedAiData.amount / parsedAiData.installments_count;
                const startDate = new Date(parsedAiData.date);
                const installmentId = crypto.randomUUID();
                const transactionsData = [];

                for (let i = 0; i < parsedAiData.installments_count; i++) {
                    const transactionDate = new Date(startDate);
                    transactionDate.setMonth(transactionDate.getMonth() + i);

                    transactionsData.push({
                        group_id: data.group_id,
                        user_id: userId,
                        category_id: categoryMatch.id,
                        installment_id: installmentId,
                        amount: installmentValue,
                        type: parsedAiData.type,
                        description: `${parsedAiData.description} (${i + 1}/${parsedAiData.installments_count})`,
                        date: transactionDate,
                        is_paid: false
                    });
                }

                const [installment, createdTransactions] = await prisma.$transaction([
                    prisma.installment.create({
                        data: {
                            id: installmentId,
                            group_id: data.group_id,
                            total_amount: parsedAiData.amount,
                            installments_count: parsedAiData.installments_count,
                            description: parsedAiData.description,
                            created_at: new Date()
                        }
                    }),
                    prisma.transaction.createMany({
                        data: transactionsData
                    })
                ]);

                return res.status(201).json({
                    message: 'Parcelamento registrado via IA com sucesso!',
                    installment,
                    created_transactions: createdTransactions.count,
                    ai_raw_data: parsedAiData
                });

            } else {
                // Criação de Transação Simples
                const transaction = await prisma.transaction.create({
                    data: {
                        group_id: data.group_id,
                        user_id: userId,
                        category_id: categoryMatch.id,
                        amount: parsedAiData.amount,
                        type: parsedAiData.type,
                        description: parsedAiData.description,
                        date: new Date(parsedAiData.date),
                        is_paid: parsedAiData.type === 'EXPENSE' ? false : true // Heurística: despesa nasce não paga, receita nasce paga
                    }
                });

                return res.status(201).json({
                    message: 'Transação registrada via IA com sucesso!',
                    transaction,
                    ai_raw_data: parsedAiData
                });
            }

        } catch (error: any) {
            console.error("ERRO GLOBAL NA IA:", error);
            return res.status(400).json({ error: error.issues || 'Erro interno no processamento da IA' });
        }
    }
}
