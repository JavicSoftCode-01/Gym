import { ICustomerPlanRepository } from "../repositories/interfaces/ICustomerPlanRepository";
import { CustomerPlanStatus, PlanType } from "../domain/entities";
import { IPlanRepository } from "../repositories/interfaces/IPlanRepository";
import { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import { ICustomerRepository } from "../repositories/interfaces/ICustomerRepository";
import { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";
import { env } from "../config";
import fs from "fs";
import path from "path";

export class PaymentService {
    constructor(
        private paymentRepo: IPaymentRepository,
        private customerPlanRepo: ICustomerPlanRepository,
        private planRepo: IPlanRepository,
        private customerRepo: ICustomerRepository,
        private cashRegisterRepo: ICashRegisterRepository
    ) {}

    getAllPayments() {
        return this.paymentRepo.findAll();
    }

    processPayment(data: {
        customerPlanId: number;
        amount: number;
        paymentMethodId: number;
        receiptImagePath?: string;
    }, userId: number) {
        const activeRegister = this.cashRegisterRepo.getActiveRegister(userId);
        if (!activeRegister) {
            throw new Error("No tienes un turno de caja abierto. Por favor abre caja primero.");
        }

        const planAssignment = this.customerPlanRepo.findById(data.customerPlanId);
        if (!planAssignment) throw new Error("Plan no encontrado");

        const plan = this.planRepo.findById(planAssignment.planId);
        if (!plan) throw new Error("Plan base no encontrado");

        const hours = planAssignment.hours ?? 1;
        const fullAmount = plan.type === PlanType.DAILY ? plan.price * hours : plan.price;

        const existingPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = Math.max(0, fullAmount - totalPaidSoFar);

        if (data.amount <= 0) {
            throw new Error("El monto del pago debe ser mayor a cero.");
        }

        if (plan.type === PlanType.DAILY) {
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
                const uploadDir = env.UPLOAD_RECEIPTS_DIR;

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const base64Data = data.receiptImagePath.replace(/^data:image\/\w+;base64,/, "");
                fs.writeFileSync(path.join(uploadDir, fileName), base64Data, 'base64');

                // Guardar la ruta relativa en la DB
                data.receiptImagePath = `/uploads/receipts/${fileName}`;
            } catch (error: any) {
                console.error("Error al guardar la imagen del recibo:", error);
            }
        }

        // Registrar el pago con auditoría (SQLite no acepta objetos Date como bind param)
        const paymentData = {
            ...data,
            cashRegisterId: activeRegister.id,
            type: 'payment' as 'payment',
            paidAt: new Date().toISOString()
        };
        const payment = this.paymentRepo.create(paymentData, userId);

        // Recalcular estado del plan
        const allPayments = this.paymentRepo.getPaymentsByPlan(data.customerPlanId);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus = CustomerPlanStatus.PARTIAL;
        if (totalPaid >= fullAmount) {
            newStatus = CustomerPlanStatus.PAID;
        }

        this.customerPlanRepo.updateStatus(data.customerPlanId, newStatus);

        return { payment, newStatus };
    }

    getPaymentsByPlan(customerPlanId: number) {
        return this.paymentRepo.getPaymentsByPlan(customerPlanId);
    }
}