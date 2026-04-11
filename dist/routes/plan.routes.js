"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlanRepository_1 = require("../repositories/implementations/PlanRepository");
const PlanService_1 = require("../services/PlanService");
const PlanController_1 = require("../controllers/PlanController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const planRepo = new PlanRepository_1.PlanRepository();
const planService = new PlanService_1.PlanService(planRepo);
const planController = new PlanController_1.PlanController(planService);
// 🌟 Solo admins autenticados pueden crear/modificar planes
router.use(auth_middleware_1.requireAuth);
router.get("/", planController.getAll);
router.post("/", planController.create);
router.put("/:id", planController.update);
router.delete("/:id", planController.delete);
exports.default = router;
//# sourceMappingURL=plan.routes.js.map