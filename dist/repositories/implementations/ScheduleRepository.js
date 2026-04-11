"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class ScheduleRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id,
                   date,
                   start_time as startTime,
                   end_time as endTime,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM schedules
            ORDER BY date, start_time
        `).all();
    }
    create(data, userId) {
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT OR IGNORE INTO schedules (date, start_time, end_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.date, data.startTime, data.endTime, now, now);
        if (result.changes === 0) {
            const existing = database_1.default.prepare(`SELECT id FROM schedules WHERE date = ? AND start_time = ? AND end_time = ?`)
                .get(data.date, data.startTime, data.endTime);
            return { ...data, id: existing?.id ?? 0 };
        }
        const newId = result.lastInsertRowid;
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "schedules", newId, data);
        return { ...data, id: newId };
    }
    delete(id, userId) {
        const current = database_1.default.prepare(`SELECT * FROM schedules WHERE id = ?`).get(id);
        database_1.default.prepare(`DELETE FROM schedules WHERE id = ?`).run(id);
        if (current)
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "schedules", id, current);
    }
}
exports.ScheduleRepository = ScheduleRepository;
//# sourceMappingURL=ScheduleRepository.js.map