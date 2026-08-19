import { IStockMovementRepository, CreateStockMovementDTO } from "../repositories/interfaces/IStockMovementRepository";
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { ISupplierRepository } from "../repositories/interfaces/ISupplierRepository";
import { StockMovementType } from "../domain/entities";

export class StockMovementService {
    constructor(
        private readonly stockMovementRepo: IStockMovementRepository,
        private readonly productRepo: IProductRepository,
        private readonly supplierRepo: ISupplierRepository
    ) {}

    getAllMovements(limit = 100) {
        return this.stockMovementRepo.findAll(limit);
    }

    getMovementsByProduct(productId: number) {
        return this.stockMovementRepo.findByProduct(productId);
    }

    registerSupplierPurchase(data: {
        productId: number;
        supplierId: number;
        quantity: number;
        unitCost: number;
        reason?: string;
    }, userId: number) {
        if (data.quantity <= 0) throw new Error("La cantidad de compra debe ser mayor a 0.");
        if (data.unitCost < 0) throw new Error("El costo unitario no puede ser negativo.");

        const product = this.productRepo.findById(data.productId);
        if (!product) throw new Error("Producto no encontrado.");

        const supplier = this.supplierRepo.findById(data.supplierId);
        if (!supplier) throw new Error("Proveedor no encontrado.");

        return this.stockMovementRepo.create({
            productId: data.productId,
            userId,
            supplierId: data.supplierId,
            type: StockMovementType.PURCHASE_IN,
            quantity: data.quantity,
            unitCost: data.unitCost,
            reason: data.reason || `Compra a proveedor ${supplier.name}`
        });
    }

    registerStockAdjustment(data: {
        productId: number;
        type: StockMovementType.ADJUSTMENT_IN | StockMovementType.ADJUSTMENT_OUT | StockMovementType.SPOILAGE_OUT;
        quantity: number;
        reason: string;
    }, userId: number) {
        if (data.quantity <= 0) throw new Error("La cantidad del ajuste debe ser mayor a 0.");
        if (!data.reason || data.reason.trim() === "") throw new Error("El motivo del ajuste de inventario es obligatorio.");

        const product = this.productRepo.findById(data.productId);
        if (!product) throw new Error("Producto no encontrado.");

        let quantityChange = data.quantity;
        if (data.type === StockMovementType.ADJUSTMENT_OUT || data.type === StockMovementType.SPOILAGE_OUT) {
            if (product.stock < data.quantity) {
                throw new Error(`No se puede descontar más stock del disponible. Stock actual: ${product.stock}`);
            }
            quantityChange = -data.quantity;
        }

        return this.stockMovementRepo.create({
            productId: data.productId,
            userId,
            type: data.type,
            quantity: quantityChange,
            unitCost: product.costPrice,
            reason: data.reason
        });
    }
}
