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
                (customer_id, plan_id, start_date, end_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(data.customerId, data.planId, data.startDate.toISOString(), data.endDate.toISOString(), data.status, now, now);
        const newId = result.lastInsertRowid;
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "customer_plans", newId, data);
        return { ...data, id: newId };
    }
    updateStatus(id, status) {
        database_1.default.prepare(`UPDATE customer_plans SET status = ?, updated_at = ? WHERE id = ?`)
            .run(status, new Date().toISOString(), id);
    }
    hasPayments(id) {
        const row = database_1.default.prepare(`SELECT 1 as ok FROM payments WHERE customer_plan_id = ? LIMIT 1`).get(id);
        return Boolean(row?.ok);
    }
    update(id, data, userId) {
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE customer_plans
            SET customer_id = ?,
                plan_id = ?,
                start_date = ?,
                end_date = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.customerId, data.planId, data.startDate.toISOString(), data.endDate.toISOString(), entities_1.CustomerPlanStatus.PENDING, now, id);
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "customer_plans", id, { customerId: data.customerId, planId: data.planId });
    }
    delete(id, userId) {
        const current = this.findById(id);
        database_1.default.prepare(`DELETE FROM customer_plans WHERE id = ?`).run(id);
        if (current)
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "customer_plans", id, current);
    }
    findById(id) {
        return database_1.default.prepare(`
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
        `).get(id);
    }
    findAll() {
        return database_1.default.prepare(`
            SELECT id,
                   customer_id as customerId,
                   plan_id as planId,
                   start_date as startDate,
                   end_date as endDate,
                   status,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customer_plans
        `).all();
    }
}
exports.CustomerPlanRepository = CustomerPlanRepository;
//# sourceMappingURL=CustomerPlanRepository.js.map