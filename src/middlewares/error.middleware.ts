import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";

    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        res.status(400).json({
            error: "Violación de clave foránea: el registro tiene relaciones asociadas activas."
        });
        return;
    }

    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(400).json({
            error: "Ya existe un registro con estos datos únicos."
        });
        return;
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
};
