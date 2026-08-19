import { ISupplierRepository } from "../repositories/interfaces/ISupplierRepository";
import { Supplier } from "../domain/entities";

export class SupplierService {
    constructor(private readonly supplierRepo: ISupplierRepository) {}

    getAll() {
        return this.supplierRepo.findAll();
    }

    getById(id: number) {
        const supplier = this.supplierRepo.findById(id);
        if (!supplier) throw new Error("Proveedor no encontrado.");
        return supplier;
    }

    create(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">, userId: number) {
        if (!data.name || data.name.trim() === "") {
            throw new Error("El nombre o razón social del proveedor es obligatorio.");
        }
        return this.supplierRepo.create(data, userId);
    }

    update(id: number, data: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>, userId: number) {
        const updated = this.supplierRepo.update(id, data, userId);
        if (!updated) throw new Error("Proveedor no encontrado para actualizar.");
        return updated;
    }

    delete(id: number, userId: number) {
        const success = this.supplierRepo.delete(id, userId);
        if (!success) throw new Error("Proveedor no encontrado para eliminar.");
        return { success: true };
    }
}
