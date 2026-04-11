"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const InscriptionRepository_1 = require("../repositories/implementations/InscriptionRepository");
const InscriptionService_1 = require("../services/InscriptionService");
const InscriptionController_1 = require("../controllers/InscriptionController");
const router = (0, express_1.Router)();
const repo = new InscriptionRepository_1.InscriptionRepository();
const service = new InscriptionService_1.InscriptionService(repo);
const controller = new InscriptionController_1.InscriptionController(service);
router.use(auth_middleware_1.requireAuth);
router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);
exports.default = router;
//# sourceMappingURL=inscription.routes.js.map