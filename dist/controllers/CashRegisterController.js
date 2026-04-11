"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegisterController = void 0;
class CashRegisterController {
    constructor(service) {
        this.service = service;
        // GET /api/cash-registers/expected?date=2024-10-25
        this.getExpected = (req, res) => {
            try {
                const date = req.query.date ||
                    new Date().toISOString().split("T")[0];
                res.json(this.service.getTodayExpected(date));
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        // POST /api/cash-registers/close
        // Body: { date, actualCash, actualDeposit }
        this.closeBox = (req, res) => {
            try {
                const userId = req.user.id;
                const { date, actualCash, actualDeposit } = req.body;
                if (!date || actualCash === undefined || actualDeposit === undefined) {
                    res.status(400).json({
                        error: "Se requiere date, actualCash y actualDeposit."
                    });
                    return;
                }
                const result = this.service.closeRegister(userId, date, Number(actualCash), Number(actualDeposit));
                res.status(201).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        // GET /api/cash-registers/history
        this.getHistory = (_req, res) => {
            try {
                res.json(this.service.getHistory());
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
    }
}
exports.CashRegisterController = CashRegisterController;
//# sourceMappingURL=CashRegisterController.js.map