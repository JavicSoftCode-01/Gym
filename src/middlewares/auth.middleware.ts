import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";

// Extendemos Request para que TypeScript reconozca req.user
export interface AuthRequest extends Request {
    user?: { id: number; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; role: string };
        req.user = decoded; // Guardamos los datos del Admin en la petición
        next(); // Permitir que la petición continúe
    } catch (error) {
        res.status(401).json({ error: "Token inválido o expirado." });
    }
};

// Alias para consistencia en otras rutas
export const authMiddleware = requireAuth;

// RBAC: requiere un rol específico (ej. 'admin')
export const requireRole = (role: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: "No autenticado." });
        return;
    }
    if (req.user.role !== role) {
        res.status(403).json({ error: `Acceso denegado. Se requiere el rol '${role}'.` });
        return;
    }
    next();
};