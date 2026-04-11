import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { InscriptionRepository } from "../repositories/implementations/InscriptionRepository";
import { InscriptionService } from "../services/InscriptionService";
import { InscriptionController } from "../controllers/InscriptionController";

const router = Router();

const repo = new InscriptionRepository();
const service = new InscriptionService(repo);
const controller = new InscriptionController(service);

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;

