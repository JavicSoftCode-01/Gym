"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServiceRepository_1 = require("../repositories/implementations/ServiceRepository");
const GymService_1 = require("../services/GymService");
const ServiceController_1 = require("../controllers/ServiceController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟
const router = (0, express_1.Router)();
const serviceRepo = new ServiceRepository_1.ServiceRepository();
const gymService = new GymService_1.GymService(serviceRepo);
const serviceController = new ServiceController_1.ServiceController(gymService);
// 🌟 Solo admins autenticados pueden gestionar servicios
router.use(auth_middleware_1.requireAuth);
router.get("/", serviceController.getAll);
router.get("/:id", serviceController.getById);
router.post("/", serviceController.create);
router.put("/:id", serviceController.update);
router.delete("/:id", serviceController.delete);
exports.default = router;
//# sourceMappingURL=service.routes.js.map