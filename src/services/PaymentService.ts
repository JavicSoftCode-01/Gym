import { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import { ICustomerPlanRepository } from "../repositories/interfaces/ICustomerPlanRepository";
import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";
import { CustomerPlanStatus, PlanType } from "../domain/entities";

export class PaymentService {
    constructor(
        private paymentRepo: IPaymentRepository,
        private customerPlanRepo: ICustomerPlanRepository,
        private planRepo: IPlanRepository
    ) {}

    getAllPayments() {
        return this.paymentRepo.findAll();
    }

    processPayment(data: {
        customerPlanId: number;
        amount: number;
        paymentMethodId: number;
        receiptImagePath?: string;
    }, userId: number) {
        const planAssignment = this.customerPlanRepo.findById(data.customerPlanId);
        if (!planAssignment) throw new Error("Plan no encontrado");

        const plan = this.planRepo.findById(planAssignment.planId);
        if (!plan) throw new Error("Plan base no encontrado");

        // Regla: Si es Diario, el pago debe ser el total
        if (plan.type === PlanType.DAILY && data.amount < plan.price) {
            throw new Error("Los planes diarios deben pagarse completos en una sola exhibición.");
        }

        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const payment = this.paymentRepo.create({ ...data, paidAt: new Date().toISOString() }, userId); // 🌟

        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus = CustomerPlanStatus.PARTIAL;
        if (totalPaid >= plan.price) {
            newStatus = CustomerPlanStatus.PAID;
        }

        this.customerPlanRepo.updateStatus(data.customerPlanId, newStatus);

        return { payment, newStatus };
    }

    getPaymentsByPlan(customerPlanId: number) {
        return this.paymentRepo.getPaymentsByPlan(customerPlanId);
    }
}