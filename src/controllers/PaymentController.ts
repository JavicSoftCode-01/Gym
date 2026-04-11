import { Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PaymentController {
    constructor(private paymentService: PaymentService) {}

    getAll = (req: AuthRequest, res: Response) => {
        try {
            const result = this.paymentService.getAllPayments();
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    create = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const result = this.paymentService.processPayment(req.body, userId);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    getByPlan = (req: AuthRequest, res: Response) => {
        try {
            const customerPlanId = parseInt(<string>req.params.customerPlanId);
            const result = this.paymentService.getPaymentsByPlan(customerPlanId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}