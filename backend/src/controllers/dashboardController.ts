import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class DashboardController {

    static async getSummary(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const querySchema = z.object({
                month: z.string().regex(/^[1-9]$|^1[0-2]$/, "Mês deve ser entre 1 e 12"),
                year: z.string().regex(/^\d{4}$/, "Ano deve ter 4 dígitos")
            });

            const { month, year } = querySchema.parse(req.query);

            const m = parseInt(month);
            const y = parseInt(year);

            // Valida permissão
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para visualizar este dashboard' });
            }

            // Calculando início e fim do mês
            // No Javascript, mês inicia em 0 (Jan = 0)
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 1); // 1º dia do mês seguinte

            // Agrega Despesas
            const expensesAgg = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    group_id: groupId,
                    type: 'EXPENSE',
                    date: { gte: startDate, lt: endDate }
                }
            });

            // Agrega Receitas
            const incomeAgg = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    group_id: groupId,
                    type: 'INCOME',
                    date: { gte: startDate, lt: endDate }
                }
            });

            // Busca Savings
            const savings = await prisma.savings.findUnique({
                where: { group_id: groupId }
            });

            const totalExpenses = expensesAgg._sum.amount || 0;
            const totalIncome = incomeAgg._sum.amount || 0;
            const balance = totalIncome - totalExpenses;
            const savingsAmount = savings?.amount || 0;

            return res.status(200).json({
                total_income: totalIncome,
                total_expenses: totalExpenses,
                balance,
                savings_amount: savingsAmount
            });

        } catch (error: any) {
            console.error("ERRO AO BUSCAR RESUMO DO DASHBOARD:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao processar dados do dashboard' });
        }
    }
}
