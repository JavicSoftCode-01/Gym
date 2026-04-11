"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = exports.db = void 0;
// src/database/index.ts
var database_1 = require("./database");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return __importDefault(database_1).default; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "initializeSchema", { enumerable: true, get: function () { return schema_1.initializeSchema; } });
//# sourceMappingURL=index.js.map