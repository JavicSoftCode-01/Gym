import { Router } from "express";
import { ScheduleRepository } from "../repositories/implementations/ScheduleRepository";
import { ScheduleService } from "../services/ScheduleService";
import { ScheduleController } from "../controllers/ScheduleController";
import { requireAuth } from "../middlewares/auth.middleware"; // 🌟

const router = Router();
const repo = new ScheduleRepository();
const service = new ScheduleService(repo);
const controller = new ScheduleController(service);

// 🌟 Solo admins autenticados pueden gestionar horarios
router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.delete("/:id", controller.delete);

export default router;