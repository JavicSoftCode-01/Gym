import db from "../../database/database";
import { Schedule } from "../../domain/entities";
import { IScheduleRepository } from "../interfaces/IScheduleRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class ScheduleRepository implements IScheduleRepository {

    findAll(): Schedule[] {
        return db.prepare(`
            SELECT id,
                   date,
                   start_time as startTime,
                   end_time as endTime,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM schedules
            ORDER BY date, start_time
        `).all() as Schedule[];
    }

    create(data: { date: string; startTime: string; endTime: string }, userId: number): Schedule {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT OR IGNORE INTO schedules (date, start_time, end_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.date, data.startTime, data.endTime, now, now);

        if (result.changes === 0) {
            const existing = db.prepare(`SELECT id FROM schedules WHERE date = ? AND start_time = ? AND end_time = ?`)
                .get(data.date, data.startTime, data.endTime) as { id: number } | undefined;
            return { ...data, id: existing?.id ?? 0 } as any;
        }

        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "schedules", newId, data);

        return { ...data, id: newId } as any;
    }

    delete(id: number, userId: number): void {
        const current = db.prepare(`SELECT * FROM schedules WHERE id = ?`).get(id);
        db.prepare(`DELETE FROM schedules WHERE id = ?`).run(id);
        if (current) AuditRepository.log(userId, "DELETE", "schedules", id, current);
    }
}