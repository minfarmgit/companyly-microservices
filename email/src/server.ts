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
    onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: any) {
        simpleParser(stream, {}, (err: any, parsed: ParsedMail) => {
            if (err)
                console.log("Error:" , err)

            console.log(parsed)
            stream.on("end", callback)
        });

    },
    disabledCommands: ['AUTH']
});

server.listen(environment.emailPort, environment.emailPort, () => {
    console.log(`[Email] Server listening at port ${environment.emailPort}`);
});