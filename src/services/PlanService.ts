import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";
import { Plan } from "../domain/entities";

export class PlanService {
    constructor(private readonly planRepository: IPlanRepository) {}

    getAllPlans(): Plan[] {
        return this.planRepository.findAll();
    }

    createPlan(data: Omit<Plan, "id" | "createdAt" | "updatedAt">, userId: number): Plan {
        if (!data.price || data.price <= 0) {
            throw new Error("El precio debe ser mayor a 0.");
        }
        if (!data.serviceId) {
            throw new Error("El plan debe tener un servicio asociado.");
        }
        return this.planRepository.create(data, userId); // 🌟 pasa userId
    }

    updatePlan(id: number, data: Partial<Plan>, userId: number): void {
        this.planRepository.update(id, data, userId);
    }

    deletePlan(id: number, userId: number): void {
        this.planRepository.delete(id, userId);
    }
}