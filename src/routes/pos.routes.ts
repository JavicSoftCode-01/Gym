import { Router } from "express";
import { SaleRepository } from "../repositories/implementations/SaleRepository";
import { ProductRepository } from "../repositories/implementations/ProductRepository";
import { PlanRepository } from "../repositories/implementations/PlanRepository";
import { PaymentMethodRepository } from "../repositories/implementations/PaymentMethodRepository";
import { DiscountRepository } from "../repositories/implementations/DiscountRepository";
import { CashRegisterRepository } from "../repositories/implementations/CashRegisterRepository";
import { DiscountEngineService } from "../services/DiscountEngineService";
import { POSSaleService } from "../services/POSSaleService";
import { POSSaleController } from "../controllers/POSSaleController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const saleRepo = new SaleRepository();
const productRepo = new ProductRepository();
const planRepo = new PlanRepository();
const paymentMethodRepo = new PaymentMethodRepository();
const discountRepo = new DiscountRepository();
const cashRegisterRepo = new CashRegisterRepository();

const discountEngine = new DiscountEngineService(discountRepo);
const posSaleService = new POSSaleService(saleRepo, productRepo, planRepo, paymentMethodRepo, discountEngine, cashRegisterRepo);
const posSaleController = new POSSaleController(posSaleService);

router.use(requireAuth);

router.post("/quote", posSaleController.quoteCart); // Cotizar carrito en tiempo real
router.post("/checkout", posSaleController.processSale); // Cobrar y procesar venta
router.get("/sales", posSaleController.getAll);
router.get("/sales/:id", posSaleController.getById);
router.get("/sales/ticket/:saleNumber", posSaleController.getByNumber);
router.post("/sales/:id/cancel", posSaleController.cancelSale);

export default router;
