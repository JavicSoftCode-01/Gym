import {Customer} from "../../domain/entities";

export interface ICustomerRepository {
    findAll(): Customer[];

    findById(id: number): Customer | undefined;

    create(data: { fullName: string; contact: string }): Customer;

    update(id: number, data: Partial<{ fullName: string; contact: string }>): Customer | undefined;

    delete(id: number): boolean;
}