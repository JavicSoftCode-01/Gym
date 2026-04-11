import db from "../../database/database";
import { IPlanScheduleRepository } from "../interfaces/IPlanScheduleRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class PlanScheduleRepository implements IPlanScheduleRepository {

    findAll(): any[] {
        return db.prepare(`
            SELECT plan_id as planId, schedule_id as scheduleId, created_at as createdAt, updated_at as updatedAt
            FROM plan_schedules
            ORDER BY plan_id, schedule_id
        `).all();
    }

    assignScheduleToPlan(planId: number, scheduleId: number, userId: number): void {
        const now = new Date().toISOString();
        // INSERT OR IGNORE para evitar duplicados en la PK compuesta
        const result = db.prepare(`
            INSERT OR IGNORE INTO plan_schedules (plan_id, schedule_id, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(planId, scheduleId, now, now);

        if (result.changes > 0) {
            // 🌟 Solo auditar si realmente se insertó (no era duplicado)
            AuditRepository.log(userId, "CREATE", "plan_schedules", planId, { planId, scheduleId });
        }
    }

    getSchedulesByPlanId(planId: number): any[] {
        return db.prepare(`
            SELECT s.id, s.date, s.start_time as startTime, s.end_time as endTime
            FROM schedules s
                     INNER JOIN plan_schedules ps ON s.id = ps.schedule_id
            WHERE ps.plan_id = ?
            ORDER BY s.date, s.start_time
        `).all(planId);
    }
}