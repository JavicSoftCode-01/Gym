import { Request, Response } from "express";
import { PlanService } from "../services/PlanService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PlanController {
    constructor(private readonly planService: PlanService) {}

    getAll = (req: Request, res: Response) => {
        try {
            res.json(this.planService.getAllPlans());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    create = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const plan = this.planService.createPlan(req.body, userId);
            res.status(201).json(plan);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    update = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            this.planService.updatePlan(id, req.body, userId);
            res.json({ success: true, message: "Plan actualizado." });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    delete = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            this.planService.deletePlan(id, userId);
            res.json({ success: true, message: "Plan eliminado." });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}