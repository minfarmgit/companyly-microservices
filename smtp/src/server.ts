import { createTransport, Transporter } from "nodemailer";
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from "smtp-server";
import { environment, dev as devMode } from "./env"
import * as fs from "fs";
import { ParsedMail, simpleParser } from "mailparser";
import { Mail } from "./models/mail.model";
import express, { Express } from "express";
import cors  from "cors";
import bodyParser from "body-parser";
import { createServer as createServerHttp } from "http";
import { createServer as createServerHttps } from "https";
import { Server } from "socket.io";
import { SmtpService } from "./smtp.service";

const appSocket: Express = express();
appSocket.use(cors());

const appHttp: Express = express();
appHttp.use(cors());
appHttp.use(bodyParser.json());

const dev: boolean = devMode;

if (dev) {
    console.log('[Smtp] Running in dev mode');
}

const transporter: Transporter = createTransport({
    host: 'mail.clikl.ru',
    port: environment.emailPort,
    secure: false,
    auth: {
        user: environment.emailLogin,
        pass: environment.emailPassword,
    },
    tls: {
        rejectUnauthorized: false,
    },
    debug: false,
});

const smtpServer: SMTPServer = new SMTPServer({
    secure: false,
    key: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
    onData,
    onRcptTo,
    onConnect,
    hideSTARTTLS: true,
    authOptional: true,
    logger: false,
});

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

const smtpService: SmtpService = new SmtpService(io, appHttp, transporter);

function onRcptTo({address} : any, session: any, callback: any) {
    if (address.startsWith('noreply@')) {
        callback(new Error(`Address ${address} is not allowed receiver`));
    }
    else {
        callback();
    }
}

function onConnect(session: any, callback: any) {
    console.log('[Smtp] New connection');
    return callback();
}

function onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: any) {
    simpleParser(stream, {}, (err: any, parsed: ParsedMail) => {
        if (err) {
            console.log("[Smtp] Error:" , err);
        }
        const mail: Mail = {
            attachments: parsed.attachments,
            subject: parsed.subject,
            date: parsed.date,
            content: {
                html: parsed.html,
                text: parsed.text,
            },
            from: parsed.from,
            to: parsed.to,
        }
        console.log('[Smtp] New mail:');
        console.log(mail);
        smtpService.processMail(mail);
        callback(null, "Message queued");
        stream.on("end", () => {
            callback(null, "Message accepted");
        })
    });
}

smtpServer.listen(environment.smtpServicePort, () => {
    console.log(`[Smtp][Service] Server listening at port ${environment.smtpServicePort}`);
});

serverSocket.listen(environment.smtpSocketPort, () => {
    console.log(`[Smtp][Socket] Server listening at port:${environment.smtpSocketPort}`);
});

serverHttp.listen(environment.smtpHttpPort, () => {
    console.log(`[Smtp][Http] Server listening at port:${environment.smtpHttpPort}`);
});