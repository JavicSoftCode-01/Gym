"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class PlanRepository {
    findAll() {
        return database_1.default.prepare(`SELECT * FROM plans`).all();
    }
    findById(id) {
        return database_1.default.prepare(`SELECT * FROM plans WHERE id = ?`).get(id);
    }
    create(data, userId) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO plans (service_id, type, min_age, max_age, price, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(data.serviceId, data.type, data.minAge, data.maxAge, data.price, now, now);
        const newId = result.lastInsertRowid;
        // 🌟 Auditoría
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "plans", newId, data);
        return { ...data, id: newId, createdAt: new Date(now), updatedAt: new Date(now) };
    }
    update(id, data, userId) {
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE plans 
            SET service_id = ?, type = ?, min_age = ?, max_age = ?, price = ?, updated_at = ?
            WHERE id = ?
        `).run(data.serviceId, data.type, data.minAge, data.maxAge, data.price, now, id);
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "plans", id, data);
    }
    delete(id, userId) {
        database_1.default.prepare(`DELETE FROM plans WHERE id = ?`).run(id);
        AuditRepository_1.AuditRepository.log(userId, "DELETE", "plans", id, null);
    }
}
exports.PlanRepository = PlanRepository;
//# sourceMappingURL=PlanRepository.js.map