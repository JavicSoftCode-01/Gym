import { Router } from "express";
import { CashRegisterController } from "../controllers/CashRegisterController";
import { CashRegisterService } from "../services/CashRegisterService";
import { CashRegisterRepository } from "../repositories/implementations/CashRegisterRepository";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const cashRegisterRepo = new CashRegisterRepository();
const cashRegisterService = new CashRegisterService(cashRegisterRepo);
const cashRegisterController = new CashRegisterController(cashRegisterService);

router.use(authMiddleware);

// Cajero y Admin
router.post("/open", cashRegisterController.openBox);
router.get("/status", cashRegisterController.getExpected);
router.post("/close", cashRegisterController.closeBox);

// Solo admin
router.get("/history", requireRole("admin"), cashRegisterController.getHistory);

export default router;
