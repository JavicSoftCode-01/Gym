"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRepository = void 0;
// src/repositories/implementations/ServiceRepository.ts
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class ServiceRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            ORDER BY title
        `).all();
    }
    findById(id) {
        return database_1.default.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            WHERE id = ?
        `).get(id);
    }
    create(data, userId) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO services (title, created_at, updated_at)
            VALUES (?, ?, ?)
        `).run(data.title, now, now);
        const newId = result.lastInsertRowid;
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "services", newId, data);
        return this.findById(newId);
    }
    update(id, data, userId) {
        const current = this.findById(id);
        if (!current)
            return undefined;
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE services
            SET title      = ?,
                updated_at = ?
            WHERE id = ?
        `).run(data.title ?? current.title, now, id);
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "services", id, data);
        return this.findById(id);
    }
    delete(id, userId) {
        const current = this.findById(id);
        const result = database_1.default.prepare(`DELETE FROM services WHERE id = ?`).run(id);
        if (result.changes > 0 && current) {
            // 🌟 Auditoría
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "services", id, current);
        }
        return result.changes > 0;
    }
}
exports.ServiceRepository = ServiceRepository;
//# sourceMappingURL=ServiceRepository.js.map