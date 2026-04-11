"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPlanController = void 0;
class CustomerPlanController {
    constructor(customerPlanService) {
        this.customerPlanService = customerPlanService;
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                const assignment = this.customerPlanService.assignPlanToCustomer(req.body, userId);
                res.status(201).json(assignment);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getById = (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const assignment = this.customerPlanService.getAssignmentById(id);
                if (!assignment) {
                    res.status(404).json({ error: "Suscripción no encontrada" });
                    return;
                }
                res.json(assignment);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.getAll = (req, res) => {
            try {
                res.json(this.customerPlanService.getAll());
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.update = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                const updated = this.customerPlanService.updateAssignment(id, req.body, userId);
                res.json(updated);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                res.json(this.customerPlanService.deleteAssignment(id, userId));
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.CustomerPlanController = CustomerPlanController;
//# sourceMappingURL=CustomerPlanController.js.map