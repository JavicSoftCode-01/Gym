import {Router} from "express";
import {ServiceRepository} from "../repositories/implementations/ServiceRepository";
import {GymService} from "../services/GymService";
import {ServiceController} from "../controllers/ServiceController";
import {requireAuth} from "../middlewares/auth.middleware"; // 🌟

const router = Router();

const serviceRepo = new ServiceRepository();
const gymService = new GymService(serviceRepo);
const serviceController = new ServiceController(gymService);

// 🌟 Solo admins autenticados pueden gestionar servicios
router.use(requireAuth);

router.get("/", serviceController.getAll);
router.get("/:id", serviceController.getById);
router.post("/", serviceController.create);
router.put("/:id", serviceController.update);
router.delete("/:id", serviceController.delete);

export default router;