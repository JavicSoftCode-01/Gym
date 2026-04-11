import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { CashRegisterService } from "../services/CashRegisterService";
import { CashRegisterController } from "../controllers/CashRegisterController";

const router = Router();

const service = new CashRegisterService();
const controller = new CashRegisterController(service);

// 🌟 Solo administradores autenticados pueden consultar o cerrar caja
router.use(requireAuth);

router.get("/expected", controller.getExpected);   // Ver totales del día
router.get("/history", controller.getHistory);     // Historial de cierres
router.post("/close", controller.closeBox);        // Cerrar caja

export default router;
