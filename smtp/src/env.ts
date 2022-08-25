// @ts-ignore
import { environment as devEnv } from "../../environment";
// @ts-ignore
import { environment as prodEnv } from "../../environment.prod";

export const dev: boolean = process.env.npm_lifecycle_script?.includes('ts-node') || false;

export const environment = dev ? devEnv : prodEnv;
