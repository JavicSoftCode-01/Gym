import { IDiscountRepository } from "../repositories/interfaces/IDiscountRepository";
import { Discount, DiscountCalculationType, DiscountTargetType, DiscountType } from "../domain/entities";

export interface CartItemToEvaluate {
    itemType: 'product' | 'plan';
    id: number; // productId or planId
    name: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    categoryId?: number;
}

export interface EvaluatedItem {
    itemType: 'product' | 'plan';
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    originalSubtotal: number;
    discountApplied: number;
    discountId?: number | null;
    discountName?: string | null;
    finalSubtotal: number;
}

export interface EvaluatedCartResult {
    items: EvaluatedItem[];
    subtotal: number;
    discountTotal: number;
    total: number;
}

export class DiscountEngineService {
    constructor(private readonly discountRepo: IDiscountRepository) {}

    getAll(includeInactive = true) {
        return this.discountRepo.findAll(includeInactive);
    }

    getById(id: number) {
        const discount = this.discountRepo.findById(id);
        if (!discount) throw new Error("Descuento no encontrado.");
        return discount;
    }

    create(data: Omit<Discount, "id" | "createdAt" | "updatedAt">, userId: number) {
        if (!data.name || data.name.trim() === "") throw new Error("El nombre de la promoción es obligatorio.");
        if (data.value === undefined || data.value <= 0) throw new Error("El valor del descuento debe ser mayor a 0.");
        return this.discountRepo.create(data, userId);
    }

    update(id: number, data: Partial<Omit<Discount, "id" | "createdAt" | "updatedAt">>, userId: number) {
        const updated = this.discountRepo.update(id, data, userId);
        if (!updated) throw new Error("Descuento no encontrado para actualizar.");
        return updated;
    }

    toggleActive(id: number, isActive: boolean, userId: number) {
        return this.discountRepo.toggleActive(id, isActive, userId);
    }

    delete(id: number, userId: number) {
        const success = this.discountRepo.delete(id, userId);
        if (!success) throw new Error("Descuento no encontrado para eliminar.");
        return { success: true };
    }

    // -------------------------------------------------------------
    // MOTOR DE EVALUACIÓN INTELIGENTE DE DESCUENTOS Y PROMOCIONES
    // -------------------------------------------------------------
    evaluateCart(items: CartItemToEvaluate[], referenceDate = new Date()): EvaluatedCartResult {
        const activeDiscounts = this.discountRepo.findActiveDiscounts();
        const dateStr = referenceDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const timeStr = referenceDate.toTimeString().slice(0, 5); // HH:MM
        const dayOfWeek = referenceDate.getDay().toString(); // 0: Dom, 1: Lun, ...

        let cartSubtotal = 0;
        let cartDiscountTotal = 0;

        const evaluatedItems: EvaluatedItem[] = items.map(item => {
            const originalSubtotal = Number((item.unitPrice * item.quantity).toFixed(2));
            cartSubtotal += originalSubtotal;

            let bestDiscountAmount = 0;
            let appliedDiscountId: number | null = null;
            let appliedDiscountName: string | null = null;

            for (const disc of activeDiscounts) {
                // 1. Validar fechas de vigencia
                if (disc.startDate && dateStr < disc.startDate) continue;
                if (disc.endDate && dateStr > disc.endDate) continue;

                // 2. Validar rango de horas (Happy Hour)
                if (disc.startTime && disc.endTime) {
                    if (timeStr < disc.startTime || timeStr > disc.endTime) continue;
                }

                // 3. Validar días de la semana
                if (disc.daysOfWeek && disc.daysOfWeek.trim() !== "") {
                    const allowedDays = disc.daysOfWeek.split(",").map(d => d.trim());
                    if (!allowedDays.includes(dayOfWeek)) continue;
                }

                // 4. Validar objetivo del descuento (target)
                let matchesTarget = false;
                if (disc.targetType === DiscountTargetType.ALL) {
                    matchesTarget = true;
                } else if (disc.targetType === DiscountTargetType.PRODUCT && item.itemType === 'product') {
                    matchesTarget = disc.targetId === item.id;
                } else if (disc.targetType === DiscountTargetType.CATEGORY && item.itemType === 'product') {
                    matchesTarget = disc.targetId === item.categoryId;
                } else if (disc.targetType === DiscountTargetType.PLAN && item.itemType === 'plan') {
                    matchesTarget = disc.targetId === item.id;
                }

                if (!matchesTarget) continue;

                // 5. Validar condición por volumen/cantidad
                const minQty = disc.minQuantity || 1;
                if (item.quantity < minQty) continue;

                // 6. Calcular monto del descuento
                let currentDiscountAmount = 0;
                if (disc.discountType === DiscountCalculationType.PERCENTAGE) {
                    currentDiscountAmount = (originalSubtotal * disc.value) / 100;
                } else if (disc.discountType === DiscountCalculationType.FIXED_AMOUNT) {
                    if (disc.type === DiscountType.BULK_QUANTITY) {
                        currentDiscountAmount = disc.value * item.quantity;
                    } else {
                        currentDiscountAmount = disc.value;
                    }
                }

                // Asegurar que el descuento no supere el precio del producto
                currentDiscountAmount = Math.min(originalSubtotal, Math.max(0, currentDiscountAmount));

                // Seleccionar el descuento más beneficioso para el cliente
                if (currentDiscountAmount > bestDiscountAmount) {
                    bestDiscountAmount = Number(currentDiscountAmount.toFixed(2));
                    appliedDiscountId = disc.id;
                    appliedDiscountName = disc.name;
                }
            }

            cartDiscountTotal += bestDiscountAmount;
            const finalSubtotal = Number((originalSubtotal - bestDiscountAmount).toFixed(2));

            return {
                itemType: item.itemType,
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: item.unitCost || 0,
                originalSubtotal,
                discountApplied: bestDiscountAmount,
                discountId: appliedDiscountId,
                discountName: appliedDiscountName,
                finalSubtotal
            };
        });

        cartSubtotal = Number(cartSubtotal.toFixed(2));
        cartDiscountTotal = Number(cartDiscountTotal.toFixed(2));
        const total = Number((cartSubtotal - cartDiscountTotal).toFixed(2));

        return {
            items: evaluatedItems,
            subtotal: cartSubtotal,
            discountTotal: cartDiscountTotal,
            total
        };
    }
}
