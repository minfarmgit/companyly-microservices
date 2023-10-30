import express, { Express } from "express";
import { createServer as createServerHttps } from "https";
import { createServer as createServerHttp } from "http";
import dotenv from 'dotenv';
import cors  from "cors";
import fs from "fs";
import { Server } from "socket.io";
import { SyncStatesService } from "./syncStates/syncStates.service";
import { environment, dev as devMode } from "./env";
import bodyParser from "body-parser";

dotenv.config();

const portSocket = environment.syncSocketPort;
const portHttp = environment.syncHttpPort;

const appSocket: Express = express();
appSocket.use(cors());

const appHttp: Express = express();
appHttp.use(cors());
appHttp.use(bodyParser.json());

// const dev: boolean = devMode;
const dev: boolean = true;

if (dev) {
    console.log('[Sync][All] Running in dev mode');
}

const serverSocket = dev ? createServerHttp(appSocket) : createServerHttps({
    key: fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
}, appSocket);

const serverHttp = dev ? createServerHttp(appHttp) : createServerHttps({
    key: fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
}, appHttp);

const io = new Server(serverSocket, {
    cors: {
        origin: '*',
    },
});

const syncStatesService = new SyncStatesService(io, appHttp);

serverSocket.listen(portSocket, () => {
    console.log(`[Sync][Socket] Server listening at port:${portSocket}`);
});

serverHttp.listen(portHttp, () => {
    console.log(`[Sync][Http] Server listening at port:${portHttp}`);
});
