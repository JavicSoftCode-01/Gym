import { Response } from "express";
import { CustomerPlanService } from "../services/CustomerPlanService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class CustomerPlanController {
    constructor(private customerPlanService: CustomerPlanService) {}

    create = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const assignment = this.customerPlanService.assignPlanToCustomer(req.body, userId);
            res.status(201).json(assignment);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    getById = (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(<string>req.params.id);
            const assignment = this.customerPlanService.getAssignmentById(id);
            if (!assignment) {
                res.status(404).json({ error: "Suscripción no encontrada" });
                return;
            }
            res.json(assignment);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = (req: AuthRequest, res: Response) => {
        try {
            res.json(this.customerPlanService.getAll());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    update = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            const updated = this.customerPlanService.updateAssignment(id, req.body, userId);
            res.json(updated);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    delete = (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id, 10);
            res.json(this.customerPlanService.deleteAssignment(id, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}