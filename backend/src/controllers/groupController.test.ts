import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GroupController } from './groupController.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import type { Response } from 'express';
import { prismaMock } from '../lib/prisma.mock.js';

vi.mock('../lib/prisma.js', async () => {
    const { prismaMock } = await import('../lib/prisma.mock.js');
    return { prisma: prismaMock };
});

// Helper para criar um res fake reutilizável
function mockResponse() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    } as unknown as Response;
}

describe('Testes Unitários do GroupController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ========== createGroup ==========

    test('createGroup: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined, body: { name: "Família Silva" } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.createGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });

    test('createGroup: Deve retornar 400 com nome inválido (Zod)', async () => {
        const req = { userId: 'usuario-123', body: { name: "" } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.createGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    test('createGroup: Deve retornar 201 e criar o grupo com sucesso', async () => {
        const req = { userId: 'usuario-123', body: { name: "Grupo dos Amigos" } } as unknown as AuthRequest;
        const res = mockResponse();

        const fakeGroup = { id: 'grupo-123', name: 'Grupo dos Amigos', created_at: new Date() };
        prismaMock.group.create.mockResolvedValue(fakeGroup as any);

        await GroupController.createGroup(req, res);

        expect(prismaMock.group.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Grupo criado com sucesso!',
            group: fakeGroup
        });
    });

    // ========== listGroups ==========

    test('listGroups: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.listGroups(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('listGroups: Deve retornar 200 com a lista de grupos formatada', async () => {
        const req = { userId: 'usuario-123' } as unknown as AuthRequest;
        const res = mockResponse();

        const fakeUserGroups = [
            {
                group: { id: 'g1', name: 'Família', created_at: new Date('2026-01-01') },
                role: 'OWNER'
            },
            {
                group: { id: 'g2', name: 'Amigos', created_at: new Date('2026-02-01') },
                role: 'MEMBER'
            }
        ];
        prismaMock.userGroup.findMany.mockResolvedValue(fakeUserGroups as any);

        await GroupController.listGroups(req, res);

        expect(prismaMock.userGroup.findMany).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { id: 'g1', name: 'Família', created_at: new Date('2026-01-01'), my_role: 'OWNER' },
            { id: 'g2', name: 'Amigos', created_at: new Date('2026-02-01'), my_role: 'MEMBER' }
        ]);
    });

    // ========== inviteToGroup ==========

    test('inviteToGroup: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined, params: { groupId: 'g1' }, body: { email: 'a@a.com' } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.inviteToGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('inviteToGroup: Deve retornar 400 com e-mail inválido (Zod)', async () => {
        const req = { userId: 'u1', params: { groupId: 'g1' }, body: { email: 'nao-e-email' } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.inviteToGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('inviteToGroup: Deve retornar 403 se não for OWNER', async () => {
        const req = { userId: 'u1', params: { groupId: 'g1' }, body: { email: 'amigo@email.com' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await GroupController.inviteToGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Você não tem permissão para convidar membros para este grupo' });
    });

    test('inviteToGroup: Deve retornar 404 se o e-mail convidado não existir', async () => {
        const req = { userId: 'u1', params: { groupId: 'g1' }, body: { email: 'fantasma@email.com' } } as unknown as AuthRequest;
        const res = mockResponse();

        // O usuário que está convidando É owner
        prismaMock.userGroup.findFirst.mockResolvedValue({ role: 'OWNER' } as any);
        // O e-mail convidado não existe no banco
        prismaMock.user.findUnique.mockResolvedValue(null as any);

        await GroupController.inviteToGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum usuário encontrado com este e-mail' });
    });

    test('inviteToGroup: Deve retornar 400 se o usuário já estiver no grupo', async () => {
        const req = { userId: 'u1', params: { groupId: 'g1' }, body: { email: 'amigo@email.com' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst
            .mockResolvedValueOnce({ role: 'OWNER' } as any)  // 1ª chamada: verifica se é owner
            .mockResolvedValueOnce({ id: 'existing' } as any); // 2ª chamada: verifica se já está no grupo
        prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', email: 'amigo@email.com' } as any);

        await GroupController.inviteToGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Este usuário já está no grupo ou já possui um convite pendente' });
    });

    test('inviteToGroup: Deve retornar 201 ao convidar com sucesso', async () => {
        const req = { userId: 'u1', params: { groupId: 'g1' }, body: { email: 'amigo@email.com' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst
            .mockResolvedValueOnce({ role: 'OWNER' } as any)
            .mockResolvedValueOnce(null as any); // Não existe no grupo ainda
        prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', email: 'amigo@email.com' } as any);

        const fakeInvite = { id: 'inv1', user_id: 'u2', group_id: 'g1', role: 'MEMBER', status: 'PENDING' };
        prismaMock.userGroup.create.mockResolvedValue(fakeInvite as any);

        await GroupController.inviteToGroup(req, res);

        expect(prismaMock.userGroup.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Convite enviado com sucesso!',
            invite: fakeInvite
        });
    });

    // ========== listInvites ==========

    test('listInvites: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.listInvites(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('listInvites: Deve retornar 200 com convites formatados', async () => {
        const req = { userId: 'u2' } as unknown as AuthRequest;
        const res = mockResponse();

        const fakeInvites = [
            { group: { id: 'g1', name: 'Família' } },
            { group: { id: 'g2', name: 'Trabalho' } }
        ];
        prismaMock.userGroup.findMany.mockResolvedValue(fakeInvites as any);

        await GroupController.listInvites(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { group_id: 'g1', group_name: 'Família' },
            { group_id: 'g2', group_name: 'Trabalho' }
        ]);
    });

    // ========== acceptInvite ==========

    test('acceptInvite: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined, params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.acceptInvite(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('acceptInvite: Deve retornar 404 se não houver convite pendente', async () => {
        const req = { userId: 'u2', params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.updateMany.mockResolvedValue({ count: 0 } as any);

        await GroupController.acceptInvite(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Convite não encontrado ou já processado' });
    });

    test('acceptInvite: Deve retornar 200 ao aceitar com sucesso', async () => {
        const req = { userId: 'u2', params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.updateMany.mockResolvedValue({ count: 1 } as any);

        await GroupController.acceptInvite(req, res);

        expect(prismaMock.userGroup.updateMany).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Convite aceito com sucesso!' });
    });

    // ========== declineInvite ==========

    test('declineInvite: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined, params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        await GroupController.declineInvite(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('declineInvite: Deve retornar 404 se não houver convite pendente', async () => {
        const req = { userId: 'u2', params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.deleteMany.mockResolvedValue({ count: 0 } as any);

        await GroupController.declineInvite(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Convite não encontrado' });
    });

    test('declineInvite: Deve retornar 200 ao recusar com sucesso', async () => {
        const req = { userId: 'u2', params: { groupId: 'g1' } } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.deleteMany.mockResolvedValue({ count: 1 } as any);

        await GroupController.declineInvite(req, res);

        expect(prismaMock.userGroup.deleteMany).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Convite recusado com sucesso.' });
    });

});
