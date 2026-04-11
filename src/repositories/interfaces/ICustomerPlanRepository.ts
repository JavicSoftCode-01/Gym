import { CustomerPlan, CustomerPlanStatus } from "../../domain/entities";

export interface ICustomerPlanRepository {
    create(data: Omit<CustomerPlan, "id" | "createdAt" | "updatedAt" | "payments"> & { scheduleIds?: number[] }, userId: number): CustomerPlan;
    updateStatus(id: number, status: CustomerPlanStatus): void;
    update(id: number, data: { customerId: number; planId: number; startDate: Date; endDate: Date; hours?: number; scheduleIds?: number[] }, userId: number): void;
    delete(id: number, userId: number): void;
    hasPayments(id: number): boolean;
    existsPlanForCustomerInMonth(customerId: number, planId: number, yearMonth: string, excludeId?: number): boolean;
    existsScheduleConflictForCustomer(customerId: number, scheduleIds: number[], excludeCustomerPlanId?: number): boolean;
    findById(id: number): CustomerPlan | undefined;
    findAll(): CustomerPlan[];
    linkSchedulesToCustomerPlan(customerPlanId: number, scheduleIds: number[], userId: number): void;
    unlinkSchedulesFromCustomerPlan(customerPlanId: number, userId: number): void;
}