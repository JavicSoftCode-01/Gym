import db from "../../database/database";
import { CustomerPlan, CustomerPlanStatus } from "../../domain/entities";
import { ICustomerPlanRepository } from "../interfaces/ICustomerPlanRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class CustomerPlanRepository implements ICustomerPlanRepository {

    create(data: any, userId: number): CustomerPlan {
        const now = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO customer_plans
                (customer_id, plan_id, start_date, end_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            data.customerId, data.planId,
            data.startDate.toISOString(), data.endDate.toISOString(), data.status, now, now
        );

        const newId = result.lastInsertRowid as number;
        // 🌟 Auditoría
        AuditRepository.log(userId, "CREATE", "customer_plans", newId, data);

        return { ...data, id: newId };
    }

    updateStatus(id: number, status: CustomerPlanStatus): void {
        db.prepare(`UPDATE customer_plans SET status = ?, updated_at = ? WHERE id = ?`)
          .run(status, new Date().toISOString(), id);
    }

    hasPayments(id: number): boolean {
        const row = db.prepare(`SELECT 1 as ok FROM payments WHERE customer_plan_id = ? LIMIT 1`).get(id) as { ok: 1 } | undefined;
        return Boolean(row?.ok);
    }

    update(id: number, data: { customerId: number; planId: number; startDate: Date; endDate: Date }, userId: number): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE customer_plans
            SET customer_id = ?,
                plan_id = ?,
                start_date = ?,
                end_date = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
        `).run(
            data.customerId,
            data.planId,
            data.startDate.toISOString(),
            data.endDate.toISOString(),
            CustomerPlanStatus.PENDING,
            now,
            id
        );
        AuditRepository.log(userId, "UPDATE", "customer_plans", id, { customerId: data.customerId, planId: data.planId });
    }

    delete(id: number, userId: number): void {
        const current = this.findById(id);
        db.prepare(`DELETE FROM customer_plans WHERE id = ?`).run(id);
        if (current) AuditRepository.log(userId, "DELETE", "customer_plans", id, current);
    }

    findById(id: number): CustomerPlan | undefined {
        return db.prepare(`
            SELECT id,
                   customer_id as customerId,
                   plan_id as planId,
                   start_date as startDate,
                   end_date as endDate,
                   status,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customer_plans
            WHERE id = ?
        `).get(id) as CustomerPlan | undefined;
    }

    findAll(): CustomerPlan[] {
        return db.prepare(`
            SELECT id,
                   customer_id as customerId,
                   plan_id as planId,
                   start_date as startDate,
                   end_date as endDate,
                   status,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customer_plans
        `).all() as CustomerPlan[];
    }
}