import db from "../../database/database";
import { CustomerPlan, CustomerPlanStatus } from "../../domain/entities";
import { ICustomerPlanRepository } from "../interfaces/ICustomerPlanRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class CustomerPlanRepository implements ICustomerPlanRepository {

    create(data: any, userId: number): CustomerPlan {
        const now = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO customer_plans
                (customer_id, plan_id, start_date, end_date, hours, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const hours = data.hours ?? 1;
        const result = stmt.run(
            data.customerId,
            data.planId,
            data.startDate.toISOString(),
            data.endDate.toISOString(),
            hours,
            data.status,
            now,
            now
        );

        const newId = result.lastInsertRowid as number;
        if (Array.isArray(data.scheduleIds) && data.scheduleIds.length > 0) {
            this.linkSchedulesToCustomerPlan(newId, data.scheduleIds, userId);
        }

        // 🌟 Auditoría
        AuditRepository.log(userId, "CREATE", "customer_plans", newId, { ...data, hours });

        return { ...data, id: newId, hours };
    }

    updateStatus(id: number, status: CustomerPlanStatus): void {
        db.prepare(`UPDATE customer_plans SET status = ?, updated_at = ? WHERE id = ?`)
          .run(status, new Date().toISOString(), id);
    }

    hasPayments(id: number): boolean {
        const row = db.prepare(`SELECT 1 as ok FROM payments WHERE customer_plan_id = ? LIMIT 1`).get(id) as { ok: 1 } | undefined;
        return Boolean(row?.ok);
    }

    existsScheduleConflictForCustomer(customerId: number, scheduleIds: number[], excludeCustomerPlanId?: number): boolean {
        if (!scheduleIds || scheduleIds.length === 0) return false;

        const placeholders = scheduleIds.map(() => '?').join(',');
        let sql = `
            SELECT 1 as ok
            FROM customer_plan_schedules cps
                     INNER JOIN customer_plans cp ON cps.customer_plan_id = cp.id
            WHERE cp.customer_id = ?
              AND cps.schedule_id IN (${placeholders})
        `;
        const params: Array<number | string> = [customerId, ...scheduleIds];
        if (excludeCustomerPlanId) {
            sql += ` AND cp.id != ?`;
            params.push(excludeCustomerPlanId);
        }
        const row = db.prepare(sql).get(...params) as { ok: 1 } | undefined;
        return Boolean(row?.ok);
    }

    linkSchedulesToCustomerPlan(customerPlanId: number, scheduleIds: number[], userId: number): void {
        const now = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO customer_plan_schedules
                (customer_plan_id, schedule_id, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `);

        for (const scheduleId of scheduleIds) {
            const result = stmt.run(customerPlanId, scheduleId, now, now);
            if (result.changes > 0) {
                AuditRepository.log(userId, "CREATE", "customer_plan_schedules", customerPlanId, { customerPlanId, scheduleId });
            }
        }
    }

    unlinkSchedulesFromCustomerPlan(customerPlanId: number, userId: number): void {
        db.prepare(`DELETE FROM customer_plan_schedules WHERE customer_plan_id = ?`).run(customerPlanId);
        AuditRepository.log(userId, "DELETE", "customer_plan_schedules", customerPlanId, { customerPlanId });
    }

    update(id: number, data: { customerId: number; planId: number; startDate: Date; endDate: Date; hours?: number; scheduleIds?: number[] }, userId: number): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE customer_plans
            SET customer_id = ?,
                plan_id = ?,
                start_date = ?,
                end_date = ?,
                hours = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
        `).run(
            data.customerId,
            data.planId,
            data.startDate.toISOString(),
            data.endDate.toISOString(),
            data.hours ?? 1,
            CustomerPlanStatus.PENDING,
            now,
            id
        );

        this.unlinkSchedulesFromCustomerPlan(id, userId);
        if (Array.isArray(data.scheduleIds) && data.scheduleIds.length > 0) {
            this.linkSchedulesToCustomerPlan(id, data.scheduleIds, userId);
        }

        AuditRepository.log(userId, "UPDATE", "customer_plans", id, { customerId: data.customerId, planId: data.planId, hours: data.hours ?? 1, scheduleIds: data.scheduleIds });
    }

    delete(id: number, userId: number): void {
        const current = this.findById(id);
        db.prepare(`DELETE FROM customer_plan_schedules WHERE customer_plan_id = ?`).run(id);
        db.prepare(`DELETE FROM customer_plans WHERE id = ?`).run(id);
        if (current) AuditRepository.log(userId, "DELETE", "customer_plans", id, current);
    }

    findById(id: number): CustomerPlan | undefined {
        const customerPlan = db.prepare(`
            SELECT id,
                   customer_id as customerId,
                   plan_id as planId,
                   start_date as startDate,
                   end_date as endDate,
                   hours,
                   status,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customer_plans
            WHERE id = ?
        `).get(id) as CustomerPlan | undefined;

        if (!customerPlan) return undefined;

        const scheduleRows = db.prepare(`
            SELECT schedule_id as scheduleId
            FROM customer_plan_schedules
            WHERE customer_plan_id = ?
        `).all(id) as Array<{ scheduleId: number }>;
        customerPlan.scheduleIds = scheduleRows.map(row => row.scheduleId);

        return customerPlan;
    }

    findAll(): CustomerPlan[] {
        const plans = db.prepare(`
            SELECT id,
                   customer_id as customerId,
                   plan_id as planId,
                   start_date as startDate,
                   end_date as endDate,
                   hours,
                   status,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customer_plans
        `).all() as CustomerPlan[];

        return plans.map(plan => {
            const scheduleRows = db.prepare(`
                SELECT schedule_id as scheduleId
                FROM customer_plan_schedules
                WHERE customer_plan_id = ?
            `).all(plan.id) as Array<{ scheduleId: number }>;
            return { ...plan, scheduleIds: scheduleRows.map(row => row.scheduleId) };
        });
    }

    existsPlanForCustomerInMonth(customerId: number, planId: number, yearMonth: string, excludeId?: number): boolean {
        let sql = `
            SELECT 1 as ok
            FROM customer_plans
            WHERE customer_id = ?
              AND plan_id = ?
              AND substr(start_date, 1, 7) = ?
        `;
        const params: Array<number | string> = [customerId, planId, yearMonth];
        if (excludeId) {
            sql += ` AND id != ?`;
            params.push(excludeId);
        }
        const row = db.prepare(sql).get(...params) as { ok: 1 } | undefined;
        return Boolean(row?.ok);
    }
}
