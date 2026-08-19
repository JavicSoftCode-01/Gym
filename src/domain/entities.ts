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
    PAID = "paid",         // pagado completo
    EXPIRED = "expired",   // venció el plazo sin completar el pago (solo mensual)
}

// 🧾 CustomerPlan
export class CustomerPlan {
    id!: number;
    customerId!: number;
    planId!: number;
    startDate!: Date;
    endDate!: Date;
    status!: CustomerPlanStatus;
    hours?: number;
    scheduleIds?: number[];
    customer?: Customer;
    plan?: Plan;
    payments?: Payment[];
}

// 💳 PaymentMethod
export class PaymentMethod extends BaseEntity {
    id!: number;
    name!: string;
}

// 💵 Payment
export class Payment extends BaseEntity {
    id!: number;
    customerPlanId!: number;
    paymentMethodId!: number;
    cashRegisterId?: number | null;
    amount!: number;
    type!: 'payment' | 'adjustment';
    receiptImagePath?: string;
    paidAt!: Date | string;
    customerPlan?: CustomerPlan;
    paymentMethod?: PaymentMethod;
}

// 🛡️ SystemUser
export class SystemUser extends BaseEntity {
    id!: number;
    contact!: string;
    passwordHash!: string;
    role!: string;
}

// 🕵️ AuditLog
export class AuditLog extends BaseEntity {
    id!: number;
    userId!: number;
    action!: "CREATE" | "UPDATE" | "DELETE";
    tableName!: string;
    recordId!: number;
    details?: string;
}

// 💵 CashRegister
export class CashRegister extends BaseEntity {
    id!: number;
    userId!: number;
    status!: 'open' | 'closed';
    openingBalance!: number;
    expectedCash!: number;
    expectedDeposit!: number;
    actualCash!: number;
    actualDeposit!: number;
    difference!: number;
    dailyTotal!: number;
    grandTotal!: number;
    openedAt!: Date | string;
    closedAt?: Date | string | null;
}

// =========================================================================
// 🛒 ENTIDADES DEL MÓDULO POS, PRODUCTOS, PROVEEDORES Y DESCUENTOS
// =========================================================================

// 🚚 Supplier (Proveedor)
export class Supplier extends BaseEntity {
    id!: number;
    name!: string;
    identification?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

// 🗂️ ProductCategory (Categoría de Productos)
export class ProductCategory extends BaseEntity {
    id!: number;
    name!: string;
    description?: string;
}

// 🥤 Product (Producto físico del Gym)
export class Product extends BaseEntity {
    id!: number;
    categoryId!: number;
    supplierId?: number | null;
    name!: string;
    barcode?: string | null;
    description?: string | null;
    costPrice!: number;
    salePrice!: number;
    stock!: number;
    minStock!: number;
    imagePath?: string | null;
    isActive!: boolean;

    category?: ProductCategory;
    supplier?: Supplier;
}

// 🏷️ Discount & Promotions Engine
export enum DiscountType {
    BULK_QUANTITY = "bulk_quantity",   // Descuento por llevar >= N unidades
    TIME_RANGE = "time_range",         // Descuento por fecha o por horas (Happy Hour)
    PERCENTAGE_ALL = "percentage_all", // Descuento general
}

export enum DiscountCalculationType {
    PERCENTAGE = "percentage",     // Porcentaje (ej. 10%)
    FIXED_AMOUNT = "fixed_amount", // Monto fijo de descuento (ej. $1.50)
}

export enum DiscountTargetType {
    ALL = "all",
    PRODUCT = "product",
    CATEGORY = "category",
    PLAN = "plan",
}

export class Discount extends BaseEntity {
    id!: number;
    name!: string;
    type!: DiscountType;
    discountType!: DiscountCalculationType;
    value!: number;
    minQuantity!: number;
    targetType!: DiscountTargetType;
    targetId?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    daysOfWeek?: string | null;
    isActive!: boolean;
}

// 🧾 POS Sale (Venta / Ticket)
export enum SaleStatus {
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

export class Sale extends BaseEntity {
    id!: number;
    userId!: number;
    cashRegisterId!: number;
    customerId?: number | null;
    saleNumber!: string;
    subtotal!: number;
    discountTotal!: number;
    total!: number;
    paymentMethodId!: number;
    notes?: string | null;
    status!: SaleStatus;

    user?: SystemUser;
    customer?: Customer;
    paymentMethod?: PaymentMethod;
    items?: SaleItem[];
}

// 🛍️ SaleItem (Detalle de ticket POS)
export enum SaleItemType {
    PRODUCT = "product",
    PLAN = "plan",
}

export class SaleItem extends BaseEntity {
    id!: number;
    saleId!: number;
    itemType!: SaleItemType;
    productId?: number | null;
    planId?: number | null;
    name!: string;
    quantity!: number;
    unitPrice!: number;
    unitCost!: number;
    discountApplied!: number;
    discountId?: number | null;
    subtotal!: number;

    product?: Product;
    plan?: Plan;
    discount?: Discount;
}

// 📦 StockMovement (Kardex de Inventario)
export enum StockMovementType {
    PURCHASE_IN = "purchase_in",       // Compra recibida de proveedor
    SALE_OUT = "sale_out",             // Salida por venta en POS
    ADJUSTMENT_IN = "adjustment_in",   // Ajuste positivo manual
    ADJUSTMENT_OUT = "adjustment_out", // Ajuste negativo manual
    SPOILAGE_OUT = "spoilage_out",     // Merma / Producto dañado o vencido
}

export class StockMovement {
    id!: number;
    productId!: number;
    userId!: number;
    supplierId?: number | null;
    saleId?: number | null;
    type!: StockMovementType;
    quantity!: number;
    previousStock!: number;
    newStock!: number;
    unitCost?: number | null;
    reason?: string | null;
    createdAt!: Date;

    product?: Product;
    user?: SystemUser;
    supplier?: Supplier;
}