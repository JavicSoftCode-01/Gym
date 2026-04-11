"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.register = (req, res) => {
            try {
                res.status(201).json(this.authService.registerAdmin(req.body));
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.login = (req, res) => {
            try {
                res.json(this.authService.login(req.body));
            }
            catch (error) {
                res.status(401).json({ error: error.message });
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map