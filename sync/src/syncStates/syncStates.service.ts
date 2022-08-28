import { Member } from "./member";
import { ProtocolToClient, ProtocolToServer, ServerMessageTypes, SocketProtocol } from "../protocol";
import { Server, Socket } from "socket.io";
import { Express, Request } from "express";
import { Paths } from "../paths";
import { MeetingInviteDto } from "./dto/meeting-invite.dto";
import { EmailMessageDto } from "./dto/email-message.dto";
import { ChatMessageDto } from "./dto/chat-message.dto";

export class SyncStatesService {
    private socketServer: Server;
    private httpServer: Express;

    private members: Map<string, Member> = new Map<string, Member>();

    constructor(socketServer: Server, httpServer: Express) {
        this.socketServer = socketServer;
        this.httpServer = httpServer;
        this.listenSocket();
        this.listenHttp();
    }

    private listenSocket(): void {
        this.socketServer.on(SocketProtocol.connection, (socket: Socket) => {

            socket.on(SocketProtocol.disconnect, () => {
                const user = Array.from(this.members.values()).find((member: Member) => member.socketId === socket.id);
                if (user) {
                    this.disconnectMember(user.userId.toString());
                    this.emitSyncMembers();
                }
            });

            socket.on(ProtocolToServer.SYNC_MEMBER_CONNECT, (userId: string) => {
                this.connectMember({
                    socketId: socket.id,
                    userId,
                });
                this.emitSyncMembers();
            });

        });
    }

    private listenHttp(): void {
        this.httpServer.post(`/${Paths.MEETING_INVITE}`, (req: Request<any, any, MeetingInviteDto>, res) => {
            const invitedMember: Member | undefined = this.members.get(req.body.toUserId.toString());
            if (invitedMember) {
                this.emitServerMessage<MeetingInviteDto>(ServerMessageTypes.MEETING_INVITE, invitedMember.socketId, req.body);
            }
            res.sendStatus(200);
        });
        this.httpServer.post(`/${Paths.EMAIL_MESSAGE}`, (req: Request<any, any, EmailMessageDto>, res) => {
            const toMember: Member | undefined = this.members.get(req.body.toUserId.toString());
            if (toMember) {
                this.emitServerMessage<EmailMessageDto>(ServerMessageTypes.EMAIL_MESSAGE, toMember.socketId, req.body);
            }
            res.sendStatus(200);
        });
        this.httpServer.post(`/${Paths.CHAT_MESSAGE}`, (req: Request<any, any, ChatMessageDto>, res) => {
            const toMember: Member | undefined = this.members.get(req.body.toUserId.toString());
            if (toMember) {
                this.emitServerMessage<ChatMessageDto>(ServerMessageTypes.CHAT_MESSAGE, toMember.socketId, req.body);
            }
            res.sendStatus(200);
        });
    }

    private connectMember(member: Member): void {
        this.members.set(member.userId.toString(), member);
        console.log(`[Sync][Socket] Connected client ${member.userId}`);
    }

    private disconnectMember(userId: string): void {
        this.members.delete(userId.toString());
    }

    public emitSyncMembers(): void {
        this.socketServer.emit(ProtocolToClient.SYNC_MEMBERS, JSON.stringify(Array.from(this.members.keys())));
    }

    public emitServerMessage<T>(type: ServerMessageTypes, recipient: string | null, data?: T): void {
        if (recipient) {
            this.socketServer.to(recipient).emit(ProtocolToClient.SYNC_MESSAGE, JSON.stringify({
                code: type,
                data: data,
            }));
        } else {
            this.socketServer.emit(ProtocolToClient.SYNC_MESSAGE, JSON.stringify({
                code: type,
                data: data,
            }));
        }
    }
}
