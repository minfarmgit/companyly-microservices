// @ts-ignore
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
// @ts-ignore
import { ParsedMail, simpleParser } from "mailparser";
import { environment, dev as devMode } from "./env";
import fs from "fs";
import { Mail, MailSendData } from "./models/mail.model";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import MailComposer from "nodemailer/lib/mail-composer";

const dev: boolean = devMode;

if (dev) {
    console.log('[Email] Running in dev mode');
}

const server: SMTPServer = new SMTPServer({
    secure: false,
    key: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
    onData,
    onRcptTo,
    onAuth,
    onConnect,
    disabledCommands: ['AUTH'],
    authOptional: true,
    logger: false,
});

function onRcptTo({address} : any, session: any, callback: any) {
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
    simpleParser(stream, {}, (err: any, parsed: ParsedMail) => {
        if (err) {
            console.log("[Email] Error:" , err);
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
        console.log('[Email] New mail:');
        console.log(mail);
        stream.on("end", callback)
    });
}

setTimeout(() => {
    sendEmail({
        from: 'test@clikl.ru',
        to: 'zidiks229@yandex.by',
        message: 'test message!!!',
    });
}, 5000);

function sendEmail(data: MailSendData): void {
    const host: string | undefined = data.to.split('@')[1];
    console.log(`[Email] Host: smtp.${host}`);
    if (host) {
        const connection = new SMTPConnection({
            secure: false,
            port: environment.emailPort,
            host: environment.emailHost,
            tls: {
                rejectUnauthorized: false,
            },
            debug: true,
        });
        connection.connect((err?: SMTPConnection.SMTPError) => {
            if (err) {
               console.log('[Email] Error: ', err);
               return;
            }
            console.log('[Email] Connection is established');
            connection.send(
                {
                    from: data.from,
                    to: data.to,
                },
                data.message,
                (err: SMTPConnection.SMTPError | null, info: SMTPConnection.SentMessageInfo) => {
                    if (err) {
                        console.log('[Email] Error: ', err);
                        return;
                    }
                    console.log('[Email] Info: ', info);
                    connection.close();
                }
            )
        });
    }
}

server.listen(environment.emailPort, () => {
    console.log(`[Email] Server listening at port ${environment.emailPort}`);
});
