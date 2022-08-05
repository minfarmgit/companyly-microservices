export enum ProtocolToClient {
    SERVER_MESSAGE = 'SERVER_MESSAGE',
    MEMBERS_STATES = 'MEMBERS_STATES',
}

export enum ProtocolToServer {
    MEETING_INVITE = 'MEETING_INVITE',
    MEMBER_CONNECT = 'MEMBER_CONNECT',
}

export enum ServerMessageTypes {
    ERROR = 'ERROR',
    NOTIFICATION = 'NOTIFICATION',
    MEETING_INVITE = 'MEETING_INVITE',
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

