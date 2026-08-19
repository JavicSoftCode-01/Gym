import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DiscountEngineService } from "../services/DiscountEngineService";

export class DiscountController {
    constructor(private readonly service: DiscountEngineService) {}

    getAll = (req: AuthRequest, res: Response): void => {
        try {
            const includeInactive = req.query.includeInactive === "true";
            res.json(this.service.getAll(includeInactive));
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

    evaluateCart = (req: AuthRequest, res: Response): void => {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items)) {
                res.status(400).json({ error: "Se requiere un arreglo 'items' para cotizar el carrito." });
                return;
            }
            res.json(this.service.evaluateCart(items));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    create = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            res.status(201).json(this.service.create(req.body, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    update = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.update(id, req.body, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    toggleActive = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            const { isActive } = req.body;
            res.json(this.service.toggleActive(id, Boolean(isActive), userId));
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
