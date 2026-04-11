import { CustomerPlan, CustomerPlanStatus } from "../../domain/entities";

export interface ICustomerPlanRepository {
    create(data: Omit<CustomerPlan, "id" | "createdAt" | "updatedAt" | "payments">, userId: number): CustomerPlan;
    updateStatus(id: number, status: CustomerPlanStatus): void;
    update(id: number, data: { customerId: number; planId: number; startDate: Date; endDate: Date }, userId: number): void;
    delete(id: number, userId: number): void;
    hasPayments(id: number): boolean;
    findById(id: number): CustomerPlan | undefined;
    findAll(): CustomerPlan[];
}