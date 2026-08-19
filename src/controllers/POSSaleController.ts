import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { POSSaleService } from "../services/POSSaleService";

export class POSSaleController {
    constructor(private readonly service: POSSaleService) {}

    getAll = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getAllSales());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = (req: AuthRequest, res: Response): void => {
        try {
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.getSaleById(id));
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    getByNumber = (req: AuthRequest, res: Response): void => {
        try {
            const saleNumber = req.params.saleNumber as string;
            res.json(this.service.getSaleByNumber(saleNumber));
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    quoteCart = (req: AuthRequest, res: Response): void => {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items)) {
                res.status(400).json({ error: "Se requiere un arreglo 'items' para cotizar el carrito." });
                return;
            }
            res.json(this.service.quoteCart(items));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    processSale = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const sale = this.service.processSale(req.body, userId);
            res.status(201).json(sale);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    cancelSale = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            const { reason } = req.body;
            res.json(this.service.cancelSale(id, userId, reason));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
