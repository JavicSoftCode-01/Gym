import db from "../../database/database";
import { Payment } from "../../domain/entities";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { AuditRepository } from "./AuditRepository"; // 🌟

export class PaymentRepository implements IPaymentRepository {

    create(data: any, userId: number): Payment {
        const now = new Date().toISOString();
        const paidAt =
            data.paidAt instanceof Date ? data.paidAt.toISOString() :
            (typeof data.paidAt === "string" && data.paidAt ? data.paidAt : now);
        const type = data.type || "payment";
        const stmt = db.prepare(`
            INSERT INTO payments
                (customer_plan_id, payment_method_id, amount, type, receipt_image_path, paid_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            data.customerPlanId,
            data.paymentMethodId,
            data.amount,
            type,
            data.receiptImagePath || null,
            paidAt,
            now,
            now
        );

        const newId = result.lastInsertRowid as number;
        // 🌟 Auditoría
        AuditRepository.log(userId, "CREATE", "payments", newId, {
            customerPlanId:  data.customerPlanId,
            paymentMethodId: data.paymentMethodId,
            amount:          data.amount,
            type:            type
        });

        return { ...data, paidAt, id: newId, type };
    }

    findAll(): Payment[] {
        return db.prepare(`
            SELECT id,
                   customer_plan_id as customerPlanId,
                   payment_method_id as paymentMethodId,
                   amount,
                   type,
                   receipt_image_path as receiptImagePath,
                   paid_at as paidAt,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM payments
            ORDER BY paid_at DESC
        `).all() as Payment[];
    }

    getPaymentsByPlan(customerPlanId: number): Payment[] {
        return db.prepare(`
            SELECT id, customer_plan_id as customerPlanId, payment_method_id as paymentMethodId, amount,
                   type, receipt_image_path as receiptImagePath,
                   paid_at as paidAt, created_at as createdAt, updated_at as updatedAt
            FROM payments
            WHERE customer_plan_id = ?
            ORDER BY paid_at DESC
        `).all(customerPlanId) as Payment[];
    }
}