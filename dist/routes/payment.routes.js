"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentRepository_1 = require("../repositories/implementations/PaymentRepository");
const CustomerPlanRepository_1 = require("../repositories/implementations/CustomerPlanRepository");
const PlanRepository_1 = require("../repositories/implementations/PlanRepository");
const CustomerRepository_1 = require("../repositories/implementations/CustomerRepository");
const PaymentService_1 = require("../services/PaymentService");
const PaymentController_1 = require("../controllers/PaymentController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const paymentRepo = new PaymentRepository_1.PaymentRepository();
const customerPlanRepo = new CustomerPlanRepository_1.CustomerPlanRepository();
const planRepo = new PlanRepository_1.PlanRepository();
const customerRepo = new CustomerRepository_1.CustomerRepository();
const paymentService = new PaymentService_1.PaymentService(paymentRepo, customerPlanRepo, planRepo, customerRepo);
const paymentController = new PaymentController_1.PaymentController(paymentService);
// 🌟 Solo admins autenticados pueden registrar pagos
router.use(auth_middleware_1.requireAuth);
router.get("/", paymentController.getAll);
router.post("/", paymentController.create);
router.get("/plan/:customerPlanId", paymentController.getByPlan);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map