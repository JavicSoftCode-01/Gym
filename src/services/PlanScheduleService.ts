import { IPlanScheduleRepository } from "../repositories/interfaces/IPlanScheduleRepository";

export class PlanScheduleService {
    constructor(private readonly repo: IPlanScheduleRepository) {}

    getAll() {
        return this.repo.findAll();
    }

    assign(data: { planId: number; scheduleId: number }, userId: number) {
        if (!data.planId || !data.scheduleId) {
            throw new Error("Plan ID y Schedule ID son requeridos");
        }
        this.repo.assignScheduleToPlan(data.planId, data.scheduleId, userId); // 🌟 pasa userId
        return { message: "Horario asignado al plan exitosamente" };
    }

    getByPlan(planId: number) {
        return this.repo.getSchedulesByPlanId(planId);
    }
}
