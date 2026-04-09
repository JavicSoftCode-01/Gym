"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
class CustomerRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id, full_name as fullName, contact, created_at as createdAt, updated_at as updatedAt
            FROM customers
            ORDER BY full_name ASC
        `).all();
    }
    findById(id) {
        return database_1.default.prepare(`
            SELECT id, full_name as fullName, contact, created_at as createdAt, updated_at as updatedAt
            FROM customers
            WHERE id = ?
        `).get(id);
    }
    create(data) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO customers (full_name, contact, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(data.fullName, data.contact, now, now);
        return this.findById(result.lastInsertRowid);
    }
    update(id, data) {
        const current = this.findById(id);
        if (!current)
            return undefined;
        const now = new Date().toISOString();
        database_1.default.prepare(`
            UPDATE customers
            SET full_name = ?, contact = ?, updated_at = ?
            WHERE id = ?
        `).run(data.fullName ?? current.fullName, data.contact ?? current.contact, now, id);
        return this.findById(id);
    }
    delete(id) {
        const result = database_1.default.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
        return result.changes > 0;
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=CustomerRepository.js.map