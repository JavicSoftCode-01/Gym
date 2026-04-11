"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
class AuditRepository {
    static log(userId, action, tableName, recordId, details) {
        const stmt = database_1.default.prepare(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        stmt.run(userId, action, tableName, recordId, JSON.stringify(details));
    }
}
exports.AuditRepository = AuditRepository;
//# sourceMappingURL=AuditRepository.js.map