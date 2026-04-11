"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const plan_routes_1 = __importDefault(require("./routes/plan.routes"));
const customerPlan_routes_1 = __importDefault(require("./routes/customerPlan.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const paymentMethod_routes_1 = __importDefault(require("./routes/paymentMethod.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const planSchedule_routes_1 = __importDefault(require("./routes/planSchedule.routes"));
const cashRegister_routes_1 = __importDefault(require("./routes/cashRegister.routes")); // 🌟 Caja
const inscription_routes_1 = __importDefault(require("./routes/inscription.routes"));
const app = (0, express_1.default)();
const PORT = 5200;
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
(0, database_1.initializeSchema)();
app.use("/api/auth", auth_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/services", service_routes_1.default);
app.use("/api/plans", plan_routes_1.default);
app.use("/api/customer-plans", customerPlan_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/payment-methods", paymentMethod_routes_1.default);
app.use("/api/inscriptions", inscription_routes_1.default);
app.use("/api/schedules", schedule_routes_1.default);
app.use("/api/plan-schedules", planSchedule_routes_1.default);
app.use("/api/cash-registers", cashRegister_routes_1.default); // 🌟 Caja
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
//# sourceMappingURL=index.js.map