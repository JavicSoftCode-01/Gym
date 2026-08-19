import { Router } from "express";
import { ProductRepository } from "../repositories/implementations/ProductRepository";
import { ProductService } from "../services/ProductService";
import { ProductController } from "../controllers/ProductController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
const productRepo = new ProductRepository();
const productService = new ProductService(productRepo);
const productController = new ProductController(productService);

router.use(requireAuth);

// Categorías
router.get("/categories", productController.getAllCategories);
router.post("/categories", productController.createCategory);
router.put("/categories/:id", productController.updateCategory);
router.delete("/categories/:id", productController.deleteCategory);

// Alertas de stock bajo
router.get("/alerts/low-stock", productController.getLowStock);

// Productos
router.get("/", productController.getAll);
router.get("/barcode/:barcode", productController.getByBarcode);
router.get("/:id", productController.getById);
router.post("/", productController.create);
router.put("/:id", productController.update);
router.delete("/:id", productController.delete);

export default router;
