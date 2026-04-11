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

        const hours = planAssignment.hours ?? 1;
        const fullAmount = plan.type === PlanType.DAILY ? plan.price * hours : plan.price;

        const existingPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = Math.max(0, fullAmount - totalPaidSoFar);

        if (data.amount <= 0) {
            throw new Error("El monto del pago debe ser mayor a cero.");
        }

        if (plan.type === PlanType.DAILY) {
            if (data.amount !== remainingAmount) {
                throw new Error(`Los planes por hora se pagan completos. El monto exacto es $${remainingAmount.toFixed(2)}.`);
            }
        }

        if (data.amount > remainingAmount) {
            throw new Error(`El pago no puede exceder el saldo restante de $${remainingAmount.toFixed(2)}.`);
        }

        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const payment = this.paymentRepo.create({ ...data, type: 'payment', paidAt: new Date().toISOString() }, userId); // 🌟

        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus = CustomerPlanStatus.PARTIAL;
        if (totalPaid >= fullAmount) {
            newStatus = CustomerPlanStatus.PAID;
        }

        this.customerPlanRepo.updateStatus(data.customerPlanId, newStatus);

        return { payment, newStatus };
    }

    getPaymentsByPlan(customerPlanId: number) {
        return this.paymentRepo.getPaymentsByPlan(customerPlanId);
    }
}