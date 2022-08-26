import { Server, Socket } from "socket.io";
import { Express, Request } from "express";
import { Mail } from "./models/mail.model";
import { Transporter } from "nodemailer";
import { MailDto } from "./dto/mail.dto";
import { ProtocolToClient, ProtocolToServer, SocketProtocol } from "./protocol";
import { MailsListDto } from "./dto/mails-list.dto";

export class SmtpService {

    private connected: Map<string, string> = new Map();
    private mailsList: Mail[] = [];

    constructor(
        private socketServer: Server,
        private httpServer: Express,
        private transporter: Transporter,
    ) {
        this.listenSocket();
        this.listenHttp();
    }

    public processMail(mail: Mail, updateUser?: string): void {
        console.log('[Smtp][Service] ', mail);
        const userTo: string | undefined = mail.to?.value[0].address;
        if (userTo) {
            this.mailsList.push(mail);
            this.updateMailList(userTo);
        }
        if (updateUser) {
            this.updateMailList(updateUser);
        }
    }

    public updateMailList(user: string): void {
        if (this.connected.has(user)) {
            console.log('[Smtp][Service] Emit Mails list for: ', user);
            const socketId: string | undefined = this.connected.get(user);
            if (socketId) {
                this.socketServer.to(socketId).emit(ProtocolToClient.MAILS_LIST, null);
            }
        }
    }

    private getAllMails(user: string): MailsListDto {
      return {
          in: this.getInMails(user),
          out: this.getOutMails(user),
      }
    }

    private getInMails(user: string): Mail[] {
        return this.mailsList.filter((mail: Mail) => {
           const userTo: string | undefined = mail.to?.value[0].address;
           return userTo === user;
        });
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
                console.log('[Smtp][Service] Connected socket user', this.connected);
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
                        this.processMail({
                            attachments: [],
                            from: {
                                value: [ {  address: req.body.from, name: req.body.user } ],
                                html: `<span class="mp_address_group"><a href="mailto:${req.body.from}" class="mp_address_email">${req.body.from}</a></span>`,
                                text: req.body.from,
                            },
                            to: {
                                value: [ {  address: req.body.to, name: '' } ],
                                html: `<span class="mp_address_group"><a href="mailto:${req.body.to}" class="mp_address_email">${req.body.to}</a></span>`,
                                text: req.body.to,
                            },
                            subject: req.body.subject,
                            date: new Date(),
                            content: {
                                text: req.body.content,
                                html: `<span>${req.body.content}</span>`
                            }
                        }, req.body.user);
                        res.send('Sent');
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
