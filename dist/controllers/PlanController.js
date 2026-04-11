"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
class PlanController {
    constructor(planService) {
        this.planService = planService;
        this.getAll = (req, res) => {
            try {
                res.json(this.planService.getAllPlans());
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                const plan = this.planService.createPlan(req.body, userId);
                res.status(201).json(plan);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.update = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                this.planService.updatePlan(id, req.body, userId);
                res.json({ success: true, message: "Plan actualizado." });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                this.planService.deletePlan(id, userId);
                res.json({ success: true, message: "Plan eliminado." });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.PlanController = PlanController;
//# sourceMappingURL=PlanController.js.map