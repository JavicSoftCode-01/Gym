import db from "./database";

export function initializeSchema(): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS customers
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name  TEXT NOT NULL,
            contact    TEXT NOT NULL,
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

        CREATE TABLE IF NOT EXISTS registration_types
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            price      REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS registrations
        (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id          INTEGER NOT NULL,
            registration_type_id INTEGER NOT NULL,
            created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (registration_type_id) REFERENCES registration_types (id)
        );

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

        CREATE TABLE IF NOT EXISTS customer_plans
        (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id     INTEGER NOT NULL,
            plan_id         INTEGER NOT NULL,
            registration_id INTEGER NOT NULL,
            start_date      TEXT    NOT NULL,
            end_date        TEXT    NOT NULL,
            status          TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'partial', 'paid', 'expired')),
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (plan_id) REFERENCES plans (id),
            FOREIGN KEY (registration_id) REFERENCES registrations (id)
        );

        CREATE TABLE IF NOT EXISTS payments
        (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_plan_id   INTEGER NOT NULL,
            method             TEXT    NOT NULL CHECK (method IN ('cash', 'deposit')),
            amount             REAL    NOT NULL CHECK (amount > 0),
            receipt_image_path TEXT,
            paid_at            TEXT    NOT NULL DEFAULT (datetime('now')),
            created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_plan_id) REFERENCES customer_plans (id)
        );
    `);

    console.log("✅ Base de datos inicializada correctamente");
}