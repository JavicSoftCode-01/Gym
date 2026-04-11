"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "CLAVE_SECRETA_SUPER_SEGURA_GYM_2024"; // En producción debe ir en un archivo .env
class AuthService {
    constructor(repo) {
        this.repo = repo;
    }
    // Registrar un nuevo administrador
    registerAdmin(data) {
        const existingUser = this.repo.findByContact(data.contact);
        if (existingUser)
            throw new Error("Ya existe un usuario con este contacto.");
        const passwordHash = bcryptjs_1.default.hashSync(data.password, 10);
        const newUser = this.repo.create({ contact: data.contact, passwordHash });
        return { id: newUser.id, contact: newUser.contact, role: newUser.role };
    }
    // Iniciar Sesión
    login(data) {
        const user = this.repo.findByContact(data.contact);
        if (!user)
            throw new Error("Credenciales inválidas");
        const isValidPassword = bcryptjs_1.default.compareSync(data.password, user.passwordHash);
        if (!isValidPassword)
            throw new Error("Credenciales inválidas");
        // Generar Token válido por 8 horas
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
        return { token, user: { id: user.id, contact: user.contact, role: user.role } };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map