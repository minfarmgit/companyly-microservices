// @ts-ignore
import { environment as devEnv } from "../../environment";
// @ts-ignore
import { environment as prodEnv } from "../../environment.prod";

const dev: boolean = process.env.npm_lifecycle_script === 'nodemon';

export const environment = dev ? devEnv : prodEnv;