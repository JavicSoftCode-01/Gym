"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentMethodRepository_1 = require("../repositories/implementations/PaymentMethodRepository");
const PaymentMethodService_1 = require("../services/PaymentMethodService");
const PaymentMethodController_1 = require("../controllers/PaymentMethodController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const repo = new PaymentMethodRepository_1.PaymentMethodRepository();
const service = new PaymentMethodService_1.PaymentMethodService(repo);
const controller = new PaymentMethodController_1.PaymentMethodController(service);
router.use(auth_middleware_1.requireAuth);
router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);
exports.default = router;
//# sourceMappingURL=paymentMethod.routes.js.map