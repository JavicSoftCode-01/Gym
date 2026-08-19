import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ISystemUserRepository } from "../repositories/interfaces/ISystemUserRepository";
import { env } from "../config";

export class AuthService {
    constructor(private readonly repo: ISystemUserRepository) {}

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

        // Generar Token JWT firmado con la configuración del entorno
        const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN as any
        });

        return { token, user: { id: user.id, contact: user.contact, role: user.role } };
    }
}