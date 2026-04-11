import { Router } from "express";
import { SystemUserRepository } from "../repositories/implementations/SystemUserRepository";
import { AuthService } from "../services/AuthService";
import { AuthController } from "../controllers/AuthController";

const router = Router();
const repo = new SystemUserRepository();
const service = new AuthService(repo);
const controller = new AuthController(service);

router.post("/register", controller.register);
router.post("/login", controller.login);

export default router;