"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "CLAVE_SECRETA_SUPER_SEGURA_GYM_2024";
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded; // Guardamos los datos del Admin en la petición
        next(); // Permitir que la petición continúe
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido o expirado." });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.middleware.js.map