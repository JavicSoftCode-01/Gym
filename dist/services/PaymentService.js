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
        const hours = planAssignment.hours ?? 1;
        const fullAmount = plan.type === entities_1.PlanType.DAILY ? plan.price * hours : plan.price;
        const existingPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = Math.max(0, fullAmount - totalPaidSoFar);
        if (data.amount <= 0) {
            throw new Error("El monto del pago debe ser mayor a cero.");
        }
        if (plan.type === entities_1.PlanType.DAILY) {
            if (data.amount !== remainingAmount) {
                throw new Error(`Los planes por hora se pagan completos. El monto exacto es $${remainingAmount.toFixed(2)}.`);
            }
        }
        if (data.amount > remainingAmount) {
            throw new Error(`El pago no puede exceder el saldo restante de $${remainingAmount.toFixed(2)}.`);
        }
        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const payment = this.paymentRepo.create({ ...data, paidAt: new Date().toISOString() }, userId); // 🌟
        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = entities_1.CustomerPlanStatus.PARTIAL;
        if (totalPaid >= fullAmount) {
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