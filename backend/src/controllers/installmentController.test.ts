import { expect, test, vi, describe, beforeEach } from 'vitest';
import { InstallmentController } from './installmentController.js';
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

describe('Testes Unitários do InstallmentController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('createInstallment: Deve retornar 401 sem userId', async () => {
        const req = { userId: undefined } as unknown as AuthRequest;
        const res = mockResponse();

        await InstallmentController.createInstallment(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('createInstallment: Deve retornar 400 com payload inválido (Zod)', async () => {
        const req = {
            userId: 'user1',
            body: { total_amount: -100 } // Valor negativo intencional para falhar o Zod
        } as unknown as AuthRequest;
        const res = mockResponse();

        await InstallmentController.createInstallment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('createInstallment: Deve retornar 403 se o usuário não for membro do grupo', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                total_amount: 1000,
                installments_count: 10,
                start_date: '2026-08-10T00:00:00Z',
                description: 'Geladeira'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await InstallmentController.createInstallment(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('createInstallment: Deve retornar 201 e criar Installment + N Transactions (Batch)', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                total_amount: 1000,
                installments_count: 10,
                start_date: '2026-08-10T00:00:00Z',
                description: 'Geladeira'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174001' } as any);

        const fakeInstallment = { id: 'inst1' };
        
        // Simular que a transação do Prisma (batch) ocorreu com sucesso
        prismaMock.$transaction.mockResolvedValue([
            fakeInstallment,
            { count: 10 } // Retorno do createMany
        ] as any);

        await InstallmentController.createInstallment(req, res);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Parcelamento registrado com sucesso!',
            installment: fakeInstallment,
            created_transactions: 10
        });
    });

});
