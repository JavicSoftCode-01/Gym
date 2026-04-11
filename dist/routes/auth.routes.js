"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SystemUserRepository_1 = require("../repositories/implementations/SystemUserRepository");
const AuthService_1 = require("../services/AuthService");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
const repo = new SystemUserRepository_1.SystemUserRepository();
const service = new AuthService_1.AuthService(repo);
const controller = new AuthController_1.AuthController(service);
router.post("/register", controller.register);
router.post("/login", controller.login);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map