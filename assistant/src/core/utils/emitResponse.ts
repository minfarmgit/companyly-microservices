import { RoomCore } from "../meeting/room.core";
import { CommunicationType } from "../models/communicationType.model";

export function emitResponse(roomCore: RoomCore, type: CommunicationType, message: string): void {
    switch (type) {
        case 'voice':
            roomCore.sendVoice(message);
            break;
        case 'text':
            roomCore.sendMessage(message);
            break;
    }
}