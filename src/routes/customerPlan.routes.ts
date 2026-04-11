import { Router } from "express";
import { CustomerPlanRepository } from "../repositories/implementations/CustomerPlanRepository";
import { PlanRepository } from "../repositories/implementations/PlanRepository";
import { CustomerPlanService } from "../services/CustomerPlanService";
import { CustomerPlanController } from "../controllers/CustomerPlanController";
import { requireAuth } from "../middlewares/auth.middleware"; // 🌟

const router = Router();
const customerPlanRepo = new CustomerPlanRepository();
const planRepo = new PlanRepository();
const customerPlanService = new CustomerPlanService(customerPlanRepo, planRepo);
const customerPlanController = new CustomerPlanController(customerPlanService);

// 🌟 Solo admins autenticados pueden asignar planes a clientes
router.use(requireAuth);

router.post("/", customerPlanController.create);
router.get("/", customerPlanController.getAll);
router.get("/:id", customerPlanController.getById);
router.put("/:id", customerPlanController.update);
router.delete("/:id", customerPlanController.delete);

export default router;