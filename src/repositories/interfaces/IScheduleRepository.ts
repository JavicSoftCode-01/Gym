import { Schedule } from "../../domain/entities";

export interface IScheduleRepository {
    findAll(): Schedule[];
    create(data: { date: string; startTime: string; endTime: string }, userId: number): Schedule;
    delete(id: number, userId: number): void;
}