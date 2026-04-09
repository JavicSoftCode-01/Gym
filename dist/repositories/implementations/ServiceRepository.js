"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
class ServiceRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            ORDER BY title ASC
        `).all();
    }
    findById(id) {
        return database_1.default.prepare(`
            SELECT id, title, created_at as createdAt, updated_at as updatedAt
            FROM services
            WHERE id = ?
        `).get(id);
    }
    create(data) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO services (title, created_at, updated_at)
            VALUES (?, ?, ?)
        `).run(data.title, now, now);
        return this.findById(result.lastInsertRowid);
    }
    update(id, data) {
        const current = this.findById(id);
        if (!current)
            return undefined;
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE services
            SET title = ?, updated_at = ?
            WHERE id = ?
        `).run(data.title ?? current.title, now, id);
        return this.findById(id);
    }
    delete(id) {
        const result = database_1.default.prepare(`DELETE FROM services WHERE id = ?`).run(id);
        return result.changes > 0;
    }
}
exports.ServiceRepository = ServiceRepository;
//# sourceMappingURL=ServiceRepository.js.map