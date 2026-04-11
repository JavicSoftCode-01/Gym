"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanScheduleRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository"); // 🌟
class PlanScheduleRepository {
    assignScheduleToPlan(planId, scheduleId, userId) {
        const now = new Date().toISOString();
        // INSERT OR IGNORE para evitar duplicados en la PK compuesta
        const result = database_1.default.prepare(`
            INSERT OR IGNORE INTO plan_schedules (plan_id, schedule_id, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(planId, scheduleId, now, now);
        if (result.changes > 0) {
            // 🌟 Solo auditar si realmente se insertó (no era duplicado)
            AuditRepository_1.AuditRepository.log(userId, "CREATE", "plan_schedules", planId, { planId, scheduleId });
        }
    }
    getSchedulesByPlanId(planId) {
        return database_1.default.prepare(`
            SELECT s.id, s.date, s.start_time as startTime, s.end_time as endTime
            FROM schedules s
                     INNER JOIN plan_schedules ps ON s.id = ps.schedule_id
            WHERE ps.plan_id = ?
            ORDER BY s.date, s.start_time
        `).all(planId);
    }
}
exports.PlanScheduleRepository = PlanScheduleRepository;
//# sourceMappingURL=PlanScheduleRepository.js.map