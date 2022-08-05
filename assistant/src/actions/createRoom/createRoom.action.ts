import { Action } from "../../core/action";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";

export class CreateRoomAction extends Action {
    code = 'createRoom';

    triggers = [
        'создай комнату с названием',
        'создай комнату',
        'создай конференцию',
        'создай конференцию с названием',
    ];

    contextTriggers = [
        'с названием',
        'с именем',
    ];

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            const context = this.findContext(message);
            if (context) {
                emitResponse(room, type, `Сейчас создам комнату под названием ${this.findContext(message)}`);
            } else {
                emitResponse(room, type, `Сейчас создам комнату со случайным названием`);
            }
        }
    }
}
