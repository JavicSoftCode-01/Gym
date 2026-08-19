import { Supplier } from "../../domain/entities";

export interface ISupplierRepository {
    findAll(): Supplier[];
    findById(id: number): Supplier | undefined;
    create(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">, userId: number): Supplier;
    update(id: number, data: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>, userId: number): Supplier | undefined;
    delete(id: number, userId: number): boolean;
}
