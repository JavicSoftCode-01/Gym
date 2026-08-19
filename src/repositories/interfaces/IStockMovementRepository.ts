import { StockMovement, StockMovementType } from "../../domain/entities";

export interface CreateStockMovementDTO {
    productId: number;
    userId: number;
    supplierId?: number | null;
    saleId?: number | null;
    type: StockMovementType;
    quantity: number;
    unitCost?: number | null;
    reason?: string | null;
}

export interface IStockMovementRepository {
    findAll(limit?: number): StockMovement[];
    findByProduct(productId: number): StockMovement[];
    create(data: CreateStockMovementDTO): StockMovement;
}
