import { bkLabs } from "../src/core/ai/ai_core";
import { config } from "../src/config";

bkLabs.nlu.train(config.trainDataPath, config.trainModelFolder);
