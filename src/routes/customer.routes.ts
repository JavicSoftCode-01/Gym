import {Router} from "express";
import {CustomerRepository} from "../repositories/implementations/CustomerRepository";
import {CustomerService} from "../services/CustomerService";
import {CustomerController} from "../controllers/CustomerController";
import {requireAuth} from "../middlewares/auth.middleware"; // 🌟 Auth

const router = Router();

// Inyección manual de dependencias
const customerRepo = new CustomerRepository();
const customerService = new CustomerService(customerRepo);
const customerController = new CustomerController(customerService);

// 🌟 Proteger con token: todas las rutas requieren sesión activa
router.use(requireAuth);

router.get("/", customerController.getAll);
router.get("/:id", customerController.getById);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);

export default router;