// @ts-ignore
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
// @ts-ignore
import { ParsedMail, simpleParser } from "mailparser";
import { environment, dev as devMode } from "./env";
import fs from "fs";

const dev: boolean = devMode;

if (dev) {
    console.log('[Email] Running in dev mode');
}

const server: SMTPServer = new SMTPServer({
    secure: !dev,
    key: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
    onData,
    onRcptTo,
    onAuth,
    onConnect,
    disabledCommands: ['AUTH'],
    authOptional: true,
    logger: true,
});

function onRcptTo({address} : any, session: any, callback: any) {
    console.log('test');
    if (address.startsWith('noreply@')) {
        callback(new Error(`Address ${address} is not allowed receiver`));
    }
    else {
        callback();
    }
}

function onConnect(session: any, callback: any) {
    console.log('[Email] New connection');
    if (session.remoteAddress === "127.0.0.1") {
        return callback(new Error("No connections from localhost allowed"));
    }
    return callback(); // Accept the connection
}

function onAuth(auth: any, session: any, callback: any) {
    if (auth.username !== "abc" || auth.password !== "def") {
        return callback(new Error("Invalid username or password"));
    }
    callback(null, { user: 123 }); // where 123 is the user id or similar property
}

function onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: any) {
    console.log('[Email] ', stream);
    simpleParser(stream, {}, (err: any, parsed: ParsedMail) => {
        if (err) {
            console.log("[Email] Error:" , err);
        }
        console.log('[Email] ', parsed);
        stream.on("end", callback)
    });

}

server.listen(environment.emailPort, environment.emailPort, () => {
    console.log(`[Email] Server listening at port ${environment.emailPort}`);
});