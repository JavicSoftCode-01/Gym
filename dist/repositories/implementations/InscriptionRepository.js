"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InscriptionRepository = void 0;
const database_1 = __importDefault(require("../../database/database"));
const AuditRepository_1 = require("./AuditRepository");
class InscriptionRepository {
    findAll() {
        return database_1.default.prepare(`
            SELECT id, name, price, created_at as createdAt, updated_at as updatedAt
            FROM inscriptions
            ORDER BY name ASC
        `).all();
    }
    findById(id) {
        return database_1.default.prepare(`
            SELECT id, name, price, created_at as createdAt, updated_at as updatedAt
            FROM inscriptions
            WHERE id = ?
        `).get(id);
    }
    create(data, userId) {
        const name = (data.name || "").trim();
        if (!name)
            throw new Error("El nombre de la inscripción es obligatorio.");
        if (typeof data.price !== "number" || Number.isNaN(data.price) || data.price < 0) {
            throw new Error("El precio debe ser válido.");
        }
        const exists = database_1.default.prepare(`SELECT id FROM inscriptions WHERE lower(name) = lower(?) LIMIT 1`).get(name);
        if (exists)
            throw new Error("Esa inscripción ya existe.");
        const now = new Date().toISOString();
        const result = database_1.default.prepare(`
            INSERT INTO inscriptions (name, price, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(name, data.price, now, now);
        const newId = result.lastInsertRowid;
        AuditRepository_1.AuditRepository.log(userId, "CREATE", "inscriptions", newId, { name, price: data.price });
        return { id: newId, name, price: data.price, createdAt: new Date(now), updatedAt: new Date(now) };
    }
    update(id, data, userId) {
        const name = (data.name || "").trim();
        if (!name)
            throw new Error("El nombre de la inscripción es obligatorio.");
        if (typeof data.price !== "number" || Number.isNaN(data.price) || data.price < 0) {
            throw new Error("El precio debe ser válido.");
        }
        const exists = database_1.default.prepare(`SELECT id FROM inscriptions WHERE lower(name) = lower(?) AND id <> ? LIMIT 1`).get(name, id);
        if (exists)
            throw new Error("Esa inscripción ya existe.");
        const now = new Date().toISOString();
        database_1.default.prepare(`UPDATE inscriptions SET name = ?, price = ?, updated_at = ? WHERE id = ?`).run(name, data.price, now, id);
        AuditRepository_1.AuditRepository.log(userId, "UPDATE", "inscriptions", id, { name, price: data.price });
    }
    delete(id, userId) {
        // no permitir borrar si está asignada a un cliente
        const used = database_1.default.prepare(`SELECT 1 as ok FROM customers WHERE inscription_id = ? LIMIT 1`).get(id);
        if (used?.ok)
            throw new Error("No se puede eliminar. Esta inscripción está asignada a uno o más clientes.");
        const current = this.findById(id);
        database_1.default.prepare(`DELETE FROM inscriptions WHERE id = ?`).run(id);
        if (current)
            AuditRepository_1.AuditRepository.log(userId, "DELETE", "inscriptions", id, current);
    }
}
exports.InscriptionRepository = InscriptionRepository;
//# sourceMappingURL=InscriptionRepository.js.map