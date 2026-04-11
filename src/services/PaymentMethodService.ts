import { IPaymentMethodRepository } from "../repositories/interfaces/IPaymentMethodRepository";
import { PaymentMethod } from "../domain/entities";

export class PaymentMethodService {
    constructor(private readonly repo: IPaymentMethodRepository) {}

    getAll(): PaymentMethod[] {
        return this.repo.findAll();
    }

    create(data: { name: string }, userId: number): PaymentMethod {
        return this.repo.create(data, userId);
    }

    update(id: number, data: { name: string }, userId: number): void {
        this.repo.update(id, data, userId);
    }

    delete(id: number, userId: number): void {
        this.repo.delete(id, userId);
    }
}
