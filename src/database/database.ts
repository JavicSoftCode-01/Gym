// src/database/database.ts
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(__dirname, "../../gym.db");

const db = new Database(DB_PATH);

// Mejora de rendimiento: escrituras en memoria, flush automático al disco
db.pragma("journal_mode = WAL");

// Integridad referencial (SQLite la tiene desactivada por defecto)
db.pragma("foreign_keys = ON");

export default db;