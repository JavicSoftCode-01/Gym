import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ProductService } from "../services/ProductService";

export class ProductController {
    constructor(private readonly service: ProductService) {}

    // Categorías
    getAllCategories = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getAllCategories());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    createCategory = (req: AuthRequest, res: Response): void => {
        try {
            const { name, description } = req.body;
            res.status(201).json(this.service.createCategory(name, description));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    updateCategory = (req: AuthRequest, res: Response): void => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const { name, description } = req.body;
            res.json(this.service.updateCategory(id, name, description));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    deleteCategory = (req: AuthRequest, res: Response): void => {
        try {
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.deleteCategory(id));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // Productos
    getAll = (req: AuthRequest, res: Response): void => {
        try {
            const includeInactive = req.query.includeInactive === "true";
            res.json(this.service.getAllProducts(includeInactive));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getById = (req: AuthRequest, res: Response): void => {
        try {
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.getProductById(id));
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    getByBarcode = (req: AuthRequest, res: Response): void => {
        try {
            const barcode = req.params.barcode as string;
            res.json(this.service.getProductByBarcode(barcode));
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    getLowStock = (_req: AuthRequest, res: Response): void => {
        try {
            res.json(this.service.getLowStockAlerts());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    create = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            res.status(201).json(this.service.createProduct(req.body, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    update = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.updateProduct(id, req.body, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    delete = (req: AuthRequest, res: Response): void => {
        try {
            const userId = req.user!.id;
            const id = parseInt(req.params.id as string, 10);
            res.json(this.service.deleteProduct(id, userId));
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}
