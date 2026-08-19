import db from "../../database/database";
import { StockMovement, StockMovementType } from "../../domain/entities";
import { CreateStockMovementDTO, IStockMovementRepository } from "../interfaces/IStockMovementRepository";

export class StockMovementRepository implements IStockMovementRepository {
    findAll(limit = 100): StockMovement[] {
        const query = `
            SELECT sm.id, sm.product_id as productId, sm.user_id as userId,
                   sm.supplier_id as supplierId, sm.sale_id as saleId,
                   sm.type, sm.quantity, sm.previous_stock as previousStock,
                   sm.new_stock as newStock, sm.unit_cost as unitCost,
                   sm.reason, sm.created_at as createdAt,
                   p.name as productName,
                   su.contact as userName,
                   s.name as supplierName
            FROM stock_movements sm
            LEFT JOIN products p ON p.id = sm.product_id
            LEFT JOIN system_users su ON su.id = sm.user_id
            LEFT JOIN suppliers s ON s.id = sm.supplier_id
            ORDER BY sm.id DESC
            LIMIT ?
        `;

        const rows = db.prepare(query).all(limit) as any[];
        return rows.map(r => ({
            id: r.id,
            productId: r.productId,
            userId: r.userId,
            supplierId: r.supplierId,
            saleId: r.saleId,
            type: r.type as StockMovementType,
            quantity: r.quantity,
            previousStock: r.previousStock,
            newStock: r.newStock,
            unitCost: r.unitCost,
            reason: r.reason,
            createdAt: new Date(r.createdAt),
            product: r.productName ? { id: r.productId, name: r.productName } as any : undefined,
            user: r.userName ? { id: r.userId, contact: r.userName } as any : undefined,
            supplier: r.supplierName ? { id: r.supplierId, name: r.supplierName } as any : undefined
        }));
    }

    findByProduct(productId: number): StockMovement[] {
        return this.findAll(200).filter(m => m.productId === productId);
    }

    create(data: CreateStockMovementDTO): StockMovement {
        // Obtenemos el stock actual del producto
        const product = db.prepare(`SELECT stock, cost_price FROM products WHERE id = ?`).get(data.productId) as { stock: number; cost_price: number } | undefined;
        if (!product) throw new Error("Producto no encontrado para registrar movimiento.");

        const previousStock = product.stock;
        const newStock = previousStock + data.quantity;
        const now = new Date().toISOString();

        // Registrar movimiento
        const insertStmt = db.prepare(`
            INSERT INTO stock_movements (product_id, user_id, supplier_id, sale_id, type, quantity, previous_stock, new_stock, unit_cost, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertStmt.run(
            data.productId,
            data.userId,
            data.supplierId || null,
            data.saleId || null,
            data.type,
            data.quantity,
            previousStock,
            newStock,
            data.unitCost !== undefined ? data.unitCost : product.cost_price,
            data.reason || null,
            now
        );

        // Actualizar stock en la tabla de productos (y costo unitario si es compra)
        if (data.type === StockMovementType.PURCHASE_IN && data.unitCost !== undefined && data.unitCost !== null && data.unitCost > 0) {
            db.prepare(`UPDATE products SET stock = ?, cost_price = ?, updated_at = ? WHERE id = ?`).run(newStock, data.unitCost, now, data.productId);
        } else {
            db.prepare(`UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`).run(newStock, now, data.productId);
        }

        const newId = result.lastInsertRowid as number;
        return {
            id: newId,
            productId: data.productId,
            userId: data.userId,
            supplierId: data.supplierId,
            saleId: data.saleId,
            type: data.type,
            quantity: data.quantity,
            previousStock,
            newStock,
            unitCost: data.unitCost,
            reason: data.reason,
            createdAt: new Date(now)
        };
    }
}
