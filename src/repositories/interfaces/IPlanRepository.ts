import { Plan } from "../../domain/entities";

export interface IPlanRepository {
    findAll(): Plan[];
    findById(id: number): Plan | undefined;
    create(data: Omit<Plan, "id" | "createdAt" | "updatedAt">, userId: number): Plan;
    update(id: number, data: Partial<Plan>, userId: number): void;
    delete(id: number, userId: number): void;
}