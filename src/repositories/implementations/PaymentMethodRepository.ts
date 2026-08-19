import db from "../../database/database";
import { PaymentMethod } from "../../domain/entities";
import { IPaymentMethodRepository } from "../interfaces/IPaymentMethodRepository";
import { AuditRepository } from "./AuditRepository";

export class PaymentMethodRepository implements IPaymentMethodRepository {
    findAll(): PaymentMethod[] {
        return db.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM payment_methods`).all() as PaymentMethod[];
    }

    findById(id: number): PaymentMethod | undefined {
        return db.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM payment_methods WHERE id = ?`).get(id) as PaymentMethod | undefined;
    }

    findByName(name: string): PaymentMethod | undefined {
        const normalized = (name || "").trim();
        return db.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM payment_methods WHERE lower(name) = lower(?) LIMIT 1`).get(normalized) as PaymentMethod | undefined;
    }

    create(data: { name: string }, userId: number): PaymentMethod {
        const normalized = (data.name || "").trim();
        if (!normalized) throw new Error("El nombre del método de pago es obligatorio.");
        const existing = this.findByName(normalized);
        if (existing) throw new Error("Ese método de pago ya existe.");

        const now = new Date().toISOString();
        const result = db.prepare(`INSERT INTO payment_methods (name, created_at, updated_at) VALUES (?, ?, ?)`).run(normalized, now, now);
        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "payment_methods", newId, { name: normalized });
        return { name: normalized, id: newId, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    update(id: number, data: { name: string }, userId: number): void {
        const normalized = (data.name || "").trim();
        if (!normalized) throw new Error("El nombre del método de pago es obligatorio.");
        const existing = db.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) AND id <> ? LIMIT 1`).get(normalized, id) as { id: number } | undefined;
        if (existing) throw new Error("Ese método de pago ya existe.");

        const now = new Date().toISOString();
        db.prepare(`UPDATE payment_methods SET name = ?, updated_at = ? WHERE id = ?`).run(normalized, now, id);
        AuditRepository.log(userId, "UPDATE", "payment_methods", id, { name: normalized });
    }

    delete(id: number, userId: number): void {
        const current = this.findById(id);
        db.prepare(`DELETE FROM payment_methods WHERE id = ?`).run(id);
        if (current) AuditRepository.log(userId, "DELETE", "payment_methods", id, current);
    }
}
