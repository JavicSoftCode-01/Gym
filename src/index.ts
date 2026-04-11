import express from "express";
import path from "path";
import { initializeSchema } from "./database";

import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import serviceRoutes from "./routes/service.routes";
import planRoutes from "./routes/plan.routes";
import customerPlanRoutes from "./routes/customerPlan.routes";
import paymentRoutes from "./routes/payment.routes";
import paymentMethodRoutes from "./routes/paymentMethod.routes";
import scheduleRoutes from "./routes/schedule.routes";
import planScheduleRoutes from "./routes/planSchedule.routes";
import cashRegisterRoutes from "./routes/cashRegister.routes"; // 🌟 Caja
import inscriptionRoutes from "./routes/inscription.routes";

const app = express();
const PORT = 800;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

initializeSchema();

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/customer-plans", customerPlanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/inscriptions", inscriptionRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/plan-schedules", planScheduleRoutes);
app.use("/api/cash-registers", cashRegisterRoutes); // 🌟 Caja

app.listen(PORT, () => {
    console.log(`🏋️ Gym server corriendo en http://localhost:${PORT}`);
    console.log(`--- Endpoints disponibles ---`);
    console.log(`👤 Clientes:          http://localhost:${PORT}/api/customers`);
    console.log(`🏷️ Servicios:         http://localhost:${PORT}/api/services`);
    console.log(`💰 Planes:            http://localhost:${PORT}/api/plans`);
    console.log(`💳 Métodos de Pago:  http://localhost:${PORT}/api/payment-methods`);
    console.log(`🎽 Inscripciones:     http://localhost:${PORT}/api/inscriptions`);
    console.log(`📅 Horarios:          http://localhost:${PORT}/api/schedules`);
    console.log(`🔗 Plan-Horarios:     http://localhost:${PORT}/api/plan-schedules`);
    console.log(`🧾 Suscripciones:     http://localhost:${PORT}/api/customer-plans`);
    console.log(`💵 Pagos:             http://localhost:${PORT}/api/payments`);
    console.log(`🏦 Caja:              http://localhost:${PORT}/api/cash-registers`);
});
