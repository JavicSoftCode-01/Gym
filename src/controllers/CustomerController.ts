import {Request, Response} from "express";
import {CustomerService} from "../services/CustomerService";
import {AuthRequest} from "../middlewares/auth.middleware";

export class CustomerController {
    constructor(private readonly customerService: CustomerService) {
    }

    getAll = (_req: AuthRequest, res: Response): void => {
        try {
            const customers = this.customerService.getAllCustomers();
            res.json(customers);
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    getById = (req: Request, res: Response): void => {
        try {
            const id = parseInt(<string>req.params.id);
            const customer = this.customerService.getCustomerById(id);
            if (!customer) {
                res.status(404).json({error: "Cliente no encontrado"});
                return;
            }
            res.json(customer);
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    create = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const customer = this.customerService.createCustomer(req.body, userId);
            res.status(201).json(customer);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    };

    update = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id);
            const customer = this.customerService.updateCustomer(id, req.body, userId);
            if (!customer) {
                res.status(404).json({error: "Cliente no encontrado"});
                return;
            }
            res.json(customer);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    };

    delete = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(<string>req.params.id);
            const success = this.customerService.deleteCustomer(id, userId);
            if (!success) {
                res.status(404).json({error: "Cliente no encontrado"});
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                res.status(400).json({error: "No se puede eliminar. Este cliente tiene planes o registros asociados."});
                return;
            }
            res.status(500).json({error: error.message});
        }
    };
}