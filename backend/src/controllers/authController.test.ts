import { expect, test, vi, describe, beforeEach } from 'vitest';
import { AuthController } from './authController.js';
import type { Request, Response } from 'express';
import { prismaMock } from '../lib/prisma.mock.js';

vi.mock('../lib/prisma.js', async () => {
    const { prismaMock } = await import('../lib/prisma.mock.js');
    return { prisma: prismaMock };
});

// Mock do bcryptjs para não depender de hashing real nos testes
vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hash_falso_12345'),
        compare: vi.fn()
    }
}));

// Mock do jsonwebtoken para não depender de tokens reais
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn().mockReturnValue('token_falso_jwt_12345')
    }
}));

function mockResponse() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
    } as unknown as Response;
}

describe('Testes Unitários do AuthController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ========== register ==========

    test('register: Deve retornar 400 com dados inválidos (Zod - nome curto)', async () => {
        const req = { body: { name: "A", email: "teste@email.com", password: "123456" } } as Request;
        const res = mockResponse();

        await AuthController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    test('register: Deve retornar 400 com e-mail inválido (Zod)', async () => {
        const req = { body: { name: "Murilo", email: "nao-e-email", password: "123456" } } as Request;
        const res = mockResponse();

        await AuthController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('register: Deve retornar 400 com senha curta (Zod)', async () => {
        const req = { body: { name: "Murilo", email: "teste@email.com", password: "123" } } as Request;
        const res = mockResponse();

        await AuthController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('register: Deve retornar 400 se o e-mail já estiver em uso', async () => {
        const req = { body: { name: "Murilo", email: "existente@email.com", password: "123456" } } as Request;
        const res = mockResponse();

        prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'existente@email.com' } as any);

        await AuthController.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Este e-mail já está em uso.' });
    });

    test('register: Deve retornar 201 ao criar usuário com sucesso', async () => {
        const req = { body: { name: "Murilo", email: "novo@email.com", password: "123456" } } as Request;
        const res = mockResponse();

        // E-mail não existe no banco
        prismaMock.user.findUnique.mockResolvedValue(null as any);
        // Prisma cria o usuário
        const fakeUser = { id: 'u-novo', name: 'Murilo', email: 'novo@email.com', password_hash: 'hash_falso_12345' };
        prismaMock.user.create.mockResolvedValue(fakeUser as any);

        await AuthController.register(req, res);

        expect(prismaMock.user.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Usuário criado com sucesso!',
            user: { id: 'u-novo', name: 'Murilo', email: 'novo@email.com' }
        });
    });

    // ========== login ==========

    test('login: Deve retornar 401 se o e-mail não existir', async () => {
        const req = { body: { email: "fantasma@email.com", password: "123456" } } as Request;
        const res = mockResponse();

        prismaMock.user.findUnique.mockResolvedValue(null as any);

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'E-mail incorreto' });
    });

    test('login: Deve retornar 401 se a senha estiver errada', async () => {
        const req = { body: { email: "murilo@email.com", password: "senha_errada" } } as Request;
        const res = mockResponse();

        const fakeUser = { id: 'u1', name: 'Murilo', email: 'murilo@email.com', password_hash: 'hash_real' };
        prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);

        // Importamos o bcrypt mockado para controlar o resultado do compare
        const bcrypt = await import('bcryptjs');
        (bcrypt.default.compare as any).mockResolvedValue(false);

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Senha incorreta' });
    });

    test('login: Deve retornar 200 com token ao fazer login com sucesso', async () => {
        const req = { body: { email: "murilo@email.com", password: "123456" } } as Request;
        const res = mockResponse();

        const fakeUser = { id: 'u1', name: 'Murilo', email: 'murilo@email.com', password_hash: 'hash_real' };
        prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);

        const bcrypt = await import('bcryptjs');
        (bcrypt.default.compare as any).mockResolvedValue(true);

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login realizado com sucesso',
            token: 'token_falso_jwt_12345',
            user: { id: 'u1', name: 'Murilo', email: 'murilo@email.com' }
        });
    });

});
