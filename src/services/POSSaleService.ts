import { ISaleRepository } from "../repositories/interfaces/ISaleRepository";
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";
import { IPaymentMethodRepository } from "../repositories/interfaces/IPaymentMethodRepository";
import { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";
import { DiscountEngineService, CartItemToEvaluate } from "./DiscountEngineService";

export interface ProcessPOSSaleRequest {
    customerId?: number | null;
    paymentMethodId: number;
    notes?: string | null;
    items: {
        itemType: 'product' | 'plan';
        id: number;
        quantity: number;
    }[];
}

export class POSSaleService {
    constructor(
        private readonly saleRepo: ISaleRepository,
        private readonly productRepo: IProductRepository,
        private readonly planRepo: IPlanRepository,
        private readonly paymentMethodRepo: IPaymentMethodRepository,
        private readonly discountEngine: DiscountEngineService,
        private readonly cashRegisterRepo: ICashRegisterRepository
    ) {}

    getAllSales() {
        return this.saleRepo.findAll();
    }

    getSaleById(id: number) {
        const sale = this.saleRepo.findById(id);
        if (!sale) throw new Error("Ticket de venta no encontrado.");
        return sale;
    }

    getSaleByNumber(saleNumber: string) {
        const sale = this.saleRepo.findBySaleNumber(saleNumber);
        if (!sale) throw new Error(`Venta con número "${saleNumber}" no encontrada.`);
        return sale;
    }

    quoteCart(items: { itemType: 'product' | 'plan'; id: number; quantity: number }[]) {
        const itemsToEvaluate = this.hydrateItems(items);
        return this.discountEngine.evaluateCart(itemsToEvaluate);
    }

    processSale(data: ProcessPOSSaleRequest, userId: number) {
        if (!data.items || data.items.length === 0) {
            throw new Error("El carrito de compras está vacío.");
        }

        const paymentMethod = this.paymentMethodRepo.findById(data.paymentMethodId);
        if (!paymentMethod) {
            throw new Error("Método de pago no válido o no seleccionado.");
        }

        const activeRegister = this.cashRegisterRepo.getActiveRegister(userId);
        if (!activeRegister) {
            throw new Error("No tienes un turno de caja abierto. Por favor abre caja primero.");
        }

        // 1. Hidratar items de la base de datos y verificar stock preliminar
        const itemsToEvaluate = this.hydrateItems(data.items);

        // 2. Evaluar reglas de descuento automáticas (por tiempo y por volumen)
        const evaluated = this.discountEngine.evaluateCart(itemsToEvaluate);

        if (evaluated.total < 0) {
            throw new Error("El total de la venta no puede ser negativo.");
        }

        // 3. Preparar DTO para la transacción atómica
        const saleDTO = {
            userId,
            cashRegisterId: activeRegister.id,
            customerId: data.customerId || null,
            paymentMethodId: data.paymentMethodId,
            notes: data.notes || null,
            subtotal: evaluated.subtotal,
            discountTotal: evaluated.discountTotal,
            total: evaluated.total,
            items: evaluated.items.map(item => ({
                itemType: item.itemType,
                productId: item.itemType === 'product' ? item.id : null,
                planId: item.itemType === 'plan' ? item.id : null,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: item.unitCost,
                discountApplied: item.discountApplied,
                discountId: item.discountId || null,
                subtotal: item.finalSubtotal
            }))
        };

        // 4. Ejecutar transacción de venta en base de datos
        return this.saleRepo.createSaleTransaction(saleDTO);
    }

    cancelSale(id: number, userId: number, reason?: string) {
        const success = this.saleRepo.cancelSale(id, userId, reason);
        if (!success) throw new Error("No se pudo anular la venta o ya se encontraba anulada.");
        return { success: true, message: "Venta anulada e inventario restablecido correctamente." };
    }

    private hydrateItems(items: { itemType: 'product' | 'plan'; id: number; quantity: number }[]): CartItemToEvaluate[] {
        return items.map(rawItem => {
            if (rawItem.quantity <= 0) {
                throw new Error("La cantidad de cada item debe ser al menos 1.");
            }

            if (rawItem.itemType === 'product') {
                const product = this.productRepo.findById(rawItem.id);
                if (!product) throw new Error(`Producto #${rawItem.id} no encontrado.`);
                if (!product.isActive) throw new Error(`El producto "${product.name}" no está activo para venta.`);
                if (product.stock < rawItem.quantity) {
                    throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${rawItem.quantity}.`);
                }

                return {
                    itemType: 'product',
                    id: product.id,
                    name: product.name,
                    quantity: rawItem.quantity,
                    unitPrice: product.salePrice,
                    unitCost: product.costPrice,
                    categoryId: product.categoryId
                };
            } else if (rawItem.itemType === 'plan') {
                const plan = this.planRepo.findById(rawItem.id);
                if (!plan) throw new Error(`Plan #${rawItem.id} no encontrado.`);
                const planName = plan.service?.title ? `${plan.service.title} (${plan.type === 'daily' ? 'Diario' : 'Mensual'})` : `Plan #${plan.id}`;

                return {
                    itemType: 'plan',
                    id: plan.id,
                    name: planName,
                    quantity: rawItem.quantity,
                    unitPrice: plan.price,
                    unitCost: 0
                };
            } else {
                throw new Error(`Tipo de item desconocido: ${rawItem.itemType}`);
            }
        });
    }
}
