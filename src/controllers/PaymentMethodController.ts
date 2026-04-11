import { Request, Response } from "express";
import { PaymentMethodService } from "../services/PaymentMethodService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PaymentMethodController {
    constructor(private readonly service: PaymentMethodService) {}

    getAll = (req: Request, res: Response) => {
        try { res.json(this.service.getAll()); }
        catch (error: any) { res.status(500).json({ error: error.message }); }
    };

    create = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            res.status(201).json(this.service.create(req.body, userId)); }
        catch (error: any) { res.status(400).json({ error: error.message }); }
    };

    update = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            this.service.update(id, req.body, userId);
            res.json({ success: true }); }
        catch (error: any) { res.status(400).json({ error: error.message }); }
    };

    delete = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            this.service.delete(id, userId);
            res.json({ success: true }); }
        catch (error: any) { res.status(400).json({ error: error.message }); }
    };
}
