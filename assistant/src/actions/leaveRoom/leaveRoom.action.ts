import { Action } from "../../core/action";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";

export class LeaveRoomAction extends Action {
    code = 'leaveRoom';

    triggers = [
        'уйди',
        'покинь комнату',
        'выйди из комнаты',
        'покинь конференцию',
        'выйди из конференцию',
        'отключись',
        'уходи',
    ];

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            emitResponse(room, type, 'Всем пока!');
            setTimeout(() => {
                room.destroy(false);
            }, 3000);
        }
    }
}
