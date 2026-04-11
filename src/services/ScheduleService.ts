import { IScheduleRepository } from "../repositories/interfaces/IScheduleRepository";

export class ScheduleService {
    constructor(private readonly repo: IScheduleRepository) {}

    getAll() { return this.repo.findAll(); }

    create(data: { date: string; startTime: string; endTime: string }, userId: number) {
        if (!data.date || !data.startTime || !data.endTime) {
            throw new Error("Fecha, hora de inicio y hora de fin son obligatorios.");
        }
        return this.repo.create(data, userId); // 🌟 pasa userId
    }

    delete(id: number, userId: number) {
        if (!id || id <= 0) {
            throw new Error("ID de horario inválido.");
        }
        this.repo.delete(id, userId);
    }
}