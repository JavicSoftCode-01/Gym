import express from "express";
import path from "path";
import {initializeSchema} from "./database";

const app = express();
const PORT = 3000;

app.use(express.json());

// Sirve todo lo que está en public/ (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "../public")));

initializeSchema();

app.listen(PORT, () => {
    console.log(`🏋️  Gym server corriendo en http://localhost:${PORT}`);
});