"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemUserRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
class SystemUserRepository {
    findByContact(contact) {
        return database_1.default.prepare(`
            SELECT id, contact, password_hash as passwordHash, role, created_at as createdAt, updated_at as updatedAt 
            FROM system_users WHERE contact = ?
        `).get(contact);
    }
    create(data) {
        const now = new Date().toISOString();
        const role = data.role || 'admin';
        const result = database_1.default.prepare(`
            INSERT INTO system_users (contact, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.contact, data.passwordHash, role, now, now);
        return this.findByContact(data.contact);
    }
}
exports.SystemUserRepository = SystemUserRepository;
//# sourceMappingURL=SystemUserRepository.js.map