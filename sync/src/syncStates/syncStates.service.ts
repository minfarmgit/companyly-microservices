import { Member } from "./member";
import { ProtocolToClient, ProtocolToServer, ServerMessageTypes, SocketProtocol } from "../protocol";
import { Server, Socket } from "socket.io";
import { Express } from "express";

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
            });

            socket.on(ProtocolToServer.MEMBER_CONNECT, (userId: string) => {
                this.connectMember({
                    socketId: socket.id,
                    userId,
                });
            });

        });
    }

    private listenHttp(): void {
        this.httpServer.post('/meeting_invite', (req, res) => {
            console.log('new invite: ', req.body);
            res.sendStatus(200);
        });
    }

    private connectMember(member: Member): void {
        this.members.set(member.socketId, member);
    }

    private disconnectMember(socketId: string): void {
        this.members.delete(socketId);
    }

    public emitServerMessage<T>(type: ServerMessageTypes, recipient: string | null, data?: T): void {
        if (recipient) {
            this.socketServer.to(recipient).emit(ProtocolToClient.SERVER_MESSAGE, data);
        } else {
            this.socketServer.emit(ProtocolToClient.SERVER_MESSAGE, data);
        }
    }
}
