import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const masterKey = process.env.OMNIROUTE_API_KEY;
    if (!masterKey) return next(); // Se não configurada, libera o acesso local

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token || token !== masterKey) {
        return res.status(401).json({
            error: {
                message: 'Invalid or missing API key in Authorization header.',
                type: 'authentication_error'
            }
        });
    }
    next();
}