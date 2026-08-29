import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export interface AuthRequest extends Request {
    userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): any {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    try {
        const secret = process.env.JWT_SECRET as string;

        const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

        req.userId = decoded.id;

        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
