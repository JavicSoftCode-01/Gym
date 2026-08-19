import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { SupplierService } from "../services/SupplierService";

export class SupplierController {
    constructor(private readonly service: SupplierService) {}

    getAll = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getAll());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = (req: AuthRequest, res: Response): void => {
        try {
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.getById(id));
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    create = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const supplier = this.service.create(req.body, userId);
            res.status(201).json(supplier);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    update = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            const supplier = this.service.update(id, req.body, userId);
            res.json(supplier);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    delete = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.delete(id, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
