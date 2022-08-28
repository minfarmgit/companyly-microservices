export enum ProtocolToClient {
    SYNC_MESSAGE = 'SYNC_MESSAGE',
    SYNC_MEMBERS = 'SYNC_MEMBERS',
}

export enum ProtocolToServer {
    SYNC_MEMBER_CONNECT = 'SYNC_MEMBER_CONNECT',
}

export enum ServerMessageTypes {
    ERROR = 'ERROR',
    NOTIFICATION = 'NOTIFICATION',
    MEETING_INVITE = 'MEETING_INVITE',
    EMAIL_MESSAGE = 'EMAIL_MESSAGE',
    CHAT_MESSAGE = 'CHAT_MESSAGE',
    START_CALL = 'START_CALL',
    END_CALL = 'END_CALL',
}

export interface ServerMessage<T> {
    code: ServerMessageTypes;
    data: T;
}

export enum SocketProtocol {
    connection = 'connection',
    disconnect = 'disconnect',
}

