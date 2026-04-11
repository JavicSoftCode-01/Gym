"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPlanRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const entities_1 = require("../../domain/entities");
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class CustomerPlanRepository {
    create(data, userId) {
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
            INSERT INTO customer_plans
                (customer_id, plan_id, start_date, end_date, hours, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const hours = data.hours ?? 1;
        const result = stmt.run(data.customerId, data.planId, data.startDate.toISOString(), data.endDate.toISOString(), hours, data.status, now, now);
        const newId = result.lastInsertRowid;
        if (Array.isArray(data.scheduleIds) && data.scheduleIds.length > 0) {
            this.linkSchedulesToCustomerPlan(newId, data.scheduleIds, userId);
        }
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "customer_plans", newId, { ...data, hours });
        return { ...data, id: newId, hours };
    }
    updateStatus(id, status) {
        database_1.default.prepare(`UPDATE customer_plans SET status = ?, updated_at = ? WHERE id = ?`)
            .run(status, new Date().toISOString(), id);
    }
    hasPayments(id) {
        const row = database_1.default.prepare(`SELECT 1 as ok FROM payments WHERE customer_plan_id = ? LIMIT 1`).get(id);
        return Boolean(row?.ok);
    }
    existsScheduleConflictForCustomer(customerId, scheduleIds, excludeCustomerPlanId) {
        if (!scheduleIds || scheduleIds.length === 0)
            return false;
        const placeholders = scheduleIds.map(() => '?').join(',');
        let sql = `
            SELECT 1 as ok
            FROM customer_plan_schedules cps
                     INNER JOIN customer_plans cp ON cps.customer_plan_id = cp.id
            WHERE cp.customer_id = ?
              AND cps.schedule_id IN (${placeholders})
        `;
        const params = [customerId, ...scheduleIds];
        if (excludeCustomerPlanId) {
            sql += ` AND cp.id != ?`;
            params.push(excludeCustomerPlanId);
        }
        const row = database_1.default.prepare(sql).get(...params);
        return Boolean(row?.ok);
    }
    linkSchedulesToCustomerPlan(customerPlanId, scheduleIds, userId) {
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
            INSERT OR IGNORE INTO customer_plan_schedules
                (customer_plan_id, schedule_id, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `);
        for (const scheduleId of scheduleIds) {
            const result = stmt.run(customerPlanId, scheduleId, now, now);
            if (result.changes > 0) {
                AuditRepository_1.AuditRepository.log(userId, "CREATE", "customer_plan_schedules", customerPlanId, { customerPlanId, scheduleId });
            }
        }
    }
    unlinkSchedulesFromCustomerPlan(customerPlanId, userId) {
        database_1.default.prepare(`DELETE FROM customer_plan_schedules WHERE customer_plan_id = ?`).run(customerPlanId);
        AuditRepository_1.AuditRepository.log(userId, "DELETE", "customer_plan_schedules", customerPlanId, { customerPlanId });
    }
    update(id, data, userId) {
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE customer_plans
            SET customer_id = ?,
                plan_id = ?,
                start_date = ?,
                end_date = ?,
                hours = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.customerId, data.planId, data.startDate.toISOString(), data.endDate.toISOString(), data.hours ?? 1, entities_1.CustomerPlanStatus.PENDING, now, id);
        this.unlinkSchedulesFromCustomerPlan(id, userId);
        if (Array.isArray(data.scheduleIds) && data.scheduleIds.length > 0) {
            this.linkSchedulesToCustomerPlan(id, data.scheduleIds, userId);
        }
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "customer_plans", id, { customerId: data.customerId, planId: data.planId, hours: data.hours ?? 1, scheduleIds: data.scheduleIds });
    }
    delete(id, userId) {
        const current = this.findById(id);
        database_1.default.prepare(`DELETE FROM customer_plan_schedules WHERE customer_plan_id = ?`).run(id);
        database_1.default.prepare(`DELETE FROM customer_plans WHERE id = ?`).run(id);
        if (current)
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "customer_plans", id, current);
    }
    findById(id) {
        const customerPlan = database_1.default.prepare(`
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
        `).get(id);
        if (!customerPlan)
            return undefined;
        const scheduleRows = database_1.default.prepare(`
            SELECT schedule_id as scheduleId
            FROM customer_plan_schedules
            WHERE customer_plan_id = ?
        `).all(id);
        customerPlan.scheduleIds = scheduleRows.map(row => row.scheduleId);
        return customerPlan;
    }
    findAll() {
        const plans = database_1.default.prepare(`
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
        `).all();
        return plans.map(plan => {
            const scheduleRows = database_1.default.prepare(`
                SELECT schedule_id as scheduleId
                FROM customer_plan_schedules
                WHERE customer_plan_id = ?
            `).all(plan.id);
            return { ...plan, scheduleIds: scheduleRows.map(row => row.scheduleId) };
        });
    }
    existsPlanForCustomerInMonth(customerId, planId, yearMonth, excludeId) {
        let sql = `
            SELECT 1 as ok
            FROM customer_plans
            WHERE customer_id = ?
              AND plan_id = ?
              AND substr(start_date, 1, 7) = ?
        `;
        const params = [customerId, planId, yearMonth];
        if (excludeId) {
            sql += ` AND id != ?`;
            params.push(excludeId);
        }
        const row = database_1.default.prepare(sql).get(...params);
        return Boolean(row?.ok);
    }
}
exports.CustomerPlanRepository = CustomerPlanRepository;
//# sourceMappingURL=CustomerPlanRepository.js.map