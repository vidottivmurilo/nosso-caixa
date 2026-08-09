import { expect, test, vi, describe, beforeEach } from 'vitest';
import { TransactionController } from './transactionController.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import type { Response } from 'express';
import { prismaMock } from '../lib/prisma.mock.js';

vi.mock('../lib/prisma.js', async () => {
    const { prismaMock } = await import('../lib/prisma.mock.js');
    return { prisma: prismaMock };
});

function mockResponse() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    } as unknown as Response;
}

describe('Testes Unitários do TransactionController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ========== createTransaction ==========

    test('createTransaction: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined } as unknown as AuthRequest;
        const res = mockResponse();

        await TransactionController.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('createTransaction: Deve retornar 400 com payload inválido (Zod)', async () => {
        const req = {
            userId: 'user1',
            body: { amount: -100 } // Valor negativo intencional para falhar o Zod
        } as unknown as AuthRequest;
        const res = mockResponse();

        await TransactionController.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('createTransaction: Deve retornar 403 se o usuário não for membro do grupo', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                amount: 150.5,
                type: 'EXPENSE',
                description: 'Conta',
                date: '2026-08-01T00:00:00Z'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        // Prisma finge que o usuário não está no grupo
        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await TransactionController.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Você não tem permissão para adicionar transações neste grupo' });
    });

    test('createTransaction: Deve retornar 201 ao criar transação com sucesso', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                amount: 150.5,
                type: 'EXPENSE',
                description: 'Conta de luz',
                date: '2026-08-01T00:00:00.000Z'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        // Usuário é membro do grupo
        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        
        // Categoria existe
        prismaMock.category.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174001' } as any);

        const fakeTransaction = {
            id: 'trans1',
            group_id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: 'user1',
            category_id: '123e4567-e89b-12d3-a456-426614174001',
            amount: 150.5,
            type: 'EXPENSE',
            description: 'Conta de luz',
            date: new Date('2026-08-01T00:00:00Z'),
            is_paid: true,
            created_at: new Date()
        };
        
        prismaMock.transaction.create.mockResolvedValue(fakeTransaction as any);

        await TransactionController.createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Transação criada com sucesso!',
            transaction: fakeTransaction
        });
    });

    // ========== listTransactions ==========

    test('listTransactions: Deve retornar 403 se o usuário tentar listar de grupo que não pertence', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await TransactionController.listTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('listTransactions: Deve retornar 200 e a lista de transações do grupo', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' },
            query: {}
        } as unknown as AuthRequest;
        const res = mockResponse();

        // Usuário pertence ao grupo
        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        
        const fakeTransactions = [
            { id: 't1', description: 'Conta de luz', amount: 100 },
            { id: 't2', description: 'Conta de água', amount: 50 }
        ];
        prismaMock.transaction.findMany.mockResolvedValue(fakeTransactions as any);

        await TransactionController.listTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakeTransactions);
    });

    // ========== deleteTransaction ==========

    test('deleteTransaction: Deve retornar 404 se a transação não existir', async () => {
        const req = {
            userId: 'user1',
            params: { id: 'trans1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.transaction.findUnique.mockResolvedValue(null as any);

        await TransactionController.deleteTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Transação não encontrada' });
    });

    test('deleteTransaction: Deve retornar 403 se tentar deletar transação de outro grupo', async () => {
        const req = {
            userId: 'user1',
            params: { id: 'trans1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.transaction.findUnique.mockResolvedValue({ id: 'trans1', group_id: 'group1' } as any);
        // O usuário não faz parte do group1
        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await TransactionController.deleteTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('deleteTransaction: Deve retornar 200 ao deletar transação com sucesso', async () => {
        const req = {
            userId: 'user1',
            params: { id: 'trans1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.transaction.findUnique.mockResolvedValue({ id: 'trans1', group_id: 'group1' } as any);
        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any); // Usuário no grupo
        prismaMock.transaction.delete.mockResolvedValue({ id: 'trans1' } as any);

        await TransactionController.deleteTransaction(req, res);

        expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: 'trans1' } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Transação removida com sucesso' });
    });

});
