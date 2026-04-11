import { Router } from "express";
import { PlanRepository } from "../repositories/implementations/PlanRepository";
import { PlanService } from "../services/PlanService";
import { PlanController } from "../controllers/PlanController";
import { requireAuth } from "../middlewares/auth.middleware"; // 🌟

const router = Router();
const planRepo = new PlanRepository();
const planService = new PlanService(planRepo);
const planController = new PlanController(planService);

// 🌟 Solo admins autenticados pueden crear/modificar planes
router.use(requireAuth);

router.get("/", planController.getAll);
router.post("/", planController.create);
router.put("/:id", planController.update);
router.delete("/:id", planController.delete);

export default router;