import {ICustomerRepository} from "../repositories/interfaces/ICustomerRepository";
import {Customer} from "../domain/entities";

export class CustomerService {
    constructor(private readonly customerRepository: ICustomerRepository) {
    }

    getAllCustomers(): Customer[] {
        return this.customerRepository.findAll();
    }

    getCustomerById(id: number): Customer | undefined {
        return this.customerRepository.findById(id);
    }

    createCustomer(data: { fullName: string; contact: string; inscriptionId?: number | null }, userId: number): Customer {
        if (!data.fullName || !data.contact) {
            throw new Error("El nombre y el contacto son obligatorios.");
        }
        return this.customerRepository.create(data, userId); // 🌟 pasa userId
    }

    updateCustomer(id: number, data: Partial<{ fullName: string; contact: string; inscriptionId?: number | null }>, userId: number): Customer | undefined {
        return this.customerRepository.update(id, data, userId); // 🌟 pasa userId
    }

    deleteCustomer(id: number, userId: number): boolean {
        return this.customerRepository.delete(id, userId); // 🌟 pasa userId
    }
}
