"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InscriptionController = void 0;
class InscriptionController {
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
        this.update = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                this.service.update(id, req.body, userId);
                res.json({ success: true });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.delete = (req, res) => {
            try {
                const userId = req.user.id;
                const id = parseInt(req.params.id, 10);
                this.service.delete(id, userId);
                res.json({ success: true });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.InscriptionController = InscriptionController;
//# sourceMappingURL=InscriptionController.js.map