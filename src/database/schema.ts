// src/database/schema.ts
import db from "./database";

export function initializeSchema(): void {
    db.exec(`
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
            cash_register_id   INTEGER,
            amount             REAL    NOT NULL,
            type               TEXT    NOT NULL DEFAULT 'payment' CHECK (type IN ('payment', 'adjustment')),
            receipt_image_path TEXT,
            paid_at            TEXT    NOT NULL DEFAULT (datetime('now')),
            created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at         TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_plan_id) REFERENCES customer_plans (id),
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id),
            FOREIGN KEY (cash_register_id) REFERENCES cash_registers (id)
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
            status           TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
            opening_balance  REAL    NOT NULL DEFAULT 0.00,
            expected_cash    REAL    NOT NULL DEFAULT 0.00,
            expected_deposit REAL    NOT NULL DEFAULT 0.00,
            actual_cash      REAL    NOT NULL DEFAULT 0.00,
            actual_deposit   REAL    NOT NULL DEFAULT 0.00,
            difference       REAL    NOT NULL DEFAULT 0.00,
            daily_total      REAL    NOT NULL DEFAULT 0.00,
            grand_total      REAL    NOT NULL DEFAULT 0.00,
            opened_at        TEXT    NOT NULL DEFAULT (datetime('now')),
            closed_at        TEXT,
            created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES system_users (id)
        );
        CREATE INDEX IF NOT EXISTS idx_cash_registers_user ON cash_registers(user_id);
        CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);

        -- =========================================================================
        -- 🛒 MÓDULO POS: PROVEEDORES, PRODUCTOS, DESCUENTOS, VENTAS E INVENTARIO
        -- =========================================================================

        -- 1. Proveedores
        CREATE TABLE IF NOT EXISTS suppliers
        (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT NOT NULL,
            identification TEXT,
            contact_name   TEXT,
            phone          TEXT,
            email          TEXT,
            address        TEXT,
            notes          TEXT,
            created_at     TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

        -- 2. Categorías de productos
        CREATE TABLE IF NOT EXISTS product_categories
        (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- 3. Catálogo de productos e inventario
        CREATE TABLE IF NOT EXISTS products
        (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            supplier_id INTEGER,
            name        TEXT NOT NULL,
            barcode     TEXT UNIQUE,
            description TEXT,
            cost_price  REAL NOT NULL DEFAULT 0.00,
            sale_price  REAL NOT NULL,
            stock       INTEGER NOT NULL DEFAULT 0,
            min_stock   INTEGER NOT NULL DEFAULT 5,
            image_path  TEXT,
            is_active   INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (category_id) REFERENCES product_categories(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

        -- 4. Motor de Promociones y Descuentos
        CREATE TABLE IF NOT EXISTS discounts
        (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            type          TEXT NOT NULL CHECK (type IN ('bulk_quantity', 'time_range', 'percentage_all')),
            discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
            value         REAL NOT NULL,
            min_quantity  INTEGER DEFAULT 1,
            target_type   TEXT NOT NULL CHECK (target_type IN ('all', 'product', 'category', 'plan')),
            target_id     INTEGER,
            start_date    TEXT,
            end_date      TEXT,
            start_time    TEXT,
            end_time      TEXT,
            days_of_week  TEXT,
            is_active     INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
        CREATE INDEX IF NOT EXISTS idx_discounts_target ON discounts(target_type, target_id);

        -- 5. Ventas / Tickets POS
        CREATE TABLE IF NOT EXISTS sales
        (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id           INTEGER NOT NULL,
            cash_register_id  INTEGER NOT NULL,
            customer_id       INTEGER,
            sale_number       TEXT UNIQUE NOT NULL,
            subtotal          REAL NOT NULL,
            discount_total    REAL NOT NULL DEFAULT 0.00,
            total             REAL NOT NULL,
            payment_method_id INTEGER NOT NULL,
            notes             TEXT,
            status            TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
            created_at        TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES system_users(id),
            FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
        );
        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
        CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
        CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

        -- 6. Items del Ticket de Venta
        CREATE TABLE IF NOT EXISTS sale_items
        (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id          INTEGER NOT NULL,
            item_type        TEXT NOT NULL CHECK (item_type IN ('product', 'plan')),
            product_id       INTEGER,
            plan_id          INTEGER,
            name             TEXT NOT NULL,
            quantity         INTEGER NOT NULL,
            unit_price       REAL NOT NULL,
            unit_cost        REAL NOT NULL DEFAULT 0.00,
            discount_applied REAL NOT NULL DEFAULT 0.00,
            discount_id      INTEGER,
            subtotal         REAL NOT NULL,
            created_at       TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (plan_id) REFERENCES plans(id),
            FOREIGN KEY (discount_id) REFERENCES discounts(id)
        );
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

        -- 7. Kardex / Movimientos de Stock
        CREATE TABLE IF NOT EXISTS stock_movements
        (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id     INTEGER NOT NULL,
            user_id        INTEGER NOT NULL,
            supplier_id    INTEGER,
            sale_id        INTEGER,
            type           TEXT NOT NULL CHECK (type IN ('purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'spoilage_out')),
            quantity       INTEGER NOT NULL,
            previous_stock INTEGER NOT NULL,
            new_stock      INTEGER NOT NULL,
            unit_cost      REAL,
            reason         TEXT,
            created_at     TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (user_id) REFERENCES system_users(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (sale_id) REFERENCES sales(id)
        );
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
    `);

    // --- Lightweight migrations & seeds ---
    try {
        db.exec(`PRAGMA foreign_keys = OFF;`);

        // Seed default product categories if empty
        const catCount = db.prepare(`SELECT COUNT(*) as count FROM product_categories`).get() as { count: number };
        if (catCount.count === 0) {
            const now = new Date().toISOString();
            const insertCat = db.prepare(`INSERT INTO product_categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)`);
            insertCat.run("Bebidas e Hidratación", "Agua mineral, isotónicas, energizantes y refrescos", now, now);
            insertCat.run("Batidos Nutritivos", "Batidos de proteína, frutas, avena y preparados al momento", now, now);
            insertCat.run("Suplementos", "Proteínas en polvo, creatina, pre-entrenos y aminoácidos", now, now);
            insertCat.run("Snacks Saludables", "Barras proteicas, frutos secos y galletas de avena", now, now);
            insertCat.run("Accesorios e Indumentaria", "Shakers, toallas, correas y guantes deportivos", now, now);
        }

        // Inscriptions: unique names (case-insensitive)
        db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_inscriptions_name_nocase
            ON inscriptions (name COLLATE NOCASE);
        `);

        // Payment methods: unique names
        db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_name_nocase
            ON payment_methods (name COLLATE NOCASE);
        `);

        // Seed "REEMBOLSO" payment method if missing
        const refundMethod = db.prepare(`SELECT id FROM payment_methods WHERE lower(name) = lower(?) LIMIT 1`).get('REEMBOLSO');
        if (!refundMethod) {
            db.exec(`INSERT INTO payment_methods (name, created_at, updated_at) VALUES ('REEMBOLSO', datetime('now'), datetime('now'));`);
        }

        db.exec(`PRAGMA foreign_keys = ON;`);
    } catch (e) {
        db.exec(`PRAGMA foreign_keys = ON;`);
        console.warn("⚠️ Migración ligera / seeds omitida:", e);
    }

    console.log("✅ Base de datos inicializada correctamente (Servicios + POS + Inventario + Promociones)");
}
