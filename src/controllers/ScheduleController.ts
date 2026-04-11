import { Request, Response } from "express";
import { ScheduleService } from "../services/ScheduleService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class ScheduleController {
    constructor(private readonly service: ScheduleService) {}

    getAll = (req: Request, res: Response) => {
        try { res.json(this.service.getAll()); }
        catch (error: any) { res.status(500).json({ error: error.message }); }
    };

    create = (req: AuthRequest, res: Response) => {
        try { const userId = req.user!.id;
            res.status(201).json(this.service.create(req.body, userId)); }
        catch (error: any) { res.status(400).json({ error: error.message }); }
    };

    delete = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const scheduleId = Number(req.params.id);
            if (isNaN(scheduleId) || scheduleId <= 0) {
                throw new Error("ID de horario inválido.");
            }
            this.service.delete(scheduleId, userId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}