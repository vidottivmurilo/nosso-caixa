import { expect, test, vi, describe, beforeEach } from 'vitest';
import { SavingsController } from './savingsController.js';
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

describe('Testes Unitários do SavingsController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('updateSavings: Deve retornar 403 se não tiver permissão', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: '123e4567-e89b-12d3-a456-426614174000' },
            body: { amount: 5000 }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await SavingsController.updateSavings(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('updateSavings: Deve criar caixinha (upsert) se ela não existir', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: '123e4567-e89b-12d3-a456-426614174000' },
            body: { amount: 5000 }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        
        const fakeSavings = { id: 's1', amount: 5000 };
        prismaMock.savings.upsert.mockResolvedValue(fakeSavings as any);

        await SavingsController.updateSavings(req, res);

        expect(prismaMock.savings.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { group_id: '123e4567-e89b-12d3-a456-426614174000' },
            update: { amount: 5000 },
            create: { group_id: '123e4567-e89b-12d3-a456-426614174000', amount: 5000 }
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Caixinha atualizada com sucesso',
            savings: fakeSavings
        });
    });

    test('getSavings: Deve retornar 200 com a caixinha atual', async () => {
        const req = {
            userId: 'user1',
            params: { groupId: '123e4567-e89b-12d3-a456-426614174000' }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        
        const fakeSavings = { id: 's1', amount: 5000 };
        prismaMock.savings.findUnique.mockResolvedValue(fakeSavings as any);

        await SavingsController.getSavings(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakeSavings);
    });

});
