import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export class AuthController {

    // Função para Registrar (Cadastrar) um usuário
    static async register(req: Request, res: Response): Promise<any> {
        try {
            // 1. Zod: Criamos as regras de validação que exigimos
            const registerSchema = z.object({
                name: z.string().min(2, "Nome muito curto"),
                email: z.string().email("Formato de e-mail inválido"),
                password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres")
            });

            // 2. Validamos o que chegou no "corpo" da requisição
            const data = registerSchema.parse(req.body);

            // 3. Verificamos se o e-mail já existe no banco
            const userExists = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (userExists) {
                return res.status(400).json({ error: 'Este e-mail já está em uso.' });
            }

            // 4. Criptografamos a senha! (O número 10 é o custo do cálculo, padrão seguro)
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // 5. Salva no banco de dados!
            const user = await prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password_hash: hashedPassword
                }
            });

            // Retorna sucesso (Sem devolver a senha, claro!)
            return res.status(201).json({
                message: 'Usuário criado com sucesso!',
                user: { id: user.id, name: user.name, email: user.email }
            });

        } catch (error: any) {
            // Se a validação do Zod falhar, ele cai aqui
            return res.status(400).json({ error: error.issues || 'Erro ao criar usuário' });
        }
    }

    // Função para fazer o Login (Em breve na Parte 4)
    static async login(req: Request, res: Response) {
        // Faremos isso no próximo passo!
    }
}
