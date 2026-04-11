"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPlanService = void 0;
const entities_1 = require("../domain/entities");
class CustomerPlanService {
    constructor(customerPlanRepo, planRepo) {
        this.customerPlanRepo = customerPlanRepo;
        this.planRepo = planRepo;
    }
    assignPlanToCustomer(data, userId) {
        const plan = this.planRepo.findById(data.planId);
        if (!plan)
            throw new Error("Plan base no encontrado");
        const start = new Date();
        const end = new Date(start);
        if (plan.type === entities_1.PlanType.MONTHLY) {
            end.setMonth(end.getMonth() + 1);
        }
        else {
            // Diario: mismo día (vigencia de operación)
            end.setDate(end.getDate() + 1);
        }
        // Al asignar un plan siempre entra como PENDING (aún no ha pagado)
        return this.customerPlanRepo.create({
            ...data,
            startDate: start,
            endDate: end,
            status: entities_1.CustomerPlanStatus.PENDING
        }, userId); // 🌟 pasa userId
    }
    updateAssignment(id, data, userId) {
        const existing = this.customerPlanRepo.findById(id);
        if (!existing)
            throw new Error("Suscripción no encontrada");
        if (this.customerPlanRepo.hasPayments(id)) {
            throw new Error("No se puede editar una suscripción con pagos registrados.");
        }
        const plan = this.planRepo.findById(data.planId);
        if (!plan)
            throw new Error("Plan base no encontrado");
        const start = new Date();
        const end = new Date(start);
        if (plan.type === entities_1.PlanType.MONTHLY)
            end.setMonth(end.getMonth() + 1);
        else
            end.setDate(end.getDate() + 1);
        this.customerPlanRepo.update(id, { customerId: data.customerId, planId: data.planId, startDate: start, endDate: end }, userId);
        return this.customerPlanRepo.findById(id);
    }
    deleteAssignment(id, userId) {
        const existing = this.customerPlanRepo.findById(id);
        if (!existing)
            throw new Error("Suscripción no encontrada");
        if (this.customerPlanRepo.hasPayments(id)) {
            throw new Error("No se puede eliminar una suscripción con pagos registrados.");
        }
        this.customerPlanRepo.delete(id, userId);
        return { success: true };
    }
    getAssignmentById(id) {
        return this.customerPlanRepo.findById(id);
    }
    getAll() {
        return this.customerPlanRepo.findAll();
    }
}
exports.CustomerPlanService = CustomerPlanService;
//# sourceMappingURL=CustomerPlanService.js.map