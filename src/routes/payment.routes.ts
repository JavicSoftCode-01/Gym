import { Router } from "express";
import { PaymentRepository } from "../repositories/implementations/PaymentRepository";
import { CustomerPlanRepository } from "../repositories/implementations/CustomerPlanRepository";
import { PlanRepository } from "../repositories/implementations/PlanRepository";
import { CustomerRepository } from "../repositories/implementations/CustomerRepository";
import { CashRegisterRepository } from "../repositories/implementations/CashRegisterRepository";
import { PaymentService } from "../services/PaymentService";
import { PaymentController } from "../controllers/PaymentController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const paymentRepo = new PaymentRepository();
const customerPlanRepo = new CustomerPlanRepository();
const planRepo = new PlanRepository();
const customerRepo = new CustomerRepository();
const cashRegisterRepo = new CashRegisterRepository();

const paymentService = new PaymentService(paymentRepo, customerPlanRepo, planRepo, customerRepo, cashRegisterRepo);
const paymentController = new PaymentController(paymentService);

// 🌟 Solo admins autenticados pueden registrar pagos
router.use(requireAuth);

router.get("/", paymentController.getAll);
router.post("/", paymentController.create);
router.get("/plan/:customerPlanId", paymentController.getByPlan);

export default router;