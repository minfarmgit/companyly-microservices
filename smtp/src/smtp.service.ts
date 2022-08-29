import { Server, Socket } from "socket.io";
import { Express, Request } from "express";
import { Mail } from "./models/mail.model";
import { Transporter } from "nodemailer";
import { MailDto } from "./dto/mail.dto";
import { ProtocolToClient, ProtocolToServer, SocketProtocol } from "./protocol";
import { MailsListDto } from "./dto/mails-list.dto";
import { Member } from "./models/member.model";
import axios from "axios";
import { environment } from "./env";

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = String(0);

export class SmtpService {

    private connected: Map<string, Member> = new Map();
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
            const member: Member | undefined = this.connected.get(userTo);
            setTimeout(() => {
                if (member) {
                    axios.post(`${environment.host}:${environment.syncHttpPort}/email_message`, {
                        toUserId: member.userId,
                        message: userTo,
                    });
                }
            }, 1500);
        }
        if (updateUser) {
            this.updateMailList(updateUser);
        }
    }

    public updateMailList(userMail: string): void {
        if (this.connected.has(userMail)) {
            console.log('[Smtp][Service] Emit Mails list for: ', userMail);
            const member: Member | undefined = this.connected.get(userMail);
            if (member) {
                this.socketServer.to(member.socketId).emit(ProtocolToClient.MAILS_LIST, null);
            }
        }
    }

    private getAllMails(userMail: string): MailsListDto {
      return {
          in: this.getInMails(userMail),
          out: this.getOutMails(userMail),
      }
    }

    private getInMails(userMail: string): Mail[] {
        return this.mailsList.filter((mail: Mail) => {
           const userTo: string | undefined = mail.to?.value[0].address;
           return userTo === userMail;
        });
    }

    private getOutMails(userMail: string): Mail[] {
        return this.mailsList.filter((mail: Mail) => {
            const userFrom: string | undefined = mail.from?.value[0].address;
            return userFrom === userMail;
        });
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
            socket.on(SocketProtocol.disconnect, () => {
                const user: [string, Member] | undefined = Array.from(this.connected.entries()).find(([key, value]: [string, Member]) => {
                    return socket.id === value.socketId
                });
                if (user) {
                    this.connected.delete(user[0]);
                }
            });

            socket.on(ProtocolToServer.JOIN_CLIENT, (userMail: string, userId: string) => {
                console.log('[Smtp][Service] Connected socket user', this.connected);
                this.connected.set(userMail, {
                    socketId: socket.id,
                    userId,
                });
                this.updateMailList(userMail);
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
                        }, req.body.from);
                        res.end('Sent');
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
