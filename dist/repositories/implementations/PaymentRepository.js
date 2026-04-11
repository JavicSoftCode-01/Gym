"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class PaymentRepository {
    create(data, userId) {
        const now = new Date().toISOString();
        const paidAt = data.paidAt instanceof Date ? data.paidAt.toISOString() :
            (typeof data.paidAt === "string" && data.paidAt ? data.paidAt : now);
        const stmt = database_1.default.prepare(`
            INSERT INTO payments
                (customer_plan_id, payment_method_id, amount, receipt_image_path, paid_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(data.customerPlanId, data.paymentMethodId, data.amount, data.receiptImagePath || null, paidAt, now, now);
        const newId = result.lastInsertRowid;
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "payments", newId, {
            customerPlanId: data.customerPlanId,
            paymentMethodId: data.paymentMethodId,
            amount: data.amount
        });
        return { ...data, paidAt, id: newId };
    }
    findAll() {
        return database_1.default.prepare(`
            SELECT id,
                   customer_plan_id as customerPlanId,
                   payment_method_id as paymentMethodId,
                   amount,
                   receipt_image_path as receiptImagePath,
                   paid_at as paidAt,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM payments
            ORDER BY paid_at DESC
        `).all();
    }
    getPaymentsByPlan(customerPlanId) {
        return database_1.default.prepare(`
            SELECT id, customer_plan_id as customerPlanId, payment_method_id as paymentMethodId, amount,
                   receipt_image_path as receiptImagePath,
                   paid_at as paidAt, created_at as createdAt, updated_at as updatedAt
            FROM payments
            WHERE customer_plan_id = ?
            ORDER BY paid_at DESC
        `).all(customerPlanId);
    }
}
exports.PaymentRepository = PaymentRepository;
//# sourceMappingURL=PaymentRepository.js.map