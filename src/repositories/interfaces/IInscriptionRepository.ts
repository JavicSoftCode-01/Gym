import { Inscription } from "../../domain/entities";

export interface IInscriptionRepository {
    findAll(): Inscription[];
    findById(id: number): Inscription | undefined;
    create(data: { name: string; price: number }, userId: number): Inscription;
    update(id: number, data: { name: string; price: number }, userId: number): void;
    delete(id: number, userId: number): void;
}

