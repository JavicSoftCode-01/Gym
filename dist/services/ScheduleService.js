"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
class ScheduleService {
    constructor(repo) {
        this.repo = repo;
    }
    getAll() { return this.repo.findAll(); }
    create(data, userId) {
        if (!data.date || !data.startTime || !data.endTime) {
            throw new Error("Fecha, hora de inicio y hora de fin son obligatorios.");
        }
        return this.repo.create(data, userId); // 🌟 pasa userId
    }
    delete(id, userId) {
        if (!id || id <= 0) {
            throw new Error("ID de horario inválido.");
        }
        this.repo.delete(id, userId);
    }
}
exports.ScheduleService = ScheduleService;
//# sourceMappingURL=ScheduleService.js.map