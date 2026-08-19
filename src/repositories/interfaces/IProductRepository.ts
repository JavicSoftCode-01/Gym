import { Product, ProductCategory } from "../../domain/entities";

export interface IProductRepository {
    // Categorías
    findAllCategories(): ProductCategory[];
    findCategoryById(id: number): ProductCategory | undefined;
    createCategory(name: string, description?: string): ProductCategory;
    updateCategory(id: number, name: string, description?: string): void;
    deleteCategory(id: number): boolean;

    // Productos
    findAll(includeInactive?: boolean): Product[];
    findById(id: number): Product | undefined;
    findByBarcode(barcode: string): Product | undefined;
    findByCategory(categoryId: number): Product[];
    create(data: Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">, userId: number): Product;
    update(id: number, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "category" | "supplier">>, userId: number): Product | undefined;
    updateStock(id: number, quantityChange: number): Product | undefined;
    delete(id: number, userId: number): boolean;
}
