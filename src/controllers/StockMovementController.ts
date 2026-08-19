import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { StockMovementService } from "../services/StockMovementService";

export class StockMovementController {
    constructor(private readonly service: StockMovementService) {}

    getAll = (req: AuthRequest, res: Response): void => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
            res.json(this.service.getAllMovements(limit));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getByProduct = (req: AuthRequest, res: Response): void => {
        try {
            const productId = parseInt(req.params.productId as string, 10);
            res.json(this.service.getMovementsByProduct(productId));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    registerPurchase = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const movement = this.service.registerSupplierPurchase(req.body, userId);
            res.status(201).json(movement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    registerAdjustment = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const movement = this.service.registerStockAdjustment(req.body, userId);
            res.status(201).json(movement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
