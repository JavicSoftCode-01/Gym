import { ICustomerPlanRepository } from "../repositories/interfaces/ICustomerPlanRepository";
import { CustomerPlanStatus, PlanType } from "../domain/entities";
import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";

export class CustomerPlanService {
    constructor(
        private customerPlanRepo: ICustomerPlanRepository,
        private planRepo: IPlanRepository
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

        if (this.customerPlanRepo.hasPayments(id)) {
            throw new Error("No se puede editar una suscripción con pagos registrados.");
        }

        const plan = this.planRepo.findById(data.planId);
        if (!plan) throw new Error("Plan base no encontrado");

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

        this.customerPlanRepo.update(id, {
            customerId: data.customerId,
            planId: data.planId,
            startDate: start,
            endDate: end,
            hours: plan.type === PlanType.DAILY ? data.scheduleIds?.length ?? existing.hours ?? 1 : data.hours ?? existing.hours ?? 1,
            scheduleIds: data.scheduleIds
        }, userId);
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