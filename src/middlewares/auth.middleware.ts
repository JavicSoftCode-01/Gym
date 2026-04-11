import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "CLAVE_SECRETA_SUPER_SEGURA_GYM_2024";

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
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
        req.user = decoded; // Guardamos los datos del Admin en la petición
        next(); // Permitir que la petición continúe
    } catch (error) {
        res.status(401).json({ error: "Token inválido o expirado." });
    }
};