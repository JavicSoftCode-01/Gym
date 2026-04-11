import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CashRegisterService } from "../services/CashRegisterService";

export class CashRegisterController {
    constructor(private readonly service: CashRegisterService) {}

    // GET /api/cash-registers/expected?date=2024-10-25
    getExpected = (req: AuthRequest, res: Response): void => {
        try {
            const date =
                (req.query.date as string) ||
                new Date().toISOString().split("T")[0];
            res.json(this.service.getTodayExpected(date));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // POST /api/cash-registers/close
    // Body: { date, actualCash, actualDeposit }
    closeBox = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const { date, actualCash, actualDeposit } = req.body;

            if (!date || actualCash === undefined || actualDeposit === undefined) {
                res.status(400).json({
                    error: "Se requiere date, actualCash y actualDeposit."
                });
                return;
            }

            const result = this.service.closeRegister(
                userId,
                date,
                Number(actualCash),
                Number(actualDeposit)
            );
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // GET /api/cash-registers/history
    getHistory = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getHistory());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
