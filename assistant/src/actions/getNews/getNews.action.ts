import { Action } from "../../core/action";
import axios, { AxiosResponse } from "axios";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";

export class GetNewsAction extends Action {
    code = 'getNews';

    triggers = [
        'что нового в',
        'что нового на',
        'расскажи новости',
        'найди новости',
        'расскажи последние события',
        'найди последние события',
    ];

    contextTriggers = [
        'нового в',
        'нового на',
        'новости о',
        'новости об',
        'новости в',
        'события на',
        'события в',
    ];

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            const context = this.findContext(message);
            if (context) {
                axios.get(encodeURI(`https://api.apilayer.com/world_news/search-news?text=${context}&language=ru&offset=0&number=5`), {
                    headers: {
                        apikey: 'oxsJ1W7nnbRHg7s6UOKARfbMJrv9isZ6',
                    }
                }).then((res: AxiosResponse) => {
                    if (res.data.news.length) {
                        const textResponse = (res.data.news as any[]).map((item: any) => `"${item.title}" - ${item.url}`).join('\n');
                        if (type === "voice") {
                            emitResponse(room, type, `Я нашла несколько новостей на тему ${context} и отправила их в чат`);
                            emitResponse(room, 'text', textResponse);
                        } else {
                            emitResponse(room, type, `Я нашла несколько новостей на тему ${context}`);
                            emitResponse(room, 'text', textResponse);
                        }
                    } else  {
                        emitResponse(room, type, `Я не смогла найти новости по этой теме`);
                    }
                }).catch((e) => {
                    emitResponse(room, type, `Я не смогла найти новости по этой теме`);
                });
            } else {

            }
        }
    }
}
