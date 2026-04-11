"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const entities_1 = require("../domain/entities");
class PaymentService {
    constructor(paymentRepo, customerPlanRepo, planRepo) {
        this.paymentRepo = paymentRepo;
        this.customerPlanRepo = customerPlanRepo;
        this.planRepo = planRepo;
    }
    getAllPayments() {
        return this.paymentRepo.findAll();
    }
    processPayment(data, userId) {
        const planAssignment = this.customerPlanRepo.findById(data.customerPlanId);
        if (!planAssignment)
            throw new Error("Plan no encontrado");
        const plan = this.planRepo.findById(planAssignment.planId);
        if (!plan)
            throw new Error("Plan base no encontrado");
        // Regla: Si es Diario, el pago debe ser el total
        if (plan.type === entities_1.PlanType.DAILY && data.amount < plan.price) {
            throw new Error("Los planes diarios deben pagarse completos en una sola exhibición.");
        }
        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const payment = this.paymentRepo.create({ ...data, paidAt: new Date().toISOString() }, userId); // 🌟
        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = entities_1.CustomerPlanStatus.PARTIAL;
        if (totalPaid >= plan.price) {
            newStatus = entities_1.CustomerPlanStatus.PAID;
        }
        this.customerPlanRepo.updateStatus(data.customerPlanId, newStatus);
        return { payment, newStatus };
    }
    getPaymentsByPlan(customerPlanId) {
        return this.paymentRepo.getPaymentsByPlan(customerPlanId);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map