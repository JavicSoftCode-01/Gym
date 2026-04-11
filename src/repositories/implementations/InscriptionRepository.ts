import db from "../../database/database";
import { Inscription } from "../../domain/entities";
import { IInscriptionRepository } from "../interfaces/IInscriptionRepository";
import { AuditRepository } from "./AuditRepository";

export class InscriptionRepository implements IInscriptionRepository {
    findAll(): Inscription[] {
        return db.prepare(`
            SELECT id, name, price, created_at as createdAt, updated_at as updatedAt
            FROM inscriptions
            ORDER BY name ASC
        `).all() as Inscription[];
    }

    findById(id: number): Inscription | undefined {
        return db.prepare(`
            SELECT id, name, price, created_at as createdAt, updated_at as updatedAt
            FROM inscriptions
            WHERE id = ?
        `).get(id) as Inscription | undefined;
    }

    create(data: { name: string; price: number }, userId: number): Inscription {
        const name = (data.name || "").trim();
        if (!name) throw new Error("El nombre de la inscripción es obligatorio.");
        if (typeof data.price !== "number" || Number.isNaN(data.price) || data.price < 0) {
            throw new Error("El precio debe ser válido.");
        }

        const exists = db.prepare(`SELECT id FROM inscriptions WHERE lower(name) = lower(?) LIMIT 1`).get(name) as { id: number } | undefined;
        if (exists) throw new Error("Esa inscripción ya existe.");

        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO inscriptions (name, price, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(name, data.price, now, now);

        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "inscriptions", newId, { name, price: data.price });
        return { id: newId, name, price: data.price, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    update(id: number, data: { name: string; price: number }, userId: number): void {
        const name = (data.name || "").trim();
        if (!name) throw new Error("El nombre de la inscripción es obligatorio.");
        if (typeof data.price !== "number" || Number.isNaN(data.price) || data.price < 0) {
            throw new Error("El precio debe ser válido.");
        }

        const exists = db.prepare(`SELECT id FROM inscriptions WHERE lower(name) = lower(?) AND id <> ? LIMIT 1`).get(name, id) as { id: number } | undefined;
        if (exists) throw new Error("Esa inscripción ya existe.");

        const now = new Date().toISOString();
        db.prepare(`UPDATE inscriptions SET name = ?, price = ?, updated_at = ? WHERE id = ?`).run(name, data.price, now, id);
        AuditRepository.log(userId, "UPDATE", "inscriptions", id, { name, price: data.price });
    }

    delete(id: number, userId: number): void {
        // no permitir borrar si está asignada a un cliente
        const used = db.prepare(`SELECT 1 as ok FROM customers WHERE inscription_id = ? LIMIT 1`).get(id) as { ok: 1 } | undefined;
        if (used?.ok) throw new Error("No se puede eliminar. Esta inscripción está asignada a uno o más clientes.");

        const current = this.findById(id);
        db.prepare(`DELETE FROM inscriptions WHERE id = ?`).run(id);
        if (current) AuditRepository.log(userId, "DELETE", "inscriptions", id, current);
    }
}

