import { IInscriptionRepository } from "../repositories/interfaces/IInscriptionRepository";
import { Inscription } from "../domain/entities";

export class InscriptionService {
    constructor(private readonly repo: IInscriptionRepository) {}

    getAll(): Inscription[] {
        return this.repo.findAll();
    }

    create(data: { name: string; price: number }, userId: number): Inscription {
        return this.repo.create(data, userId);
    }

    update(id: number, data: { name: string; price: number }, userId: number): void {
        this.repo.update(id, data, userId);
    }

    delete(id: number, userId: number): void {
        this.repo.delete(id, userId);
    }
}

