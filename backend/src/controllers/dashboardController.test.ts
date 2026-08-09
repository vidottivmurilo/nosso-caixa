import { expect, test, vi, describe, beforeEach } from 'vitest';
import { DashboardController } from './dashboardController.js';
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

describe('Testes Unitários do DashboardController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('getSummary: Deve retornar 403 se usuário não tiver permissão', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: 'group1' },
            query: { month: '8', year: '2026' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await DashboardController.getSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('getSummary: Deve retornar o resumo correto com cálculos matemáticos (200)', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: '123e4567-e89b-12d3-a456-426614174000' },
            query: { month: '8', year: '2026' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);

        // Simulando que o Prisma retorna 1500 de despesas
        prismaMock.transaction.aggregate
            // @ts-ignore (primeira chamada: EXPENSE)
            .mockResolvedValueOnce({ _sum: { amount: 1500 } } as any)
            // @ts-ignore (segunda chamada: INCOME)
            .mockResolvedValueOnce({ _sum: { amount: 5000 } } as any);

        // Simulando Caixinha de 2000
        prismaMock.savings.findUnique.mockResolvedValue({ amount: 2000 } as any);

        await DashboardController.getSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            total_income: 5000,
            total_expenses: 1500,
            balance: 3500, // 5000 - 1500
            savings_amount: 2000
        });
    });

});
