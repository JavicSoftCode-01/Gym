import path from "path";

export const env = {
    PORT: Number(process.env.PORT) || 800,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET || "CLAVE_SECRETA_SUPER_SEGURA_GYM_2024",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
    DB_PATH: process.env.DB_PATH || path.resolve(__dirname, "../../gym.db"),
    PUBLIC_DIR: path.resolve(__dirname, "../../public"),
    UPLOAD_RECEIPTS_DIR: path.resolve(__dirname, "../../public/uploads/receipts"),
};
