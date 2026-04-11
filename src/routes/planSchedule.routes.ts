import { Router } from "express";
import { PlanScheduleRepository } from "../repositories/implementations/PlanScheduleRepository";
import { PlanScheduleService } from "../services/PlanScheduleService";
import { PlanScheduleController } from "../controllers/PlanScheduleController";
import { requireAuth } from "../middlewares/auth.middleware"; // 🌟

const router = Router();
const repo = new PlanScheduleRepository();
const service = new PlanScheduleService(repo);
const controller = new PlanScheduleController(service);

// 🌟 Solo admins autenticados pueden asignar horarios a planes
router.use(requireAuth);

router.post("/", controller.assign);
router.get("/:planId", controller.getByPlan);

export default router;