import db from "../../database/database";
import { Sale, SaleItem, SaleStatus, StockMovementType } from "../../domain/entities";
import { CreateSaleDTO, ISaleRepository } from "../interfaces/ISaleRepository";
import { AuditRepository } from "./AuditRepository";

export class SaleRepository implements ISaleRepository {
    findAll(): Sale[] {
        const query = `
            SELECT s.id, s.user_id as userId, s.cash_register_id as cashRegisterId, s.customer_id as customerId,
                   s.sale_number as saleNumber, s.subtotal, s.discount_total as discountTotal,
                   s.total, s.payment_method_id as paymentMethodId, s.notes, s.status,
                   s.created_at as createdAt, s.updated_at as updatedAt,
                   su.contact as userName,
                   c.full_name as customerName,
                   pm.name as paymentMethodName
            FROM sales s
            LEFT JOIN system_users su ON su.id = s.user_id
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
            ORDER BY s.id DESC
        `;

        const rows = db.prepare(query).all() as any[];
        return rows.map(r => ({
            id: r.id,
            userId: r.userId,
            cashRegisterId: r.cashRegisterId,
            customerId: r.customerId,
            saleNumber: r.saleNumber,
            subtotal: r.subtotal,
            discountTotal: r.discountTotal,
            total: r.total,
            paymentMethodId: r.paymentMethodId,
            notes: r.notes,
            status: r.status as SaleStatus,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            user: r.userName ? { id: r.userId, contact: r.userName } as any : undefined,
            customer: r.customerName ? { id: r.customerId, fullName: r.customerName } as any : undefined,
            paymentMethod: r.paymentMethodName ? { id: r.paymentMethodId, name: r.paymentMethodName } as any : undefined
        }));
    }

    findById(id: number): Sale | undefined {
        const row = db.prepare(`
            SELECT s.id, s.user_id as userId, s.cash_register_id as cashRegisterId, s.customer_id as customerId,
                   s.sale_number as saleNumber, s.subtotal, s.discount_total as discountTotal,
                   s.total, s.payment_method_id as paymentMethodId, s.notes, s.status,
                   s.created_at as createdAt, s.updated_at as updatedAt,
                   su.contact as userName,
                   c.full_name as customerName,
                   pm.name as paymentMethodName
            FROM sales s
            LEFT JOIN system_users su ON su.id = s.user_id
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
            WHERE s.id = ?
        `).get(id) as any;

        if (!row) return undefined;

        // Cargar los items de la venta
        const itemRows = db.prepare(`
            SELECT si.id, si.sale_id as saleId, si.item_type as itemType,
                   si.product_id as productId, si.plan_id as planId,
                   si.name, si.quantity, si.unit_price as unitPrice,
                   si.unit_cost as unitCost, si.discount_applied as discountApplied,
                   si.discount_id as discountId, si.subtotal,
                   si.created_at as createdAt, si.updated_at as updatedAt,
                   p.name as productName, pl.price as planPrice
            FROM sale_items si
            LEFT JOIN products p ON p.id = si.product_id
            LEFT JOIN plans pl ON pl.id = si.plan_id
            WHERE si.sale_id = ?
        `).all(id) as any[];

        const items: SaleItem[] = itemRows.map(i => ({
            id: i.id,
            saleId: i.saleId,
            itemType: i.itemType,
            productId: i.productId,
            planId: i.planId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unitCost: i.unitCost,
            discountApplied: i.discountApplied,
            discountId: i.discountId,
            subtotal: i.subtotal,
            createdAt: new Date(i.createdAt),
            updatedAt: new Date(i.updatedAt),
            product: i.productName ? { id: i.productId, name: i.productName } as any : undefined
        }));

        return {
            id: row.id,
            userId: row.userId,
            cashRegisterId: row.cashRegisterId,
            customerId: row.customerId,
            saleNumber: row.saleNumber,
            subtotal: row.subtotal,
            discountTotal: row.discountTotal,
            total: row.total,
            paymentMethodId: row.paymentMethodId,
            notes: row.notes,
            status: row.status as SaleStatus,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            user: row.userName ? { id: row.userId, contact: row.userName } as any : undefined,
            customer: row.customerName ? { id: row.customerId, fullName: row.customerName } as any : undefined,
            paymentMethod: row.paymentMethodName ? { id: row.paymentMethodId, name: row.paymentMethodName } as any : undefined,
            items
        };
    }

    findBySaleNumber(saleNumber: string): Sale | undefined {
        const row = db.prepare(`SELECT id FROM sales WHERE sale_number = ?`).get(saleNumber) as { id: number } | undefined;
        return row ? this.findById(row.id) : undefined;
    }

