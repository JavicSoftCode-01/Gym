"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
class CustomerController {
    constructor(customerService) {
        this.customerService = customerService;
        this.getAll = (_req, res) => {
            try {
                const customers = this.customerService.getAllCustomers();
                res.json(customers);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.getById = (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const customer = this.customerService.getCustomerById(id);
                if (!customer) {
                    res.status(404).json({ error: "Cliente no encontrado" });
                    return;
                }
                res.json(customer);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                const customer = this.customerService.createCustomer(req.body, userId);
                res.status(201).json(customer);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.update = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id);
                const customer = this.customerService.updateCustomer(id, req.body, userId);
                if (!customer) {
                    res.status(404).json({ error: "Cliente no encontrado" });
                    return;
                }
                res.json(customer);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id);
                const success = this.customerService.deleteCustomer(id, userId);
                if (!success) {
                    res.status(404).json({ error: "Cliente no encontrado" });
                    return;
                }
                res.status(204).send();
            }
            catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                    res.status(400).json({ error: "No se puede eliminar. Este cliente tiene planes o registros asociados." });
                    return;
                }
                res.status(500).json({ error: error.message });
            }
        };
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=CustomerController.js.map