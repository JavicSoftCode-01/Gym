import { Router } from "express";
import { SupplierRepository } from "../repositories/implementations/SupplierRepository";
import { SupplierService } from "../services/SupplierService";
import { SupplierController } from "../controllers/SupplierController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const supplierRepo = new SupplierRepository();
const supplierService = new SupplierService(supplierRepo);
const supplierController = new SupplierController(supplierService);

router.use(requireAuth);

router.get("/", supplierController.getAll);
router.get("/:id", supplierController.getById);
router.post("/", supplierController.create);
router.put("/:id", supplierController.update);
router.delete("/:id", supplierController.delete);

export default router;
