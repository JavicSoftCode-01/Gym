import { PaymentMethod } from "../../domain/entities";

export interface IPaymentMethodRepository {
    findAll(): PaymentMethod[];
    findById(id: number): PaymentMethod | undefined;
    create(data: { name: string }, userId: number): PaymentMethod;
    update(id: number, data: { name: string }, userId: number): void;
    delete(id: number, userId: number): void;
}
