import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = (req: Request, res: Response) => {
        try { res.status(201).json(this.authService.registerAdmin(req.body)); }
        catch (error: any) { res.status(400).json({ error: error.message }); }
    };

    login = (req: Request, res: Response) => {
        try { res.json(this.authService.login(req.body)); }
        catch (error: any) { res.status(401).json({ error: error.message }); }
    };
}