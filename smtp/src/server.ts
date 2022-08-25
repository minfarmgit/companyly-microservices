import { createTransport, Transporter } from "nodemailer";

setTimeout(() => {
    sendEmail().then(info => console.log("Message sent: %s", info.messageId));
}, 10000);

async function sendEmail() {
    let transporter: Transporter = createTransport({
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
    return transporter.sendMail({
        from: '"Fred Foo 👻" <zidiks@clikl.ru>',
        to: "companyly@yandex.ru",
        subject: "Hello ✔",
        text: "Hello world?",
        html: "<b>Hello world?</b>",
    });
}