import { Payment } from "../../domain/entities";

export interface IPaymentRepository {
    create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">, userId: number): Payment;
    findAll(): Payment[];
    getPaymentsByPlan(customerPlanId: number): Payment[];
}