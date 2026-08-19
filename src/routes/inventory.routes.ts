import { Router } from "express";
import { StockMovementRepository } from "../repositories/implementations/StockMovementRepository";
import { ProductRepository } from "../repositories/implementations/ProductRepository";
import { SupplierRepository } from "../repositories/implementations/SupplierRepository";
import { StockMovementService } from "../services/StockMovementService";
import { StockMovementController } from "../controllers/StockMovementController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const stockMovementRepo = new StockMovementRepository();
const productRepo = new ProductRepository();
const supplierRepo = new SupplierRepository();

const service = new StockMovementService(stockMovementRepo, productRepo, supplierRepo);
const controller = new StockMovementController(service);

router.use(requireAuth);

router.get("/movements", controller.getAll);
router.get("/movements/product/:productId", controller.getByProduct);
router.post("/purchases", controller.registerPurchase); // Entrada de stock por compra a proveedor
router.post("/adjustments", controller.registerAdjustment); // Ajuste manual / merma

export default router;
