import db from "../../database/database";
import { Plan, PlanType } from "../../domain/entities";
import { IPlanRepository } from "../interfaces/IPlanRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class PlanRepository implements IPlanRepository {

    findAll(): Plan[] {
        return db.prepare(`SELECT * FROM plans`).all() as Plan[];
    }

    findById(id: number): Plan | undefined {
        return db.prepare(`SELECT * FROM plans WHERE id = ?`).get(id) as Plan | undefined;
    }

    create(data: Omit<Plan, "id" | "createdAt" | "updatedAt">, userId: number): Plan {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO plans (service_id, type, min_age, max_age, price, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(data.serviceId, data.type, data.minAge, data.maxAge, data.price, now, now);

        const newId = result.lastInsertRowid as number;
        // 🌟 Auditoría
        AuditRepository.log(userId, "CREATE", "plans", newId, data);

        return { ...data, id: newId, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    update(id: number, data: Partial<Plan>, userId: number): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE plans 
            SET service_id = ?, type = ?, min_age = ?, max_age = ?, price = ?, updated_at = ?
            WHERE id = ?
        `).run(data.serviceId, data.type, data.minAge, data.maxAge, data.price, now, id);
        AuditRepository.log(userId, "UPDATE", "plans", id, data);
    }

    delete(id: number, userId: number): void {
        db.prepare(`DELETE FROM plans WHERE id = ?`).run(id);
        AuditRepository.log(userId, "DELETE", "plans", id, null);
    }
}