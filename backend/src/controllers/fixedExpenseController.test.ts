import { expect, test, vi, describe, beforeEach } from 'vitest';
import { FixedExpenseController } from './fixedExpenseController.js';
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

describe('Testes Unitários do FixedExpenseController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ========== createFixedExpense ==========

    test('createFixedExpense: Deve retornar 403 se o usuário não for membro do grupo', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                amount: 150.5,
                description: 'Conta de Internet',
                day_of_month: 10
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await FixedExpenseController.createFixedExpense(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('createFixedExpense: Deve retornar 201 ao criar despesa fixa com sucesso', async () => {
        const req = {
            userId: 'user1',
            body: {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
                category_id: '123e4567-e89b-12d3-a456-426614174001',
                amount: 150.5,
                description: 'Conta de Internet',
                day_of_month: 10
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findUnique.mockResolvedValue({ id: 'cat1' } as any);
        
        const fakeFixed = { id: 'fixed1', description: 'Conta de Internet' };
        prismaMock.fixedExpense.create.mockResolvedValue(fakeFixed as any);

        await FixedExpenseController.createFixedExpense(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Despesa fixa registrada com sucesso!',
            fixedExpense: fakeFixed
        });
    });

    // ========== listFixedExpenses ==========

    test('listFixedExpenses: Deve retornar 403 se não for membro do grupo', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: '123e4567-e89b-12d3-a456-426614174000' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await FixedExpenseController.listFixedExpenses(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('listFixedExpenses: Deve retornar 200 com a lista de contas', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        const fakes = [{ id: 'f1' }, { id: 'f2' }];
        prismaMock.fixedExpense.findMany.mockResolvedValue(fakes as any);

        await FixedExpenseController.listFixedExpenses(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakes);
    });

    // ========== generateMonth ==========

    test('generateMonth: Não deve gerar transações se já existirem no mês atual', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);

        // Retorna 1 despesa fixa ativa
        const fixedExpense = { id: 'f1', amount: 100, day_of_month: 10, category_id: 'c1', description: 'Internet' };
        prismaMock.fixedExpense.findMany.mockResolvedValue([fixedExpense] as any);

        // Prisma acha uma transação já existente neste mês para esta conta fixa!
        prismaMock.transaction.findFirst.mockResolvedValue({ id: 't1' } as any);

        await FixedExpenseController.generateMonth(req, res);

        // Não deve chamar create
        expect(prismaMock.transaction.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Rotina de geração finalizada.',
            transactions_created: 0
        });
    });

    test('generateMonth: Deve gerar a transação se não existir no mês', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);

        const fixedExpense = { id: 'f1', amount: 100, day_of_month: 10, category_id: 'c1', description: 'Internet', group_id: 'group1' };
        prismaMock.fixedExpense.findMany.mockResolvedValue([fixedExpense] as any);

        // Prisma não acha transação (então precisa gerar!)
        prismaMock.transaction.findFirst.mockResolvedValue(null as any);
        prismaMock.transaction.create.mockResolvedValue({ id: 't-new' } as any);

        await FixedExpenseController.generateMonth(req, res);

        expect(prismaMock.transaction.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Rotina de geração finalizada.',
            transactions_created: 1
        });
    });

});
