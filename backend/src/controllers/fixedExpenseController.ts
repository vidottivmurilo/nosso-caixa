import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class FixedExpenseController {

    static async createFixedExpense(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const createSchema = z.object({
                group_id: z.string().uuid(),
                category_id: z.string().uuid(),
                amount: z.number().positive("O valor deve ser positivo"),
                description: z.string().min(1, "A descrição é obrigatória"),
                day_of_month: z.number().int().min(1).max(31, "O dia deve ser entre 1 e 31")
            });

            const data = createSchema.parse(req.body);

            // Verifica permissão no grupo
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: data.group_id }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para adicionar contas neste grupo' });
            }

            // Verifica se a categoria existe
            const category = await prisma.category.findUnique({
                where: { id: data.category_id }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            const fixedExpense = await prisma.fixedExpense.create({
                data: {
                    group_id: data.group_id,
                    category_id: data.category_id,
                    amount: data.amount,
                    description: data.description,
                    day_of_month: data.day_of_month
                }
            });

            return res.status(201).json({
                message: 'Despesa fixa registrada com sucesso!',
                fixedExpense
            });

        } catch (error: any) {
            console.error("ERRO AO CRIAR DESPESA FIXA:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao criar despesa fixa' });
        }
    }

    static async listFixedExpenses(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Sem permissão para ver contas deste grupo' });
            }

            const expenses = await prisma.fixedExpense.findMany({
                where: { group_id: groupId, is_active: true },
                include: { category: true }
            });

            return res.status(200).json(expenses);
        } catch (error) {
            console.error("ERRO AO LISTAR DESPESAS FIXAS:", error);
            return res.status(500).json({ error: 'Erro ao listar despesas fixas' });
        }
    }

    static async generateMonth(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Sem permissão para acionar geração neste grupo' });
            }

            // Busca todas as contas fixas ativas
            const fixedExpenses = await prisma.fixedExpense.findMany({
                where: { group_id: groupId, is_active: true }
            });

            let transactionsCreated = 0;
            const now = new Date();
            
            // O início e fim do mês atual, para buscar duplicidades
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            for (const expense of fixedExpenses) {
                // Verifica se JÁ EXISTE uma transação gerada para esta conta neste mês
                const existingTransaction = await prisma.transaction.findFirst({
                    where: {
                        fixed_expense_id: expense.id,
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });

                if (!existingTransaction) {
                    // Prepara a data de vencimento da transação
                    // Se o dia configurado for maior que o último dia do mês, pega o último dia do mês
                    const lastDayOfMonth = endOfMonth.getDate();
                    const targetDay = expense.day_of_month > lastDayOfMonth ? lastDayOfMonth : expense.day_of_month;
                    
                    const transactionDate = new Date(now.getFullYear(), now.getMonth(), targetDay, 12, 0, 0);

                    await prisma.transaction.create({
                        data: {
                            group_id: expense.group_id,
                            user_id: userId, // Quem acionou a geração (ou o dono, mas usaremos quem acionou por conveniência)
                            category_id: expense.category_id,
                            fixed_expense_id: expense.id,
                            amount: expense.amount,
                            type: 'EXPENSE',
                            description: expense.description,
                            date: transactionDate,
                            is_paid: false
                        }
                    });
                    transactionsCreated++;
                }
            }

            return res.status(200).json({
                message: 'Rotina de geração finalizada.',
                transactions_created: transactionsCreated
            });

        } catch (error) {
            console.error("ERRO AO GERAR DESPESAS DO MÊS:", error);
            return res.status(500).json({ error: 'Erro ao rodar rotina de despesas fixas' });
        }
    }
}
