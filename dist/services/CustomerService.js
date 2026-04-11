"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
class CustomerService {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    getAllCustomers() {
        return this.customerRepository.findAll();
    }
    getCustomerById(id) {
        return this.customerRepository.findById(id);
    }
    createCustomer(data, userId) {
        if (!data.fullName || !data.contact) {
            throw new Error("El nombre y el contacto son obligatorios.");
        }
        return this.customerRepository.create(data, userId); // 🌟 pasa userId
    }
    updateCustomer(id, data, userId) {
        return this.customerRepository.update(id, data, userId); // 🌟 pasa userId
    }
    deleteCustomer(id, userId) {
        return this.customerRepository.delete(id, userId); // 🌟 pasa userId
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=CustomerService.js.map