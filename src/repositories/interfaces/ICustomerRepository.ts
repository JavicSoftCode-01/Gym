// src/repositories/interfaces/ICustomerRepository.ts
import {Customer} from "../../domain/entities";

export interface ICustomerRepository {
    findAll(): Customer[];

    findById(id: number): Customer | undefined;

    create(data: { fullName: string; contact: string }, userId: number): Customer;

    update(id: number, data: Partial<{ fullName: string; contact: string }>, userId: number): Customer | undefined;

    delete(id: number, userId: number): boolean;
}