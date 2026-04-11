"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
class ServiceController {
    constructor(gymService) {
        this.gymService = gymService;
        this.getAll = (_req, res) => {
            try {
                const services = this.gymService.getAllServices();
                res.json(services);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.getById = (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const service = this.gymService.getServiceById(id);
                if (!service) {
                    res.status(404).json({ error: "Servicio no encontrado" });
                    return;
                }
                res.json(service);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                const service = this.gymService.createService(req.body, userId);
                res.status(201).json(service);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.update = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id);
                const service = this.gymService.updateService(id, req.body, userId);
                if (!service) {
                    res.status(404).json({ error: "Servicio no encontrado" });
                    return;
                }
                res.json(service);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id);
                const success = this.gymService.deleteService(id, userId);
                if (!success) {
                    res.status(404).json({ error: "Servicio no encontrado" });
                    return;
                }
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
    }
}
exports.ServiceController = ServiceController;
//# sourceMappingURL=ServiceController.js.map