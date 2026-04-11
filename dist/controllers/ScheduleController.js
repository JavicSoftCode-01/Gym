"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
class ScheduleController {
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
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                res.status(201).json(this.service.create(req.body, userId));
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const scheduleId = Number(req.params.id);
                if (isNaN(scheduleId) || scheduleId <= 0) {
                    throw new Error("ID de horario inválido.");
                }
                this.service.delete(scheduleId, userId);
                res.status(204).send();
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=ScheduleController.js.map