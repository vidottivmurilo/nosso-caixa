import { expect, test, vi, describe, beforeEach } from 'vitest';
import { GroupController } from './groupController.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import type { Response } from 'express';
import { prismaMock } from '../lib/prisma.mock.js';


vi.mock('../lib/prisma.js', async () => {
    const { prismaMock } = await import('../lib/prisma.mock.js');
    return { prisma: prismaMock };
});

describe('Testes Unitários do GroupController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('Deve retornar erro 401 se tentar criar grupo sem estar logado (sem userId)', async () => {
        const req = {
            userId: undefined,
            body: { name: "Família Silva" }
        } as unknown as AuthRequest;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;

        await GroupController.createGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });

    test('Deve retornar erro 400 se tentar criar grupo com nome inválido (Zod)', async () => {
        const req = {
            userId: 'usuario-123',
            body: { name: "" }
        } as unknown as AuthRequest;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;

        await GroupController.createGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    test('Deve retornar 201 e criar o grupo com sucesso', async () => {
        const req = {
            userId: 'usuario-123',
            body: { name: "Grupo dos Amigos" }
        } as unknown as AuthRequest;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;

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

});
