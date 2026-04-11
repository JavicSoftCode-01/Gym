"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanService = void 0;
class PlanService {
    constructor(planRepository) {
        this.planRepository = planRepository;
    }
    getAllPlans() {
        return this.planRepository.findAll();
    }
    createPlan(data, userId) {
        if (!data.price || data.price <= 0) {
            throw new Error("El precio debe ser mayor a 0.");
        }
        if (!data.serviceId) {
            throw new Error("El plan debe tener un servicio asociado.");
        }
        return this.planRepository.create(data, userId); // 🌟 pasa userId
    }
    updatePlan(id, data, userId) {
        this.planRepository.update(id, data, userId);
    }
    deletePlan(id, userId) {
        this.planRepository.delete(id, userId);
    }
}
exports.PlanService = PlanService;
//# sourceMappingURL=PlanService.js.map