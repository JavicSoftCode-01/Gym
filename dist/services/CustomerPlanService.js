"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPlanService = void 0;
const entities_1 = require("../domain/entities");
const database_1 = __importDefault(require("../database/database"));
class CustomerPlanService {
    constructor(customerPlanRepo, planRepo, paymentRepo) {
        this.customerPlanRepo = customerPlanRepo;
        this.planRepo = planRepo;
        this.paymentRepo = paymentRepo;
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
        if (plan.type === entities_1.PlanType.DAILY) {
            if (!data.scheduleIds || data.scheduleIds.length === 0) {
                throw new Error("Selecciona al menos un horario para planes diarios.");
            }
            if (this.customerPlanRepo.existsScheduleConflictForCustomer(data.customerId, data.scheduleIds)) {
                throw new Error("El cliente ya tiene otra suscripción en los mismos horarios seleccionados.");
            }
        }
        const yearMonth = start.toISOString().slice(0, 7);
        if (plan.type === entities_1.PlanType.MONTHLY && this.customerPlanRepo.existsPlanForCustomerInMonth(data.customerId, data.planId, yearMonth)) {
            throw new Error("El cliente ya tiene este plan contratado para el mismo mes.");
        }
        // Al asignar un plan siempre entra como PENDING (aún no ha pagado)
        return this.customerPlanRepo.create({
            ...data,
            startDate: start,
            endDate: end,
            hours: plan.type === entities_1.PlanType.DAILY ? data.scheduleIds?.length ?? 1 : data.hours ?? 1,
            status: entities_1.CustomerPlanStatus.PENDING
        }, userId); // 🌟 pasa userId
    }
    updateAssignment(id, data, userId) {
        const existing = this.customerPlanRepo.findById(id);
        if (!existing)
            throw new Error("Suscripción no encontrada");
        const oldPlan = this.planRepo.findById(existing.planId);
        const oldHours = existing.hours ?? 1;
        const oldTotalPrice = oldPlan ? (oldPlan.type === entities_1.PlanType.DAILY ? oldPlan.price * oldHours : oldPlan.price) : 0;
        const plan = this.planRepo.findById(data.planId);
        if (!plan)
            throw new Error("Plan base no encontrado");
        if (this.customerPlanRepo.hasPayments(id)) {
            if (data.customerId !== existing.customerId || data.planId !== existing.planId) {
                throw new Error("No se puede cambiar el cliente o el plan de una suscripción con pagos registrados.");
            }
        }
        const start = new Date();
        const end = new Date(start);
        if (plan.type === entities_1.PlanType.MONTHLY)
            end.setMonth(end.getMonth() + 1);
        if (plan.type === entities_1.PlanType.DAILY) {
            if (!data.scheduleIds || data.scheduleIds.length === 0) {
                throw new Error("Selecciona al menos un horario para planes diarios.");
            }
            if (this.customerPlanRepo.existsScheduleConflictForCustomer(data.customerId, data.scheduleIds, id)) {
                throw new Error("El cliente ya tiene otra suscripción en los mismos horarios seleccionados.");
            }
        }
        const yearMonth = start.toISOString().slice(0, 7);
        if (plan.type === entities_1.PlanType.MONTHLY && this.customerPlanRepo.existsPlanForCustomerInMonth(data.customerId, data.planId, yearMonth, id)) {
            throw new Error("El cliente ya tiene este plan contratado para el mismo mes.");
        }
        const newHours = plan.type === entities_1.PlanType.DAILY ? data.scheduleIds?.length ?? existing.hours ?? 1 : data.hours ?? existing.hours ?? 1;
        this.customerPlanRepo.update(id, {
            customerId: data.customerId,
            planId: data.planId,
            startDate: start,
            endDate: end,
            hours: newHours,
            scheduleIds: data.scheduleIds
        }, userId);
        const newTotalPrice = plan.type === entities_1.PlanType.DAILY ? plan.price * newHours : plan.price;
        // Si el precio bajó y había pagos, crear un ajuste si el total pagado supera el nuevo precio
        if (newTotalPrice < oldTotalPrice) {
            const payments = this.paymentRepo.getPaymentsByPlan(id);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            if (totalPaid > newTotalPrice) {
                const adjustmentAmount = newTotalPrice - totalPaid; // Será negativo
                // Buscar el método de pago de ajuste
                const refundMethod = database_1.default.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) LIMIT 1`).get('Reembolso/Ajuste');
                if (refundMethod) {
                    this.paymentRepo.create({
                        customerPlanId: id,
                        paymentMethodId: refundMethod.id,
                        amount: adjustmentAmount,
                        type: 'adjustment',
                        paidAt: new Date().toISOString()
                    }, userId);
                }
            }
        }
        // Recalcular estado
        const allPayments = this.paymentRepo.getPaymentsByPlan(id);
        const finalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = entities_1.CustomerPlanStatus.PARTIAL;
        if (finalPaid >= newTotalPrice) {
            newStatus = entities_1.CustomerPlanStatus.PAID;
        }
        else if (finalPaid <= 0) {
            newStatus = entities_1.CustomerPlanStatus.PENDING;
        }
        this.customerPlanRepo.updateStatus(id, newStatus);
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