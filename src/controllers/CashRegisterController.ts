import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CashRegisterService } from "../services/CashRegisterService";

export class CashRegisterController {
    constructor(private readonly service: CashRegisterService) {}

    // POST /api/cash/open
    // Body: { openingBalance }
    openBox = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const { openingBalance } = req.body;

            if (openingBalance === undefined || isNaN(Number(openingBalance))) {
                res.status(400).json({ error: "Se requiere un openingBalance válido." });
                return;
            }

            const result = this.service.openRegister(userId, Number(openingBalance));
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // GET /api/cash/status
    getExpected = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            res.json(this.service.getTodayExpected(userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // POST /api/cash/close
    // Body: { actualCash, actualDeposit }
    closeBox = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const { actualCash, actualDeposit } = req.body;

            if (actualCash === undefined || actualDeposit === undefined) {
                res.status(400).json({
                    error: "Se requiere actualCash y actualDeposit."
                });
                return;
            }

            const result = this.service.closeRegister(
                userId,
                Number(actualCash),
                Number(actualDeposit)
            );
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // GET /api/cash/history
    getHistory = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getHistory());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
