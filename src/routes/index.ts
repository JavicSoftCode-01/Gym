import { Router } from "express";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import serviceRoutes from "./service.routes";
import planRoutes from "./plan.routes";
import customerPlanRoutes from "./customerPlan.routes";
import paymentRoutes from "./payment.routes";
import paymentMethodRoutes from "./paymentMethod.routes";
import inscriptionRoutes from "./inscription.routes";
import scheduleRoutes from "./schedule.routes";
import planScheduleRoutes from "./planSchedule.routes";
import cashRegisterRoutes from "./cashRegister.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import discountRoutes from "./discount.routes";
import posRoutes from "./pos.routes";
import inventoryRoutes from "./inventory.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/services", serviceRoutes);
apiRouter.use("/plans", planRoutes);
apiRouter.use("/customer-plans", customerPlanRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/payment-methods", paymentMethodRoutes);
apiRouter.use("/inscriptions", inscriptionRoutes);
apiRouter.use("/schedules", scheduleRoutes);
apiRouter.use("/plan-schedules", planScheduleRoutes);
apiRouter.use("/cash-registers", cashRegisterRoutes);

// 🛒 Nuevas rutas POS, Retail, Inventario y Descuentos
apiRouter.use("/suppliers", supplierRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/discounts", discountRoutes);
apiRouter.use("/pos", posRoutes);
apiRouter.use("/inventory", inventoryRoutes);

export default apiRouter;
export {
    authRoutes,
    customerRoutes,
    serviceRoutes,
    planRoutes,
    customerPlanRoutes,
    paymentRoutes,
    paymentMethodRoutes,
    inscriptionRoutes,
    scheduleRoutes,
    planScheduleRoutes,
    cashRegisterRoutes,
    supplierRoutes,
    productRoutes,
    discountRoutes,
    posRoutes,
    inventoryRoutes
};
