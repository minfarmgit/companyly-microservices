import { createTransport, Transporter } from "nodemailer";
import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from "smtp-server";
import { environment, dev as devMode } from "./env"
import * as fs from "fs";
import { ParsedMail, simpleParser } from "mailparser";
import { Mail } from "./models/mail.model";

const dev: boolean = devMode;

if (dev) {
    console.log('[Smtp] Running in dev mode');
}

setTimeout(() => {
    sendEmail().then(info => console.log("Message sent: %s", info.messageId));
}, 10000);

const transporter: Transporter = createTransport({
    host: 'mail.clikl.ru',
    port: 25,
    secure: false,
    auth: {
        user: 'companyly',
        pass: '123',
    },
    tls: {
        rejectUnauthorized: false,
    },
    logger: true,
});

const smtpServer: SMTPServer = new SMTPServer({
    secure: false,
    key: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/privkey.pem', 'utf8'),
    cert: dev ? undefined : fs.readFileSync('/etc/letsencrypt/live/clikl.ru/cert.pem', 'utf8'),
    onData,
    onRcptTo,
    onAuth,
    onConnect,
    hideSTARTTLS: true,
    authOptional: true,
    logger: false,
});

async function sendEmail() {
    return transporter.sendMail({
        from: '"Fred Foo 👻" <zidiks@clikl.ru>',
        to: "companyly@yandex.ru",
        subject: "Hello ✔",
        text: "Hello world?",
        html: "<b>Hello world?</b>",
    });
}

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
        callback(null, "Message queued");
        stream.on("end", () => {
            callback(null, "Message accepted");
        })
    });
}

smtpServer.listen(environment.smtpPort, () => {
    console.log(`[Smtp] Server listening at port ${environment.smtpPort}`);
});