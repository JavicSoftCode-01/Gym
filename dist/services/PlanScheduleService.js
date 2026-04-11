"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanScheduleService = void 0;
class PlanScheduleService {
    constructor(repo) {
        this.repo = repo;
    }
    assign(data, userId) {
        if (!data.planId || !data.scheduleId) {
            throw new Error("Plan ID y Schedule ID son requeridos");
        }
        this.repo.assignScheduleToPlan(data.planId, data.scheduleId, userId); // 🌟 pasa userId
        return { message: "Horario asignado al plan exitosamente" };
    }
    getByPlan(planId) {
        return this.repo.getSchedulesByPlanId(planId);
    }
}
exports.PlanScheduleService = PlanScheduleService;
//# sourceMappingURL=PlanScheduleService.js.map