"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = initializeSchema;
// src/database/schema.ts
const database_1 = __importDefault(require("./database"));
function initializeSchema() {
    database_1.default.exec(`
        CREATE TABLE IF NOT EXISTS customers
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name  TEXT NOT NULL,
            contact    TEXT NOT NULL,
            inscription_type  TEXT,
            inscription_price REAL,
            inscription_id    INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS inscriptions
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            price      REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS services
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS schedules
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            date       TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time   TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_date_range ON schedules(date, start_time, end_time);

        CREATE TABLE IF NOT EXISTS plans
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER NOT NULL,
            type       TEXT    NOT NULL CHECK (type IN ('daily', 'monthly')),
            min_age    INTEGER NOT NULL,
            max_age    INTEGER NOT NULL,
            price      REAL    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (service_id) REFERENCES services (id)
        );

        CREATE TABLE IF NOT EXISTS plan_schedules
        (
            plan_id     INTEGER NOT NULL,
            schedule_id INTEGER NOT NULL,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (plan_id, schedule_id),
            FOREIGN KEY (plan_id) REFERENCES plans (id),
            FOREIGN KEY (schedule_id) REFERENCES schedules (id)
        );

        CREATE TABLE IF NOT EXISTS customer_plan_schedules
        (
            customer_plan_id INTEGER NOT NULL,
            schedule_id      INTEGER NOT NULL,
            created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (customer_plan_id, schedule_id),
            FOREIGN KEY (customer_plan_id) REFERENCES customer_plans (id),
            FOREIGN KEY (schedule_id) REFERENCES schedules (id)
        );

        CREATE TABLE IF NOT EXISTS customer_plans
        (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id     INTEGER NOT NULL,
            plan_id         INTEGER NOT NULL,
            start_date      TEXT    NOT NULL,
            end_date        TEXT    NOT NULL,
            hours           INTEGER NOT NULL DEFAULT 1,
            status          TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'partial', 'paid', 'expired')),
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (plan_id) REFERENCES plans (id)
        );

        CREATE TABLE IF NOT EXISTS payment_methods
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS payments
        (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_plan_id   INTEGER NOT NULL,
            payment_method_id  INTEGER NOT NULL,
            amount             REAL    NOT NULL CHECK (amount > 0),
            receipt_image_path TEXT,
            paid_at            TEXT    NOT NULL DEFAULT (datetime('now')),
            created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_plan_id) REFERENCES customer_plans (id),
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
        );

        CREATE TABLE IF NOT EXISTS system_users
        (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            contact       TEXT UNIQUE NOT NULL,
            password_hash TEXT        NOT NULL,
            role          TEXT        NOT NULL DEFAULT 'admin',
            created_at    TEXT        NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT        NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_logs
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            action     TEXT    NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
            table_name TEXT    NOT NULL,
            record_id  INTEGER NOT NULL,
            details    TEXT,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES system_users (id)
        );

        CREATE TABLE IF NOT EXISTS cash_registers
        (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id          INTEGER NOT NULL,
            date             TEXT    NOT NULL,
            expected_cash    REAL    NOT NULL,
            expected_deposit REAL    NOT NULL,
            actual_cash      REAL    NOT NULL,
            actual_deposit   REAL    NOT NULL,
            difference       REAL    NOT NULL,
            daily_total      REAL    NOT NULL,
            grand_total      REAL    NOT NULL,
            created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES system_users (id)
        );
    `);
    // --- Lightweight migration for existing gym.db (no formal migrations in this project) ---
    // Goal: remove matrícula tables/columns and expand plan.type to include 'enrollment'
    try {
        database_1.default.exec(`PRAGMA foreign_keys = OFF;`);
        // 0) customers: add inscription fields if missing
        const custCols = database_1.default.prepare(`PRAGMA table_info(customers)`).all();
        if (!custCols.some(c => c.name === "inscription_type")) {
            database_1.default.exec(`ALTER TABLE customers ADD COLUMN inscription_type TEXT;`);
        }
        if (!custCols.some(c => c.name === "inscription_price")) {
            database_1.default.exec(`ALTER TABLE customers ADD COLUMN inscription_price REAL;`);
        }
        if (!custCols.some(c => c.name === "inscription_id")) {
            database_1.default.exec(`ALTER TABLE customers ADD COLUMN inscription_id INTEGER;`);
        }
        // inscriptions: unique names (case-insensitive)
        database_1.default.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_inscriptions_name_nocase
            ON inscriptions (name COLLATE NOCASE);
        `);
        // 1) customer_plans: drop registration_id if it exists
        const cpCols = database_1.default.prepare(`PRAGMA table_info(customer_plans)`).all();
        const hasRegistrationId = cpCols.some(c => c.name === "registration_id");
        const hasHoursColumn = cpCols.some(c => c.name === "hours");
        if (hasRegistrationId) {
            database_1.default.exec(`
                CREATE TABLE IF NOT EXISTS customer_plans_new
                (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    plan_id     INTEGER NOT NULL,
                    start_date  TEXT    NOT NULL,
                    end_date    TEXT    NOT NULL,
                    hours       INTEGER NOT NULL DEFAULT 1,
                    status      TEXT    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'partial', 'paid', 'expired')),
                    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (customer_id) REFERENCES customers (id),
                    FOREIGN KEY (plan_id) REFERENCES plans (id)
                );
            `);
            database_1.default.exec(`
                INSERT INTO customer_plans_new (id, customer_id, plan_id, start_date, end_date, hours, status, created_at, updated_at)
                SELECT id, customer_id, plan_id, start_date, end_date, COALESCE(hours, 1), status, created_at, updated_at
                FROM customer_plans;
            `);
            database_1.default.exec(`DROP TABLE customer_plans;`);
            database_1.default.exec(`ALTER TABLE customer_plans_new RENAME TO customer_plans;`);
        }
        if (!hasHoursColumn) {
            database_1.default.exec(`ALTER TABLE customer_plans ADD COLUMN hours INTEGER NOT NULL DEFAULT 1;`);
        }
        // 2) plans: allow type 'enrollment' and nullable service_id
        const plansCols = database_1.default.prepare(`PRAGMA table_info(plans)`).all();
        const serviceIdCol = plansCols.find(c => c.name === "service_id");
        const needsPlanRecreate = Boolean(serviceIdCol && serviceIdCol.notnull === 0); // we want NOT NULL again
        if (needsPlanRecreate) {
            database_1.default.exec(`
                CREATE TABLE IF NOT EXISTS plans_new
                (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    service_id INTEGER NOT NULL,
                    type       TEXT    NOT NULL CHECK (type IN ('daily', 'monthly')),
                    min_age    INTEGER NOT NULL,
                    max_age    INTEGER NOT NULL,
                    price      REAL    NOT NULL,
                    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (service_id) REFERENCES services (id)
                );
            `);
            database_1.default.exec(`
                INSERT INTO plans_new (id, service_id, type, min_age, max_age, price, created_at, updated_at)
                SELECT id, service_id, type, min_age, max_age, price, created_at, updated_at
                FROM plans;
            `);
            database_1.default.exec(`DROP TABLE plans;`);
            database_1.default.exec(`ALTER TABLE plans_new RENAME TO plans;`);
        }
        // 3) drop matrícula tables if they exist
        database_1.default.exec(`DROP TABLE IF EXISTS registrations;`);
        database_1.default.exec(`DROP TABLE IF EXISTS registration_types;`);
        // 4) payment_methods: prevent duplicates (case-insensitive)
        // If duplicates already exist, keep the oldest (MIN id) per lower(name)
        database_1.default.exec(`
            DELETE FROM payment_methods
            WHERE id NOT IN (
                SELECT MIN(id) FROM payment_methods GROUP BY lower(name)
            );
        `);
        database_1.default.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_name_nocase
            ON payment_methods (name COLLATE NOCASE);
        `);
        database_1.default.exec(`PRAGMA foreign_keys = ON;`);
    }
    catch (e) {
        // If migration fails, we keep the app running with the existing DB.
        database_1.default.exec(`PRAGMA foreign_keys = ON;`);
        console.warn("⚠️ Migración ligera omitida:", e);
    }
    console.log("✅ Base de datos inicializada correctamente");
}
//# sourceMappingURL=schema.js.map