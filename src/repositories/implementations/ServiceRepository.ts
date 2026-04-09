import db from "../../database/database";
import {Service} from "../../domain/entities";
import {IServiceRepository} from "../interfaces/IServiceRepository";

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

    create(data: { title: string }): Service {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO services (title, created_at, updated_at)
            VALUES (?, ?, ?)
        `).run(data.title, now, now);

        return this.findById(result.lastInsertRowid as number)!;
    }

    update(id: number, data: Partial<{ title: string }>): Service | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE services
            SET title      = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.title ?? current.title, now, id);

        return this.findById(id);
    }

    delete(id: number): boolean {
        const result = db.prepare(`DELETE
                                   FROM services
                                   WHERE id = ?`).run(id);
        return result.changes > 0;
    }
}