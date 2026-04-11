// src/repositories/implementations/ServiceRepository.ts
import db from "../../database/database";
import {Service} from "../../domain/entities";
import {IServiceRepository} from "../interfaces/IServiceRepository";
import {AuditRepository} from "./AuditRepository"; // 🌟

export class ServiceRepository implements IServiceRepository {

    findAll(): Service[] {
        return db.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            ORDER BY title
        `).all() as Service[];
    }

    findById(id: number): Service | undefined {
        return db.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            WHERE id = ?
        `).get(id) as Service | undefined;
    }

    create(data: { title: string }, userId: number): Service {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO services (title, created_at, updated_at)
            VALUES (?, ?, ?)
        `).run(data.title, now, now);

        const newId = result.lastInsertRowid as number;
        // 🌟 Auditoría
        AuditRepository.log(userId, "CREATE", "services", newId, data);

        return this.findById(newId)!;
    }

    update(id: number, data: Partial<{ title: string }>, userId: number): Service | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE services
            SET title      = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.title ?? current.title, now, id);

        // 🌟 Auditoría
        AuditRepository.log(userId, "UPDATE", "services", id, data);

        return this.findById(id);
    }

    delete(id: number, userId: number): boolean {
        const current = this.findById(id);
        const result = db.prepare(`DELETE FROM services WHERE id = ?`).run(id);
        if (result.changes > 0 && current) {
            // 🌟 Auditoría
            AuditRepository.log(userId, "DELETE", "services", id, current);
        }
        return result.changes > 0;
    }
}