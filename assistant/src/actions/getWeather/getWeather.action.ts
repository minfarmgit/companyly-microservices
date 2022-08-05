import { Action } from "../../core/action";
import axios, { AxiosResponse } from "axios";
import { getCity } from "../../core/geo/getCity";
import { CityModel } from "../../core/geo/models/city.model";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";

export class GetWeatherAction extends Action {
    code = 'getWeather';

    triggers = [
        'какая погода в',
        'какая сейчас погода в',
        'покажи погоду в',
        'расскажи о погоде в',
    ];

    contextTriggers = [
        'погода в',
        'погоду в',
        'о погоде в',
    ];

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            const context = this.findContext(message);
            if (context) {
                getCity(context).then((city: CityModel) => {
                    axios.get(encodeURI(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&lang=ru&appid=a2beba5a3d32d4121ff078aaf42df7e2&units=metric`)).then((res: AxiosResponse) => {
                        emitResponse(room, type, `Сейчас в городе ${city.name} ${Math.round(res.data.main.feels_like)} градусов`);
                    });
                });
            } else {
                emitResponse(room, type, `Пожалуйста, спросите погоду еще раз, уточнив город`);
            }
        }
    }
}
