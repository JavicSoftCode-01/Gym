"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.getAll = (req, res) => {
            try {
                const result = this.paymentService.getAllPayments();
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
        this.create = (req, res) => {
            try {
                const userId = req.user.id;
                const result = this.paymentService.processPayment(req.body, userId);
                res.status(201).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getByPlan = (req, res) => {
            try {
                const customerPlanId = parseInt(req.params.customerPlanId);
                const result = this.paymentService.getPaymentsByPlan(customerPlanId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        };
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=PaymentController.js.map