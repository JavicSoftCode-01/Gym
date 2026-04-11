// src/domain/entities.ts
export abstract class BaseEntity {
    createdAt!: Date;
    updatedAt!: Date;
}

// 👤 Customer
export class Customer extends BaseEntity {
    id!: number;
    fullName!: string;
    contact!: string;
    inscriptionId?: number | null;
}

// 🎽 Inscription (Catálogo de uniformes)
export class Inscription extends BaseEntity {
    id!: number;
    name!: string;
    price!: number;
}

// 🏷️ Service
export class Service extends BaseEntity {
    id!: number;
    title!: string;
}

// 📅 Schedule
export class Schedule extends BaseEntity {
    id!: number;
    date!: Date;
    startTime!: Date;
    endTime!: Date;
}

// 💰 Plan
export enum PlanType {
    DAILY = "daily",
    MONTHLY = "monthly",
}

export class Plan extends BaseEntity {
    id!: number;

    serviceId!: number;
    type!: PlanType;

    minAge!: number;
    maxAge!: number;
    price!: number;

    service?: Service;
}

// 🔗 PlanSchedule (N:M)
export class PlanSchedule extends BaseEntity {
    planId!: number;
    scheduleId!: number;

    plan?: Plan;
    schedule?: Schedule;
}

// 📊 CustomerPlanStatus
export enum CustomerPlanStatus {
    PENDING = "pending",   // registrado, sin ningún pago aún
    PARTIAL = "partial",   // ha abonado pero no completó (solo mensual)
    PAID = "paid",      // pagado completo
    EXPIRED = "expired",   // venció el plazo sin completar el pago (solo mensual)
}

// 🧾 CustomerPlan
export class CustomerPlan {
    id!: number;

    customerId!: number;
    planId!: number;

    startDate!: Date;
    endDate!: Date;

    /**
     * Se actualiza automáticamente en la capa de servicio
     * cada vez que se registra un Payment.
     *
     * Diario:  PENDING → PAID
     * Mensual: PENDING → PARTIAL → PAID  (o EXPIRED si vence)
     */
    status!: CustomerPlanStatus;
    hours?: number;
    scheduleIds?: number[];

    customer?: Customer;
    plan?: Plan;
    payments?: Payment[];
}

// 💳 PaymentMethod (Para que el usuario registre los suyos)
export class PaymentMethod extends BaseEntity {
    id!: number;
    name!: string;
}

// 💵 Payment
export class Payment extends BaseEntity {
    id!: number;

    customerPlanId!: number;
    paymentMethodId!: number; // Ahora referenciamos la tabla
    amount!: number;
    type!: 'payment' | 'adjustment';

    /**
     * Solo requerido cuando el método lo amerite (ej. Depósito).
     * Guarda la ruta relativa de la imagen del recibo.
     */
    receiptImagePath?: string;

    paidAt!: Date | string;

    customerPlan?: CustomerPlan;
    paymentMethod?: PaymentMethod;
}

// 🛡️ SystemUser (Administradores / Staff)
export class SystemUser extends BaseEntity {
    id!: number;
    contact!: string; // Se usará como "Usuario" para el Login
    passwordHash!: string;
    role!: string; // Ej: 'admin', 'staff'
}

// 🕵️ AuditLog (Auditoría)
export class AuditLog extends BaseEntity {
    id!: number;
    userId!: number;
    action!: "CREATE" | "UPDATE" | "DELETE";
    tableName!: string;
    recordId!: number;
    details?: string; // JSON con los datos cambiados
}

// 💵 CashRegister (Cuadre de Caja)
export class CashRegister extends BaseEntity {
    id!: number;
    userId!: number;
    date!: string;
    expectedCash!: number;
    expectedDeposit!: number;
    actualCash!: number;
    actualDeposit!: number;
    difference!: number;
    dailyTotal!: number;
    grandTotal!: number;
}