import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class InstallmentController {

    static async createInstallment(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const createSchema = z.object({
                group_id: z.string().uuid(),
                category_id: z.string().uuid(),
                total_amount: z.number().positive("O valor total deve ser positivo"),
                installments_count: z.number().int().min(2, "O parcelamento deve ter no mínimo 2 parcelas"),
                start_date: z.string().datetime(),
                description: z.string().min(1, "A descrição é obrigatória")
            });

            const data = createSchema.parse(req.body);

            // Verifica se o usuário é membro do grupo
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: data.group_id }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para parcelar compras neste grupo' });
            }

            // Verifica se a categoria existe
            const category = await prisma.category.findUnique({
                where: { id: data.category_id }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            // Lógica matemática
            const installmentValue = data.total_amount / data.installments_count;
            const startDate = new Date(data.start_date);

            // Geramos um UUID para o Installment manualmente para poder atrelar nas transações antes mesmo de criá-lo no banco
            const installmentId = crypto.randomUUID();

            const transactionsData = [];

            for (let i = 0; i < data.installments_count; i++) {
                // Clona a data inicial
                const transactionDate = new Date(startDate);
                // Adiciona N meses (cuidando automaticamente com as viradas de ano)
                transactionDate.setMonth(transactionDate.getMonth() + i);

                transactionsData.push({
                    group_id: data.group_id,
                    user_id: userId,
                    category_id: data.category_id,
                    installment_id: installmentId,
                    amount: installmentValue,
                    type: 'EXPENSE', // Por padrão, parcelamentos são despesas
                    description: `${data.description} (${i + 1}/${data.installments_count})`,
                    date: transactionDate,
                    is_paid: false // Normalmente parcelas futuras nascem não pagas
                });
            }

            // Usamos $transaction para garantir que ou salva TUDO (parcelamento + N transações), ou não salva NADA
            const [installment, createdTransactions] = await prisma.$transaction([
                prisma.installment.create({
                    data: {
                        id: installmentId,
                        group_id: data.group_id,
                        total_amount: data.total_amount,
                        installments_count: data.installments_count,
                        description: data.description,
                        created_at: new Date()
                    }
                }),
                prisma.transaction.createMany({
                    data: transactionsData
                })
            ]);

            return res.status(201).json({
                message: 'Parcelamento registrado com sucesso!',
                installment,
                created_transactions: createdTransactions.count
            });

        } catch (error: any) {
            console.error("ERRO AO CRIAR PARCELAMENTO:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao criar parcelamento' });
        }
    }
}
