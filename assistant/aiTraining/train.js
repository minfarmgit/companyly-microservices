"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_core_1 = require("../src/core/ai/ai_core");
const config_1 = require("../src/config");
ai_core_1.bkLabs.nlu.train(config_1.config.trainDataPath, config_1.config.trainModelFolder);
