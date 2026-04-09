"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.resolve(__dirname, "../../gym.db");
const db = new better_sqlite3_1.default(DB_PATH);
// Mejora de rendimiento: escrituras en memoria, flush automático al disco
db.pragma("journal_mode = WAL");
// Integridad referencial (SQLite la tiene desactivada por defecto)
db.pragma("foreign_keys = ON");
exports.default = db;
//# sourceMappingURL=database.js.map