"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlanScheduleRepository_1 = require("../repositories/implementations/PlanScheduleRepository");
const PlanScheduleService_1 = require("../services/PlanScheduleService");
const PlanScheduleController_1 = require("../controllers/PlanScheduleController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const repo = new PlanScheduleRepository_1.PlanScheduleRepository();
const service = new PlanScheduleService_1.PlanScheduleService(repo);
const controller = new PlanScheduleController_1.PlanScheduleController(service);
// 🌟 Solo admins autenticados pueden asignar horarios a planes
router.use(auth_middleware_1.requireAuth);
router.get("/", controller.getAll);
router.post("/", controller.assign);
router.get("/:planId", controller.getByPlan);
exports.default = router;
//# sourceMappingURL=planSchedule.routes.js.map