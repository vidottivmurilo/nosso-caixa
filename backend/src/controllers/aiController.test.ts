import { expect, test, vi, describe, beforeEach } from 'vitest';
import { AiController } from './aiController.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import type { Response } from 'express';
import { prismaMock } from '../lib/prisma.mock.js';

vi.mock('../lib/prisma.js', async () => {
    const { prismaMock } = await import('../lib/prisma.mock.js');
    return { prisma: prismaMock };
});

const { mockGenerateContent } = vi.hoisted(() => {
    return { mockGenerateContent: vi.fn() };
});

// Mock do módulo de IA do Google
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models = {
                generateContent: mockGenerateContent
            };
        }
    };
});

function mockResponse() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    } as unknown as Response;
}

describe('Testes Unitários do AiController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('parseTransaction: Deve retornar 403 se o usuário não pertencer ao grupo', async () => {
        const req = {
            userId: 'user1',
            body: {
                text: 'gastei 50 no mercado',
                group_id: '123e4567-e89b-12d3-a456-426614174000'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue(null as any);

        await AiController.parseTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('parseTransaction: Deve retornar 400 se a IA devolver um JSON mal formatado', async () => {
        const req = {
            userId: 'user1',
            body: {
                text: 'gastei 50 no mercado',
                group_id: '123e4567-e89b-12d3-a456-426614174000'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findMany.mockResolvedValue([{ name: 'Alimentação' }] as any);

        // Simulando a IA devolvendo um lixo
        mockGenerateContent.mockResolvedValue({ text: 'Isso não é um JSON válido' });

        await AiController.parseTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Erro ao interpretar a resposta da IA. Tente reescrever a frase de forma mais clara.' }));
    });

    test('parseTransaction: Deve retornar 400 se a IA inventar uma categoria inexistente', async () => {
        const req = {
            userId: 'user1',
            body: {
                text: 'comprei uma bazuca',
                group_id: '123e4567-e89b-12d3-a456-426614174000'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findMany.mockResolvedValue([{ id: 'c1', name: 'Alimentação' }] as any);

        // Simulando a IA retornando uma categoria "Armas" que não existe
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({
                description: 'Bazuca',
                amount: 500,
                type: 'EXPENSE',
                category: 'Armas',
                is_installment: false,
                date: '2026-08-09T00:00:00Z'
            })
        });

        await AiController.parseTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Categoria "Armas" não foi encontrada no sistema.' }));
    });

    test('parseTransaction: Deve criar uma transação SIMPLES com sucesso (201)', async () => {
        const req = {
            userId: 'user1',
            body: {
                text: 'gastei 50 no mercado',
                group_id: '123e4567-e89b-12d3-a456-426614174000'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findMany.mockResolvedValue([{ id: 'cat-alimentacao', name: 'Alimentação' }] as any);

        // IA responde corretamente
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({
                description: 'Supermercado',
                amount: 50,
                type: 'EXPENSE',
                category: 'Alimentação',
                is_installment: false,
                date: '2026-08-09T00:00:00Z'
            })
        });

        const fakeTransaction = { id: 't1' };
        prismaMock.transaction.create.mockResolvedValue(fakeTransaction as any);

        await AiController.parseTransaction(req, res);

        expect(prismaMock.transaction.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Transação registrada via IA com sucesso!' }));
    });

    test('parseTransaction: Deve criar um PARCELAMENTO com sucesso (201)', async () => {
        const req = {
            userId: 'user1',
            body: {
                text: 'comprei uma tv por 1000 em 10x',
                group_id: '123e4567-e89b-12d3-a456-426614174000'
            }
        } as unknown as AuthRequest;
        const res = mockResponse();

        prismaMock.userGroup.findFirst.mockResolvedValue({ id: 'ug1' } as any);
        prismaMock.category.findMany.mockResolvedValue([{ id: 'cat-eletronicos', name: 'Eletrônicos' }] as any);

        // IA responde que é parcelado
        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({
                description: 'TV',
                amount: 1000,
                type: 'EXPENSE',
                category: 'Eletrônicos',
                is_installment: true,
                installments_count: 10,
                date: '2026-08-09T00:00:00Z'
            })
        });

        prismaMock.$transaction.mockResolvedValue([{ id: 'inst1' }, { count: 10 }] as any);

        await AiController.parseTransaction(req, res);

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Parcelamento registrado via IA com sucesso!' }));
    });

});
