"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const CashRegisterService_1 = require("../services/CashRegisterService");
const CashRegisterController_1 = require("../controllers/CashRegisterController");
const router = (0, express_1.Router)();
const service = new CashRegisterService_1.CashRegisterService();
const controller = new CashRegisterController_1.CashRegisterController(service);
// 🌟 Solo administradores autenticados pueden consultar o cerrar caja
router.use(auth_middleware_1.requireAuth);
router.get("/expected", controller.getExpected); // Ver totales del día
router.get("/history", controller.getHistory); // Historial de cierres
router.post("/close", controller.closeBox); // Cerrar caja
exports.default = router;
//# sourceMappingURL=cashRegister.routes.js.map