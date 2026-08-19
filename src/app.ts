import express, { Application } from "express";
import path from "path";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { env } from "./config";

export const createApp = (): Application => {
    const app = express();

    // Middlewares globales de parseo
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // Archivos estáticos del frontend
    app.use(express.static(env.PUBLIC_DIR));

    // Router modular centralizado de la API
    app.use("/api", apiRouter);

    // Manejo de errores globales y rutas no encontradas
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};
