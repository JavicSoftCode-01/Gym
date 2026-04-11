"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ScheduleRepository_1 = require("../repositories/implementations/ScheduleRepository");
const ScheduleService_1 = require("../services/ScheduleService");
const ScheduleController_1 = require("../controllers/ScheduleController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const repo = new ScheduleRepository_1.ScheduleRepository();
const service = new ScheduleService_1.ScheduleService(repo);
const controller = new ScheduleController_1.ScheduleController(service);
// 🌟 Solo admins autenticados pueden gestionar horarios
router.use(auth_middleware_1.requireAuth);
router.get("/", controller.getAll);
router.post("/", controller.create);
router.delete("/:id", controller.delete);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map