import { Response } from "express";
import { PlanScheduleService } from "../services/PlanScheduleService";
import { AuthRequest } from "../middlewares/auth.middleware"; // 🌟

export class PlanScheduleController {
    constructor(private readonly service: PlanScheduleService) {}

    assign = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            res.status(201).json(this.service.assign(req.body, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    getByPlan = (req: AuthRequest, res: Response) => {
        try {
            const planId = parseInt(<string>req.params.planId);
            res.json(this.service.getByPlan(planId));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}