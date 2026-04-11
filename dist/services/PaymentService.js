"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const entities_1 = require("../domain/entities");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PaymentService {
    constructor(paymentRepo, customerPlanRepo, planRepo, customerRepo) {
        this.paymentRepo = paymentRepo;
        this.customerPlanRepo = customerPlanRepo;
        this.planRepo = planRepo;
        this.customerRepo = customerRepo;
    }
    getAllPayments() {
        return this.paymentRepo.findAll();
    }
    processPayment(data, userId) {
        const planAssignment = this.customerPlanRepo.findById(data.customerPlanId);
        if (!planAssignment)
            throw new Error("Plan no encontrado");
        const plan = this.planRepo.findById(planAssignment.planId);
        if (!plan)
            throw new Error("Plan base no encontrado");
        const hours = planAssignment.hours ?? 1;
        const fullAmount = plan.type === entities_1.PlanType.DAILY ? plan.price * hours : plan.price;
        const existingPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = Math.max(0, fullAmount - totalPaidSoFar);
        if (data.amount <= 0) {
            throw new Error("El monto del pago debe ser mayor a cero.");
        }
        if (plan.type === entities_1.PlanType.DAILY) {
            if (data.amount !== remainingAmount) {
                throw new Error(`Los planes por hora se pagan completos. El monto exacto es $${remainingAmount.toFixed(2)}.`);
            }
        }
        if (data.amount > remainingAmount) {
            throw new Error(`El pago no puede exceder el saldo restante de $${remainingAmount.toFixed(2)}.`);
        }
        // Si hay una imagen en base64, guardarla físicamente
        if (data.receiptImagePath && data.receiptImagePath.startsWith('data:image')) {
            try {
                const customer = this.customerRepo.findById(planAssignment.customerId);
                const safeName = (customer?.fullName || 'Desconocido').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                // Extraer extensión del base64
                const extension = data.receiptImagePath.split(';')[0].split('/')[1] || 'png';
                const fileName = `recibo_${safeName}_${timestamp}.${extension}`;
                const uploadDir = path_1.default.join(__dirname, "../../public/uploads/receipts");
                if (!fs_1.default.existsSync(uploadDir)) {
                    fs_1.default.mkdirSync(uploadDir, { recursive: true });
                }
                const base64Data = data.receiptImagePath.replace(/^data:image\/\w+;base64,/, "");
                fs_1.default.writeFileSync(path_1.default.join(uploadDir, fileName), base64Data, 'base64');
                // Guardar la ruta relativa en la DB
                data.receiptImagePath = `/uploads/receipts/${fileName}`;
            }
            catch (error) {
                console.error("Error al guardar la imagen del recibo:", error);
                // No lanzamos error para no bloquear el pago si falla el guardado de imagen, 
                // o podrías elegir lanzarlo según preferencia del cliente.
            }
        }
        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const payment = this.paymentRepo.create({ ...data, type: 'payment', paidAt: new Date().toISOString() }, userId); // 🌟
        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = entities_1.CustomerPlanStatus.PARTIAL;
        if (totalPaid >= fullAmount) {
            newStatus = entities_1.CustomerPlanStatus.PAID;
        }
        this.customerPlanRepo.updateStatus(data.customerPlanId, newStatus);
        return { payment, newStatus };
    }
    getPaymentsByPlan(customerPlanId) {
        return this.paymentRepo.getPaymentsByPlan(customerPlanId);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map