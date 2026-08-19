import { createApp } from "./app";
import { initializeSchema } from "./database";
import { env } from "./config";

const bootstrap = () => {
    // 1. Inicializar esquema de Base de Datos
    initializeSchema();

    // 2. Crear instancia de aplicación Express
    const app = createApp();

    // 3. Levantar servidor HTTP
    app.listen(env.PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🏋️  Gym Management System corriendo en http://localhost:${env.PORT}`);
        console.log(`🌍  Ambiente: ${env.NODE_ENV}`);
        console.log(`======================================================`);
        console.log(`--- Endpoints de la API ---`);
        console.log(`🔐 Autenticación:     http://localhost:${env.PORT}/api/auth`);
        console.log(`👤 Clientes:          http://localhost:${env.PORT}/api/customers`);
        console.log(`🏷️  Servicios:         http://localhost:${env.PORT}/api/services`);
        console.log(`💰 Planes:            http://localhost:${env.PORT}/api/plans`);
        console.log(`💳 Métodos de Pago:  http://localhost:${env.PORT}/api/payment-methods`);
        console.log(`🎽 Inscripciones:     http://localhost:${env.PORT}/api/inscriptions`);
        console.log(`📅 Horarios:          http://localhost:${env.PORT}/api/schedules`);
        console.log(`🔗 Plan-Horarios:     http://localhost:${env.PORT}/api/plan-schedules`);
        console.log(`🧾 Suscripciones:     http://localhost:${env.PORT}/api/customer-plans`);
        console.log(`💵 Pagos:             http://localhost:${env.PORT}/api/payments`);
        console.log(`🏦 Caja:              http://localhost:${env.PORT}/api/cash-registers`);
        console.log(`======================================================\n`);
    });
};

bootstrap();
