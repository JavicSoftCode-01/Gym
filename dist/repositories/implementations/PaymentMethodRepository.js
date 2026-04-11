"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository");
class PaymentMethodRepository {
    findAll() {
        return database_1.default.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM payment_methods`).all();
    }
    findById(id) {
        return database_1.default.prepare(`SELECT id, name, created_at as createdAt, updated_at as updatedAt FROM payment_methods WHERE id = ?`).get(id);
    }
    create(data, userId) {
        const normalized = (data.name || "").trim();
        if (!normalized)
            throw new Error("El nombre del método de pago es obligatorio.");
        const existing = database_1.default.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) LIMIT 1`).get(normalized);
        if (existing)
            throw new Error("Ese método de pago ya existe.");
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`INSERT INTO payment_methods (name, created_at, updated_at) VALUES (?, ?, ?)`).run(normalized, now, now);
        const newId = result.lastInsertRowid;
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "payment_methods", newId, { name: normalized });
        return { name: normalized, id: newId, createdAt: new Date(now), updatedAt: new Date(now) };
    }
    update(id, data, userId) {
        const normalized = (data.name || "").trim();
        if (!normalized)
            throw new Error("El nombre del método de pago es obligatorio.");
        const existing = database_1.default.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) AND id <> ? LIMIT 1`).get(normalized, id);
        if (existing)
            throw new Error("Ese método de pago ya existe.");
        const now = new Date().toISOString();
        database_1.default.prepare(`UPDATE payment_methods SET name = ?, updated_at = ? WHERE id = ?`).run(normalized, now, id);
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "payment_methods", id, { name: normalized });
    }
    delete(id, userId) {
        const current = this.findById(id);
        database_1.default.prepare(`DELETE FROM payment_methods WHERE id = ?`).run(id);
        if (current)
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "payment_methods", id, current);
    }
}
exports.PaymentMethodRepository = PaymentMethodRepository;
//# sourceMappingURL=PaymentMethodRepository.js.map