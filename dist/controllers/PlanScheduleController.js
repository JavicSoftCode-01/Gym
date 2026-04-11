"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanScheduleController = void 0;
class PlanScheduleController {
    constructor(service) {
        this.service = service;
        this.getAll = (req, res) => {
            try {
                res.json(this.service.getAll());
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.assign = (req, res) => {
            try {
                const userId = req.user.id;
                res.status(201).json(this.service.assign(req.body, userId));
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getByPlan = (req, res) => {
            try {
                const planId = parseInt(req.params.planId);
                res.json(this.service.getByPlan(planId));
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
    }
}
exports.PlanScheduleController = PlanScheduleController;
//# sourceMappingURL=PlanScheduleController.js.map