    createSaleTransaction(dto: CreateSaleDTO): Sale {
        const now = new Date().toISOString();
        const dateStr = now.slice(0, 10).replace(/-/g, "");
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const saleNumber = `TKT-${dateStr}-${randomSuffix}`;

        // Transacción atómica SQLite con better-sqlite3
        const runTransaction = db.transaction(() => {
            // 1. Insertar encabezado de venta
            const insertSale = db.prepare(`
                INSERT INTO sales (user_id, cash_register_id, customer_id, sale_number, subtotal, discount_total, total, payment_method_id, notes, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const saleResult = insertSale.run(
                dto.userId,
                dto.cashRegisterId,
                dto.customerId || null,
                saleNumber,
                dto.subtotal,
                dto.discountTotal,
                dto.total,
                dto.paymentMethodId,
                dto.notes || null,
                'completed',
                now,
                now
            );

            const saleId = saleResult.lastInsertRowid as number;

            // Prepared statements reutilizables dentro de la transacción
            const insertItemStmt = db.prepare(`
                INSERT INTO sale_items (sale_id, item_type, product_id, plan_id, name, quantity, unit_price, unit_cost, discount_applied, discount_id, subtotal, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const getProductStmt = db.prepare(`SELECT id, name, stock, cost_price FROM products WHERE id = ?`);
            const updateProductStockStmt = db.prepare(`UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`);
            const insertStockMovementStmt = db.prepare(`
                INSERT INTO stock_movements (product_id, user_id, supplier_id, sale_id, type, quantity, previous_stock, new_stock, unit_cost, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // 2. Procesar cada item del ticket
            for (const item of dto.items) {
                insertItemStmt.run(
                    saleId,
                    item.itemType,
                    item.productId || null,
                    item.planId || null,
                    item.name,
                    item.quantity,
                    item.unitPrice,
                    item.unitCost,
                    item.discountApplied,
                    item.discountId || null,
                    item.subtotal,
                    now,
                    now
                );

                // Si es un producto físico, verificar stock y descontar en el Kardex
                if (item.itemType === 'product' && item.productId) {
                    const product = getProductStmt.get(item.productId) as { id: number; name: string; stock: number; cost_price: number } | undefined;
                    if (!product) {
                        throw new Error(`Producto #${item.productId} no encontrado.`);
                    }

                    if (product.stock < item.quantity) {
                        throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}.`);
                    }

                    const previousStock = product.stock;
                    const newStock = previousStock - item.quantity;

                    // Descontar inventario
                    updateProductStockStmt.run(newStock, now, item.productId);

                    // Registrar movimiento de salida
                    insertStockMovementStmt.run(
                        item.productId,
                        dto.userId,
                        null,
                        saleId,
                        StockMovementType.SALE_OUT,
                        -item.quantity,
                        previousStock,
                        newStock,
                        product.cost_price,
                        `Venta POS ${saleNumber}`,
                        now
                    );
                }
            }

            AuditRepository.log(dto.userId, "CREATE", "sales", saleId, { saleNumber, total: dto.total, itemsCount: dto.items.length });
            return saleId;
        });

        const createdId = runTransaction();
        return this.findById(createdId)!;
    }

    getTodaySalesTotal(date: string): { methodName: string | null; total: number }[] {
        return db.prepare(`
            SELECT pm.name as methodName, SUM(s.total) as total
            FROM sales s
            LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
            WHERE DATE(s.created_at) = ? AND s.status = 'completed'
            GROUP BY pm.name
        `).all(date) as { methodName: string | null; total: number }[];
    }

    cancelSale(id: number, userId: number, reason?: string): boolean {
        const sale = this.findById(id);
        if (!sale || sale.status === SaleStatus.CANCELLED) return false;

        const now = new Date().toISOString();

        const cancelTransaction = db.transaction(() => {
            // Revertir estado de venta
            db.prepare(`UPDATE sales SET status = 'cancelled', updated_at = ? WHERE id = ?`).run(now, id);

            // Reintegrar stock de productos devueltos
            const getProductStmt = db.prepare(`SELECT stock, cost_price FROM products WHERE id = ?`);
            const updateProductStockStmt = db.prepare(`UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`);
            const insertStockMovementStmt = db.prepare(`
                INSERT INTO stock_movements (product_id, user_id, supplier_id, sale_id, type, quantity, previous_stock, new_stock, unit_cost, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            if (sale.items) {
                for (const item of sale.items) {
                    if (item.itemType === 'product' && item.productId) {
                        const product = getProductStmt.get(item.productId) as { stock: number; cost_price: number } | undefined;
                        if (product) {
                            const previousStock = product.stock;
                            const newStock = previousStock + item.quantity;

                            updateProductStockStmt.run(newStock, now, item.productId);

                            insertStockMovementStmt.run(
                                item.productId,
                                userId,
                                null,
                                id,
                                StockMovementType.ADJUSTMENT_IN,
                                item.quantity,
                                previousStock,
                                newStock,
                                product.cost_price,
                                `Anulación venta ${sale.saleNumber}. Motivo: ${reason || 'N/A'}`,
                                now
                            );
                        }
                    }
                }
            }

            AuditRepository.log(userId, "UPDATE", "sales", id, { status: "cancelled", reason });
        });

        cancelTransaction();
        return true;
    }
}
