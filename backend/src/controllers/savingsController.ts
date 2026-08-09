import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class SavingsController {

    static async updateSavings(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const bodySchema = z.object({
                amount: z.number().min(0, "O valor não pode ser negativo")
            });

            const data = bodySchema.parse(req.body);

            // Valida permissão
            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para alterar dados deste grupo' });
            }

            // Upsert (Atualiza se existir, cria se não existir)
            const savings = await prisma.savings.upsert({
                where: { group_id: groupId },
                update: { amount: data.amount },
                create: { group_id: groupId, amount: data.amount }
            });

            return res.status(200).json({
                message: 'Caixinha atualizada com sucesso',
                savings
            });

        } catch (error: any) {
            console.error("ERRO AO ATUALIZAR CAIXINHA:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao atualizar caixinha' });
        }
    }

    static async getSavings(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const userInGroup = await prisma.userGroup.findFirst({
                where: { user_id: userId, group_id: groupId }
            });

            if (!userInGroup) {
                return res.status(403).json({ error: 'Você não tem permissão para visualizar dados deste grupo' });
            }

            const savings = await prisma.savings.findUnique({
                where: { group_id: groupId }
            });

            return res.status(200).json(savings || { amount: 0 });

        } catch (error) {
            console.error("ERRO AO BUSCAR CAIXINHA:", error);
            return res.status(500).json({ error: 'Erro ao buscar caixinha' });
        }
    }
}
