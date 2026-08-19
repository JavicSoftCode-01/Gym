import db from "../../database/database";
import { Product, ProductCategory } from "../../domain/entities";
import { IProductRepository } from "../interfaces/IProductRepository";
import { AuditRepository } from "./AuditRepository";

export class ProductRepository implements IProductRepository {
    // ----------------------------------------------------
    // CATEGORÍAS
    // ----------------------------------------------------
    findAllCategories(): ProductCategory[] {
        return db.prepare(`
            SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
            FROM product_categories
            ORDER BY name ASC
        `).all() as ProductCategory[];
    }

    findCategoryById(id: number): ProductCategory | undefined {
        return db.prepare(`
            SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
            FROM product_categories
            WHERE id = ?
        `).get(id) as ProductCategory | undefined;
    }

    createCategory(name: string, description?: string): ProductCategory {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO product_categories (name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(name.trim(), description?.trim() || null, now, now);

        return this.findCategoryById(result.lastInsertRowid as number)!;
    }

    updateCategory(id: number, name: string, description?: string): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE product_categories
            SET name = ?, description = ?, updated_at = ?
            WHERE id = ?
        `).run(name.trim(), description?.trim() || null, now, id);
    }

    deleteCategory(id: number): boolean {
        const result = db.prepare(`DELETE FROM product_categories WHERE id = ?`).run(id);
        return result.changes > 0;
    }

    // ----------------------------------------------------
    // PRODUCTOS
    // ----------------------------------------------------
    findAll(includeInactive = false): Product[] {
        const query = `
            SELECT p.id, p.category_id as categoryId, p.supplier_id as supplierId,
                   p.name, p.barcode, p.description, p.cost_price as costPrice,
                   p.sale_price as salePrice, p.stock, p.min_stock as minStock,
                   p.image_path as imagePath, p.is_active as isActive,
                   p.created_at as createdAt, p.updated_at as updatedAt,
                   c.name as categoryName,
                   s.name as supplierName
            FROM products p
            LEFT JOIN product_categories c ON c.id = p.category_id
            LEFT JOIN suppliers s ON s.id = p.supplier_id
            ${includeInactive ? '' : 'WHERE p.is_active = 1'}
            ORDER BY p.name ASC
        `;

        const rows = db.prepare(query).all() as any[];
        return rows.map(r => ({
            id: r.id,
            categoryId: r.categoryId,
            supplierId: r.supplierId,
            name: r.name,
            barcode: r.barcode,
            description: r.description,
            costPrice: r.costPrice,
            salePrice: r.salePrice,
            stock: r.stock,
            minStock: r.minStock,
            imagePath: r.imagePath,
            isActive: Boolean(r.isActive),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            category: r.categoryName ? { id: r.categoryId, name: r.categoryName } as ProductCategory : undefined,
            supplier: r.supplierName ? { id: r.supplierId, name: r.supplierName } as any : undefined
        }));
    }

    findById(id: number): Product | undefined {
        const row = db.prepare(`
            SELECT p.id, p.category_id as categoryId, p.supplier_id as supplierId,
                   p.name, p.barcode, p.description, p.cost_price as costPrice,
                   p.sale_price as salePrice, p.stock, p.min_stock as minStock,
                   p.image_path as imagePath, p.is_active as isActive,
                   p.created_at as createdAt, p.updated_at as updatedAt,
                   c.name as categoryName,
                   s.name as supplierName
            FROM products p
            LEFT JOIN product_categories c ON c.id = p.category_id
            LEFT JOIN suppliers s ON s.id = p.supplier_id
            WHERE p.id = ?
        `).get(id) as any;

        if (!row) return undefined;

        return {
            id: row.id,
            categoryId: row.categoryId,
            supplierId: row.supplierId,
            name: row.name,
            barcode: row.barcode,
            description: row.description,
            costPrice: row.costPrice,
            salePrice: row.salePrice,
            stock: row.stock,
            minStock: row.minStock,
            imagePath: row.imagePath,
            isActive: Boolean(row.isActive),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            category: row.categoryName ? { id: row.categoryId, name: row.categoryName } as ProductCategory : undefined,
            supplier: row.supplierName ? { id: row.supplierId, name: row.supplierName } as any : undefined
        };
    }

    findByBarcode(barcode: string): Product | undefined {
        const row = db.prepare(`SELECT id FROM products WHERE barcode = ?`).get(barcode) as { id: number } | undefined;
        return row ? this.findById(row.id) : undefined;
    }

    findByCategory(categoryId: number): Product[] {
        return this.findAll(false).filter(p => p.categoryId === categoryId);
    }

    create(data: Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">, userId: number): Product {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO products (category_id, supplier_id, name, barcode, description, cost_price, sale_price, stock, min_stock, image_path, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.categoryId,
            data.supplierId || null,
            data.name.trim(),
            data.barcode?.trim() || null,
            data.description?.trim() || null,
            data.costPrice || 0,
            data.salePrice,
            data.stock || 0,
            data.minStock !== undefined ? data.minStock : 5,
            data.imagePath || null,
            data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
            now,
            now
        );

        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "products", newId, data);
        return this.findById(newId)!;
    }

    update(id: number, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">>, userId: number): Product | undefined {
        const existing = this.findById(id);
        if (!existing) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE products
            SET category_id = COALESCE(?, category_id),
                supplier_id = COALESCE(?, supplier_id),
                name = COALESCE(?, name),
                barcode = COALESCE(?, barcode),
                description = COALESCE(?, description),
                cost_price = COALESCE(?, cost_price),
                sale_price = COALESCE(?, sale_price),
                stock = COALESCE(?, stock),
                min_stock = COALESCE(?, min_stock),
                image_path = COALESCE(?, image_path),
                is_active = COALESCE(?, is_active),
                updated_at = ?
            WHERE id = ?
        `).run(
            data.categoryId !== undefined ? data.categoryId : null,
            data.supplierId !== undefined ? data.supplierId : null,
            data.name?.trim() || null,
            data.barcode !== undefined ? data.barcode : null,
            data.description !== undefined ? data.description : null,
            data.costPrice !== undefined ? data.costPrice : null,
            data.salePrice !== undefined ? data.salePrice : null,
            data.stock !== undefined ? data.stock : null,
            data.minStock !== undefined ? data.minStock : null,
            data.imagePath !== undefined ? data.imagePath : null,
            data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
            now,
            id
        );

        AuditRepository.log(userId, "UPDATE", "products", id, data);
        return this.findById(id);
    }

    updateStock(id: number, quantityChange: number): Product | undefined {
        db.prepare(`
            UPDATE products
            SET stock = stock + ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(quantityChange, id);

        return this.findById(id);
    }

    delete(id: number, userId: number): boolean {
        const existing = this.findById(id);
        if (!existing) return false;

        // Soft delete (desactivar para no romper tickets de venta anteriores)
        db.prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
        AuditRepository.log(userId, "DELETE", "products", id, existing);
        return true;
    }
}
