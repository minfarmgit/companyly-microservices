import { Action } from "../../core/action";
import axios, { AxiosResponse } from "axios";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";
import { environment } from "../../env";
import { config } from "../../config";
import { UserProfile } from "../../shared/models/userProfile.model";
import { BestMatch, findBestMatch } from 'string-similarity';

export class InviteMemberAction extends Action {
    code = 'inviteMember';

    triggers = [
        'пригласи',
        'пригласи в конференцию',
        'пригласи в комнату',
    ];

    contextTriggers = [
        'пригласи',
        'пригласи в конференцию',
        'пригласи в комнату',
    ];

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            const context = this.findContext(message);
            if (context) {
                console.log(`${environment.mainBeHost}:${environment.mainBePort}/employees`);
                axios.get(`${environment.mainBeHost}:${environment.mainBePort}/employees`, {
                    headers: {
                        Authorization: 'Bearer ' + config.botToken,
                    }
                }).then((res: AxiosResponse<UserProfile[]>) => {
                    const profilesList: UserProfile[] = res.data;
                    const namesList: string[] = profilesList.map((profile: UserProfile) => `${profile.firstName} ${profile.lastName}`.trim());
                    const bestMatch: BestMatch = findBestMatch(context, namesList);
                    if (bestMatch.bestMatch.rating > 0.6) {
                        const invUser: UserProfile = profilesList[bestMatch.bestMatchIndex];
                        const invites: string[] = room.roomValue.invites;
                        invites.push(invUser.userId.toString());
                        room.updateInvites(invites);
                        emitResponse(room, type, `Готово. Я пригласила пользователя ${invUser.firstName} ${invUser.lastName}`);
                    } else {
                        emitResponse(room, type, `Я не смогла найти такого пользователя`);
                    }
                }).catch((e) => {
                    emitResponse(room, type, `Извините, на сервере произошла какая-то ошибка`);
                });
            } else {
                emitResponse(room, type, `Пожалуйста, попросите это еще раз, уточнив пользователя`);
            }
        }
    }
}
