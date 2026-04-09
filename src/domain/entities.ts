export abstract class BaseEntity {
    createdAt!: Date;
    updatedAt!: Date;
}

// 👤 Customer
export class Customer extends BaseEntity {
    id!: number;
    fullName!: string;
    contact!: string;
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

// 🎽 RegistrationType
export class RegistrationType extends BaseEntity {
    id!: number;
    name!: string;
    price!: number;
}

// 📝 Registration
export class Registration extends BaseEntity {
    id!: number;

    customerId!: number;
    registrationTypeId!: number;

    customer?: Customer;
    registrationType?: RegistrationType;
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
    registrationId!: number;

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

    customer?: Customer;
    plan?: Plan;
    registration?: Registration;
    payments?: Payment[];
}

// 💳 PaymentMethod
export enum PaymentMethod {
    CASH = "cash",
    DEPOSIT = "deposit",
}

// 💵 Payment
export class Payment extends BaseEntity {
    id!: number;

    customerPlanId!: number;
    method!: PaymentMethod;
    amount!: number;

    /**
     * Solo requerido cuando method === PaymentMethod.DEPOSIT.
     * Guarda la ruta relativa de la imagen del recibo.
     * Ej: "uploads/receipts/2024-01-15_recibo_42.jpg"
     */
    receiptImagePath?: string;

    paidAt!: Date;

    customerPlan?: CustomerPlan;
}