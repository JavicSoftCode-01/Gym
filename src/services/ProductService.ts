import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { Product } from "../domain/entities";

export class ProductService {
    constructor(private readonly productRepo: IProductRepository) {}

    // Categorías
    getAllCategories() {
        return this.productRepo.findAllCategories();
    }

    createCategory(name: string, description?: string) {
        if (!name || name.trim() === "") throw new Error("El nombre de la categoría es obligatorio.");
        return this.productRepo.createCategory(name, description);
    }

    updateCategory(id: number, name: string, description?: string) {
        if (!name || name.trim() === "") throw new Error("El nombre de la categoría es obligatorio.");
        this.productRepo.updateCategory(id, name, description);
        return this.productRepo.findCategoryById(id);
    }

    deleteCategory(id: number) {
        const success = this.productRepo.deleteCategory(id);
        if (!success) throw new Error("No se pudo eliminar la categoría.");
        return { success: true };
    }

    // Productos
    getAllProducts(includeInactive = false) {
        return this.productRepo.findAll(includeInactive);
    }

    getProductById(id: number) {
        const product = this.productRepo.findById(id);
        if (!product) throw new Error("Producto no encontrado.");
        return product;
    }

    getProductByBarcode(barcode: string) {
        const product = this.productRepo.findByBarcode(barcode);
        if (!product) throw new Error(`Producto con código "${barcode}" no encontrado.`);
        return product;
    }

    getLowStockAlerts() {
        const products = this.productRepo.findAll(false);
        return products.filter(p => p.stock <= p.minStock);
    }

    createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">, userId: number) {
        if (!data.name || data.name.trim() === "") throw new Error("El nombre del producto es obligatorio.");
        if (data.salePrice === undefined || data.salePrice < 0) throw new Error("El precio de venta debe ser mayor o igual a 0.");
        if (!data.categoryId) throw new Error("Debe asignar una categoría al producto.");

        return this.productRepo.create(data, userId);
    }

    updateProduct(id: number, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">>, userId: number) {
        const updated = this.productRepo.update(id, data, userId);
        if (!updated) throw new Error("Producto no encontrado para actualizar.");
        return updated;
    }

    deleteProduct(id: number, userId: number) {
        const success = this.productRepo.delete(id, userId);
        if (!success) throw new Error("Producto no encontrado para eliminar.");
        return { success: true };
    }
}
