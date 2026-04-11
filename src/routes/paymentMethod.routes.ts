import { Router } from "express";
import { PaymentMethodRepository } from "../repositories/implementations/PaymentMethodRepository";
import { PaymentMethodService } from "../services/PaymentMethodService";
import { PaymentMethodController } from "../controllers/PaymentMethodController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const repo = new PaymentMethodRepository();
const service = new PaymentMethodService(repo);
const controller = new PaymentMethodController(service);

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
