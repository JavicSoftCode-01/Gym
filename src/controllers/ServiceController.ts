import {Request, Response} from "express";
import {GymService} from "../services/GymService";
import { AuthRequest } from "../middlewares/auth.middleware";

export class ServiceController {
    constructor(private readonly gymService: GymService) {
    }

    getAll = (_req: Request, res: Response): void => {
        try {
            const services = this.gymService.getAllServices();
            res.json(services);
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    getById = (req: Request, res: Response): void => {
        try {
            const id = parseInt(<string>req.params.id);
            const service = this.gymService.getServiceById(id);
            if (!service) {
                res.status(404).json({error: "Servicio no encontrado"});
                return;
            }
            res.json(service);
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    create = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const service = this.gymService.createService(req.body, userId);
            res.status(201).json(service);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    };

    update = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id);
            const service = this.gymService.updateService(id, req.body, userId);
            if (!service) {
                res.status(404).json({error: "Servicio no encontrado"});
                return;
            }
            res.json(service);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    };

    delete = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id);
            const success = this.gymService.deleteService(id, userId);
            if (!success) {
                res.status(404).json({error: "Servicio no encontrado"});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };
}