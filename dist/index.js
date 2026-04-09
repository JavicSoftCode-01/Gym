"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
// Sirve todo lo que está en public/ (HTML, CSS, JS, imágenes)
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
(0, database_1.initializeSchema)();
app.listen(PORT, () => {
    console.log(`🏋️  Gym server corriendo en http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map