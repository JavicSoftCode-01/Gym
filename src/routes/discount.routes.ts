import { Router } from "express";
import { DiscountRepository } from "../repositories/implementations/DiscountRepository";
import { DiscountEngineService } from "../services/DiscountEngineService";
import { DiscountController } from "../controllers/DiscountController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const discountRepo = new DiscountRepository();
const discountService = new DiscountEngineService(discountRepo);
const discountController = new DiscountController(discountService);

router.use(requireAuth);

router.post("/evaluate", discountController.evaluateCart); // Cotizar carrito
router.get("/", discountController.getAll);
router.get("/:id", discountController.getById);
router.post("/", discountController.create);
router.put("/:id", discountController.update);
router.patch("/:id/toggle-active", discountController.toggleActive);
router.delete("/:id", discountController.delete);

export default router;
