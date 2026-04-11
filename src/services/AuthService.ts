import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SystemUserRepository } from "../repositories/implementations/SystemUserRepository";

const JWT_SECRET = "CLAVE_SECRETA_SUPER_SEGURA_GYM_2024"; // En producción debe ir en un archivo .env

export class AuthService {
    constructor(private readonly repo: SystemUserRepository) {}

    // Registrar un nuevo administrador
    registerAdmin(data: { contact: string; password: string }) {
        const existingUser = this.repo.findByContact(data.contact);
        if (existingUser) throw new Error("Ya existe un usuario con este contacto.");

        const passwordHash = bcrypt.hashSync(data.password, 10);
        const newUser = this.repo.create({ contact: data.contact, passwordHash });

        return { id: newUser.id, contact: newUser.contact, role: newUser.role };
    }

    // Iniciar Sesión
    login(data: { contact: string; password: string }) {
        const user = this.repo.findByContact(data.contact);
        if (!user) throw new Error("Credenciales inválidas");

        const isValidPassword = bcrypt.compareSync(data.password, user.passwordHash);
        if (!isValidPassword) throw new Error("Credenciales inválidas");

        // Generar Token válido por 8 horas
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });

        return { token, user: { id: user.id, contact: user.contact, role: user.role } };
    }
}