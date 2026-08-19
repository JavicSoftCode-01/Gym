import { Discount } from "../../domain/entities";

export interface IDiscountRepository {
    findAll(includeInactive?: boolean): Discount[];
    findById(id: number): Discount | undefined;
    findActiveDiscounts(): Discount[];
    create(data: Omit<Discount, "id" | "createdAt" | "updatedAt">, userId: number): Discount;
    update(id: number, data: Partial<Omit<Discount, "id" | "createdAt" | "updatedAt">>, userId: number): Discount | undefined;
    toggleActive(id: number, isActive: boolean, userId: number): boolean;
    delete(id: number, userId: number): boolean;
}
