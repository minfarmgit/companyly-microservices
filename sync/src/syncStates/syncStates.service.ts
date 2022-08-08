import { Member } from "./member";
import { ProtocolToClient, ProtocolToServer, ServerMessageTypes, SocketProtocol } from "../protocol";
import { Server, Socket } from "socket.io";
import { Express, Request } from "express";
import { Paths } from "../paths";
import { MeetingInviteDto } from "./dto/meeting-invite.dto";

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
                this.disconnectMember(socket.id);
                this.emitSyncMembers();
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
    }

    private connectMember(member: Member): void {
        this.members.set(member.userId.toString(), member);
        console.log(`[Sync][Socket] Connected client ${member.userId}`);
    }

    private disconnectMember(socketId: string): void {
        this.members.delete(socketId);
    }

    public emitSyncMembers(): void {
        this.socketServer.emit(ProtocolToClient.SYNC_MEMBERS, JSON.stringify(Object.fromEntries(this.members.entries())));
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
