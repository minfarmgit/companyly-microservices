import { Server, Socket } from "socket.io";
import { Express, Request } from "express";
import { Mail } from "./models/mail.model";
import { Transporter } from "nodemailer";
import { MailDto } from "./dto/mail.dto";
import { ProtocolToClient, ProtocolToServer, SocketProtocol } from "./protocol";
import { MailsListDto } from "./dto/mails-list.dto";

export class SmtpService {

    private connected: Map<string, string> = new Map();

    constructor(
        private socketServer: Server,
        private httpServer: Express,
        private transporter: Transporter,
    ) {
        this.listenSocket();
        this.listenHttp();
    }

    public processMail(mail: Mail): void {
        console.log(mail);
        console.log(mail.to);
    }

    public updateMailList(user: string): void {
        if (this.connected.has(user)) {
            this.socketServer.to(user).emit(ProtocolToClient.MAILS_LIST);
        }
    }

    private getAllMails(user: string): MailsListDto {
      return {
          in: this.getInMails(user),
          out: this.getOutMails(user),
      }
    }

    private getInMails(user: string): Mail[] {
        return [];
    }

    private getOutMails(user: string): Mail[] {
        return [];
    }

    private async sendMail(mail: MailDto): Promise<any> {
        return this.transporter.sendMail({
            from: `"${mail.user}" <${mail.from}>`,
            to: mail.to,
            subject: mail.subject,
            text: mail.content,
            html: `<span>${mail.content}</span>`,
        });
    }

    private listenSocket(): void {
        this.socketServer.on(SocketProtocol.connection, (socket: Socket) => {
            socket.on(ProtocolToServer.JOIN_CLIENT, (user: string) => {
                this.connected.set(user, socket.id);
                this.updateMailList(user);
            });
        });
    }

    private listenHttp(): void {
        this.httpServer.post('/send', (req: Request<any, any, MailDto>, res) => {
            if (req.body) {
                this.sendMail(req.body)
                    .then(() => {
                        this.updateMailList(req.body.user);
                        res.sendStatus(200);
                    })
                    .catch((e) => res.sendStatus(500))
            } else {
                res.sendStatus(400);
            }
        });

        this.httpServer.get('/mails/:user', (req, res) => {
           const user: string | undefined = req.params.user;
           if (user) {
               const mailList: MailsListDto = this.getAllMails(user);
                res.send(mailList);
           }
        });
    }
}