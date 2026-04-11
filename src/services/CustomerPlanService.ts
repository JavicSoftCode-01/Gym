import { ICustomerPlanRepository } from "../repositories/interfaces/ICustomerPlanRepository";
import { CustomerPlanStatus, PlanType } from "../domain/entities";
import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";
import { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import db from "../database/database";

export class CustomerPlanService {
    constructor(
        private customerPlanRepo: ICustomerPlanRepository,
        private planRepo: IPlanRepository,
        private paymentRepo: IPaymentRepository
    ) {}

    assignPlanToCustomer(data: {
        customerId: number;
        planId: number;
        hours?: number;
        scheduleIds?: number[];
    }, userId: number) {
        const plan = this.planRepo.findById(data.planId);
        if (!plan) throw new Error("Plan base no encontrado");

        const start = new Date();
        const end = new Date(start);
        if (plan.type === PlanType.MONTHLY) {
            end.setMonth(end.getMonth() + 1);
        }

        if (plan.type === PlanType.DAILY) {
            if (!data.scheduleIds || data.scheduleIds.length === 0) {
                throw new Error("Selecciona al menos un horario para planes diarios.");
            }
            if (this.customerPlanRepo.existsScheduleConflictForCustomer(data.customerId, data.scheduleIds)) {
                throw new Error("El cliente ya tiene otra suscripción en los mismos horarios seleccionados.");
            }
        }

        const yearMonth = start.toISOString().slice(0, 7);
        if (plan.type === PlanType.MONTHLY && this.customerPlanRepo.existsPlanForCustomerInMonth(data.customerId, data.planId, yearMonth)) {
            throw new Error("El cliente ya tiene este plan contratado para el mismo mes.");
        }

        // Al asignar un plan siempre entra como PENDING (aún no ha pagado)
        return this.customerPlanRepo.create({
            ...data,
            startDate: start,
            endDate: end,
            hours: plan.type === PlanType.DAILY ? data.scheduleIds?.length ?? 1 : data.hours ?? 1,
            status: CustomerPlanStatus.PENDING
        }, userId); // 🌟 pasa userId
    }

    updateAssignment(id: number, data: { customerId: number; planId: number; hours?: number; scheduleIds?: number[] }, userId: number) {
        const existing = this.customerPlanRepo.findById(id);
        if (!existing) throw new Error("Suscripción no encontrada");

        const oldPlan = this.planRepo.findById(existing.planId);
        const oldHours = existing.hours ?? 1;
        const oldTotalPrice = oldPlan ? (oldPlan.type === PlanType.DAILY ? oldPlan.price * oldHours : oldPlan.price) : 0;

        const plan = this.planRepo.findById(data.planId);
        if (!plan) throw new Error("Plan base no encontrado");

        if (this.customerPlanRepo.hasPayments(id)) {
            if (data.customerId !== existing.customerId || data.planId !== existing.planId) {
                throw new Error("No se puede cambiar el cliente o el plan de una suscripción con pagos registrados.");
            }
        }

        const start = new Date();
        const end = new Date(start);
        if (plan.type === PlanType.MONTHLY) end.setMonth(end.getMonth() + 1);

        if (plan.type === PlanType.DAILY) {
            if (!data.scheduleIds || data.scheduleIds.length === 0) {
                throw new Error("Selecciona al menos un horario para planes diarios.");
            }
            if (this.customerPlanRepo.existsScheduleConflictForCustomer(data.customerId, data.scheduleIds, id)) {
                throw new Error("El cliente ya tiene otra suscripción en los mismos horarios seleccionados.");
            }
        }

        const yearMonth = start.toISOString().slice(0, 7);
        if (plan.type === PlanType.MONTHLY && this.customerPlanRepo.existsPlanForCustomerInMonth(data.customerId, data.planId, yearMonth, id)) {
            throw new Error("El cliente ya tiene este plan contratado para el mismo mes.");
        }

        const newHours = plan.type === PlanType.DAILY ? data.scheduleIds?.length ?? existing.hours ?? 1 : data.hours ?? existing.hours ?? 1;

        this.customerPlanRepo.update(id, {
            customerId: data.customerId,
            planId: data.planId,
            startDate: start,
            endDate: end,
            hours: newHours,
            scheduleIds: data.scheduleIds
        }, userId);

        const newTotalPrice = plan.type === PlanType.DAILY ? plan.price * newHours : plan.price;

        // Si el precio bajó y había pagos, crear un ajuste si el total pagado supera el nuevo precio
        if (newTotalPrice < oldTotalPrice) {
            const payments = this.paymentRepo.getPaymentsByPlan(id);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            if (totalPaid > newTotalPrice) {
                const adjustmentAmount = newTotalPrice - totalPaid; // Será negativo
                
                // Buscar el método de pago de ajuste
                const refundMethod = db.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) LIMIT 1`).get('REEMBOLSO') as { id: number };
                
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
        let newStatus = CustomerPlanStatus.PARTIAL;
        if (finalPaid >= newTotalPrice) {
            newStatus = CustomerPlanStatus.PAID;
        } else if (finalPaid <= 0) {
            newStatus = CustomerPlanStatus.PENDING;
        }
        this.customerPlanRepo.updateStatus(id, newStatus);

        return this.customerPlanRepo.findById(id);
    }

    deleteAssignment(id: number, userId: number) {
        const existing = this.customerPlanRepo.findById(id);
        if (!existing) throw new Error("Suscripción no encontrada");

        if (this.customerPlanRepo.hasPayments(id)) {
            throw new Error("No se puede eliminar una suscripción con pagos registrados.");
        }

        this.customerPlanRepo.delete(id, userId);
        return { success: true };
    }

    getAssignmentById(id: number) {
        return this.customerPlanRepo.findById(id);
    }

    getAll() {
        return this.customerPlanRepo.findAll();
    }
}