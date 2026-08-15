import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { EmailService } from '../services/emailService.js';

export class AuthController {

    static async register(req: Request, res: Response): Promise<any> {
        try {
            const registerSchema = z.object({
                name: z.string().min(2, "Nome muito curto"),
                email: z.string().email("Formato de e-mail inválido"),
                password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres")
            });

            const data = registerSchema.parse(req.body);

            const userExists = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (userExists) {
                return res.status(400).json({ error: 'Este e-mail já está em uso.' });
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);

            const user = await prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password_hash: hashedPassword
                }
            });

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            await prisma.userToken.create({
                data: {
                    token: code,
                    user_id: user.id,
                    expires_at: new Date(Date.now() + 15 * 60 * 1000)
                }
            });

            await EmailService.sendVerificationEmail(user.email, code);

            return res.status(201).json({
                message: 'Usuário criado com sucesso. Verifique seu e-mail!',
                user: { id: user.id, name: user.name, email: user.email }
            });

        } catch (error: any) {
            console.error("ERRO NO CADASTRO:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao criar usuário' });
        }
    }

    static async login(req: Request, res: Response): Promise<any> {
        try {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({ error: 'E-mail incorreto' });
            }

            if (!user.is_email_verified) {
                return res.status(403).json({ error: 'Sua conta ainda não foi ativada. Verifique seu e-mail.' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Senha incorreta' });
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || '9d5c3f8e7b1a0294c6d8e7b1a0294c6d', {
                expiresIn: '7d'
            });

            return res.status(200).json({
                message: 'Login realizado com sucesso',
                token,
                user: { id: user.id, name: user.name, email: user.email }
            });

        } catch (error) {
            console.error("ERRO NO LOGIN:", error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    }

    static async verifyEmail(req: Request, res: Response): Promise<any> {
        try {
            const verifySchema = z.object({
                email: z.string().email(),
                code: z.string().length(6)
            });

            const data = verifySchema.parse(req.body);

            const user = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (!user) {
                return res.status(400).json({ error: 'Usuário não encontrado' });
            }

            const tokenRecord = await prisma.userToken.findFirst({
                where: {
                    user_id: user.id,
                    token: data.code,
                    expires_at: { gt: new Date() } // Somente se não expirou
                }
            });

            if (!tokenRecord) {
                return res.status(400).json({ error: 'Código inválido ou expirado' });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { is_email_verified: true }
            });

            await prisma.userToken.delete({
                where: { id: tokenRecord.id }
            });

            return res.status(200).json({ message: 'E-mail verificado com sucesso!' });

        } catch (error: any) {
            console.error("ERRO NA VERIFICAÇÃO:", error);
            return res.status(400).json({ error: error.issues || 'Erro ao verificar e-mail' });
        }
    }
}
