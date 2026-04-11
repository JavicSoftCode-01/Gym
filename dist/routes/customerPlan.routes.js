"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerPlanRepository_1 = require("../repositories/implementations/CustomerPlanRepository");
const PlanRepository_1 = require("../repositories/implementations/PlanRepository");
const PaymentRepository_1 = require("../repositories/implementations/PaymentRepository");
const CustomerPlanService_1 = require("../services/CustomerPlanService");
const CustomerPlanController_1 = require("../controllers/CustomerPlanController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const customerPlanRepo = new CustomerPlanRepository_1.CustomerPlanRepository();
const planRepo = new PlanRepository_1.PlanRepository();
const paymentRepo = new PaymentRepository_1.PaymentRepository();
const customerPlanService = new CustomerPlanService_1.CustomerPlanService(customerPlanRepo, planRepo, paymentRepo);
const customerPlanController = new CustomerPlanController_1.CustomerPlanController(customerPlanService);
// 🌟 Solo admins autenticados pueden asignar planes a clientes
router.use(auth_middleware_1.requireAuth);
router.post("/", customerPlanController.create);
router.get("/", customerPlanController.getAll);
router.get("/:id", customerPlanController.getById);
router.put("/:id", customerPlanController.update);
router.delete("/:id", customerPlanController.delete);
exports.default = router;
//# sourceMappingURL=customerPlan.routes.js.map