"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
// src/repositories/implementations/CustomerRepository.ts
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟 Auditoría
class CustomerRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id,
                   full_name as fullName,
                   contact,
                   inscription_id as inscriptionId,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customers
            ORDER BY full_name ASC
        `).all();
    }
    findById(id) {
        return database_1.default.prepare(`
            SELECT id,
                   full_name as fullName,
                   contact,
                   inscription_id as inscriptionId,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customers
            WHERE id = ?
        `).get(id);
    }
    create(data, userId) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO customers (full_name, contact, inscription_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.fullName, data.contact, data.inscriptionId ?? null, now, now);
        const newId = result.lastInsertRowid;
        // 🌟 Registrar auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "customers", newId, data);
        return this.findById(newId);
    }
    update(id, data, userId) {
        const current = this.findById(id);
        if (!current)
            return undefined;
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE customers
            SET full_name  = ?,
                contact    = ?,
                inscription_id = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.fullName ?? current.fullName, data.contact ?? current.contact, data.inscriptionId ?? current.inscriptionId ?? null, now, id);
        // 🌟 Registrar auditoría
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "customers", id, data);
        return this.findById(id);
    }
    delete(id, userId) {
        // 🌟 Guardar datos antes de borrar para tenerlos en el log
        const current = this.findById(id);
        const result = database_1.default.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
        if (result.changes > 0 && current) {
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "customers", id, current);
        }
        return result.changes > 0;
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=CustomerRepository.js.map