"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerRepository_1 = require("../repositories/implementations/CustomerRepository");
const CustomerService_1 = require("../services/CustomerService");
const CustomerController_1 = require("../controllers/CustomerController");
const auth_middleware_1 = require("../middlewares/auth.middleware"); // 🌟 Auth
const router = (0, express_1.Router)();
// Inyección manual de dependencias
const customerRepo = new CustomerRepository_1.CustomerRepository();
const customerService = new CustomerService_1.CustomerService(customerRepo);
const customerController = new CustomerController_1.CustomerController(customerService);
// 🌟 Proteger con token: todas las rutas requieren sesión activa
router.use(auth_middleware_1.requireAuth);
router.get("/", customerController.getAll);
router.get("/:id", customerController.getById);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map