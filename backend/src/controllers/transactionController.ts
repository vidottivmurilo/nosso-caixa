import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class TransactionController {

    static async createTransaction(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const createTransactionSchema = z.object({
                group_id: z.string().uuid(),
                category_id: z.string().uuid(),
                amount: z.number().positive("O valor deve ser positivo"),
                type: z.enum(['INCOME', 'EXPENSE']),
                description: z.string().min(1, "A descrição é obrigatória"),
                date: z.string().datetime() // Formato ISO 8601
            });

            const data = createTransactionSchema.parse(req.body);

            // Verifica se o usuário é membro do grupo
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: data.group_id }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para adicionar transações neste grupo' });
            }

            // Verifica se a categoria existe
            const category = await prisma.category.findUnique({
                where: { id: data.category_id }
            });

            if (!category) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            const transaction = await prisma.transaction.create({
                data: {
                    group_id: data.group_id,
                    user_id: userId,
                    category_id: data.category_id,
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                    date: new Date(data.date)
                }
            });

            return res.status(201).json({
                message: 'Transação criada com sucesso!',
                transaction
            });

        } catch (error: any) {
            console.error("ERRO AO CRIAR TRANSAÇÃO:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao criar transação' });
        }
    }

    static async listTransactions(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;
            
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            // Verifica permissão no grupo
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Sem permissão para ver transações deste grupo' });
            }

            const transactions = await prisma.transaction.findMany({
                where: { group_id: groupId },
                include: { category: true, user: { select: { id: true, name: true } } },
                orderBy: { date: 'desc' }
            });

            return res.status(200).json(transactions);

        } catch (error) {
            console.error("ERRO AO LISTAR TRANSAÇÕES:", error);
            return res.status(500).json({ error: 'Erro ao listar transações' });
        }
    }

    static async deleteTransaction(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const transactionId = req.params.id as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            // Busca a transação
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId }
            });

            if (!transaction) {
                return res.status(404).json({ error: 'Transação não encontrada' });
            }

            // Verifica se o usuário pertence ao grupo da transação
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: transaction.group_id }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Sem permissão para deletar esta transação' });
            }

            await prisma.transaction.delete({
                where: { id: transactionId }
            });

            return res.status(200).json({ message: 'Transação removida com sucesso' });

        } catch (error) {
            console.error("ERRO AO DELETAR TRANSAÇÃO:", error);
            return res.status(500).json({ error: 'Erro ao deletar transação' });
        }
    }
}
