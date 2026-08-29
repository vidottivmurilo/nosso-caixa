import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export class GroupController {

    static async createGroup(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const createGroupSchema = z.object({
                name: z.string().min(1, "O nome do grupo deve ter no mínimo 1 caracteres")
            });
            const data = createGroupSchema.parse(req.body);

            const group = await prisma.group.create({
                data: {
                    name: data.name,
                    users: {
                        create: {
                            user_id: userId,
                            role: 'OWNER',
                            status: 'ACCEPTED'
                        }
                    }
                }
            });

            return res.status(201).json({
                message: 'Grupo criado com sucesso!',
                group
            });
        } catch (error: any) {
            console.error("ERRO AO CRIAR GRUPO:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao criar grupo' });
        }
    }

    static async listGroups(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const myGroups = await prisma.userGroup.findMany({
                where: {
                    user_id: userId,
                    status: 'ACCEPTED'
                },
                include: {
                    group: true
                }
            });

            const formattedGroups = myGroups.map(ug => ({
                id: ug.group.id,
                name: ug.group.name,
                created_at: ug.group.created_at,
                role: ug.role
            }));

            return res.status(200).json(formattedGroups);

        } catch (error) {
            console.error("ERRO AO LISTAR GRUPOS:", error);
            return res.status(500).json({ error: 'Erro ao listar grupos' });
        }
    }

    static async inviteToGroup(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const inviteSchema = z.object({
                email: z.string().email("E-mail inválido")
            });
            const { email } = inviteSchema.parse(req.body);

            const isOwner = await prisma.userGroup.findFirst({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    role: 'OWNER'
                }
            });

            if (!isOwner) {
                return res.status(403).json({ error: 'Você não tem permissão para convidar membros para este grupo' });
            }

            const invitedUser = await prisma.user.findUnique({
                where: { email }
            });

            if (!invitedUser) {
                return res.status(404).json({ error: 'Nenhum usuário encontrado com este e-mail' });
            }

            const alreadyInGroup = await prisma.userGroup.findFirst({
                where: { user_id: invitedUser.id, group_id: groupId }
            });

            if (alreadyInGroup) {
                return res.status(400).json({ error: 'Este usuário já está no grupo ou já possui um convite pendente' });
            }

            const invite = await prisma.userGroup.create({
                data: {
                    user_id: invitedUser.id,
                    group_id: groupId,
                    role: 'MEMBER',
                    status: 'PENDING'
                }
            });

            return res.status(201).json({
                message: 'Convite enviado com sucesso!',
                invite
            });

        } catch (error: any) {
            console.error("ERRO AO CONVIDAR:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao enviar convite' });
        }
    }

    static async listInvites(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const myInvites = await prisma.userGroup.findMany({
                where: {
                    user_id: userId,
                    status: 'PENDING'
                },
                include: { group: true }
            });

            const formattedInvites = myInvites.map(ug => ({
                id: ug.id,
                status: ug.status,
                group: {
                    id: ug.group.id,
                    name: ug.group.name
                }
            }));

            return res.status(200).json(formattedInvites);

        } catch (error) {
            console.error("ERRO AO LISTAR CONVITES:", error);
            return res.status(500).json({ error: 'Erro ao listar convites' });
        }
    }

    static async acceptInvite(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const result = await prisma.userGroup.updateMany({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'PENDING'
                },
                data: {
                    status: 'ACCEPTED'
                }
            });

            if (result.count === 0) {
                return res.status(404).json({ error: 'Convite não encontrado ou já processado' });
            }

            return res.status(200).json({ message: 'Convite aceito com sucesso!' });

        } catch (error) {
            console.error("ERRO AO ACEITAR CONVITE:", error);
            return res.status(500).json({ error: 'Erro ao aceitar convite' });
        }
    }

    static async declineInvite(req: AuthRequest, res: Response): Promise<any> {
        try {
            const userId = req.userId;
            const groupId = req.params.groupId as string;

            if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

            const result = await prisma.userGroup.deleteMany({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'PENDING'
                }
            });

            if (result.count === 0) {
                return res.status(404).json({ error: 'Convite não encontrado' });
            }

            return res.status(200).json({ message: 'Convite recusado com sucesso.' });

        } catch (error) {
            console.error("ERRO AO RECUSAR CONVITE:", error);
            return res.status(500).json({ error: 'Erro ao recusar convite' });
        }
    }

}