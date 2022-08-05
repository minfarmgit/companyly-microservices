import { Action } from "../../core/action";
import axios, { AxiosResponse } from "axios";
import { BestMatch, findBestMatch } from 'string-similarity';
import { Currency, currencyResponseName, currencyVariables } from "./rates";
import { RoomCore } from "../../core/meeting/room.core";
import { CommunicationType } from "../../core/models/communicationType.model";
import { emitResponse } from "../../core/utils/emitResponse";

export class ExchangeRatesAction extends Action {
    code = 'exchangeRates';

    triggers = [
        'скажи курс',
        'какой сейчас курс',
        'какой сегодня курс',
        'какой курс',
        'сколько стоит',
        'сколько стоит сегодня',
    ];

    contextTriggers = [
        'курс',
        'стоит',
        'стоит сегодня',
    ];

    currencyVariables = new Map<string, Currency>();

    constructor() {
        super();
        Object.entries(currencyVariables).forEach(([currency, variables]: [Currency, string[]]) => {
            variables.forEach((variable: string) => {
                this.currencyVariables.set(variable, currency);
            });
        });
    }

    action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message && room) {
            const context = this.findContext(message);
            if (context) {
                const bestMatch: BestMatch = findBestMatch(context, Array.from(this.currencyVariables.keys()));
                if (bestMatch.bestMatch.rating < 0.4) {
                    emitResponse(room, type, `Я не могу найти информацию по Вашему запросу`);
                    return;
                }
                const currency: Currency | undefined = this.currencyVariables.get(bestMatch.bestMatch.target);
                if (currency) {
                    axios.get(encodeURI(`https://currate.ru/api/?get=rates&pairs=${currency}&key=4e9e7c195db24a2f640a3381b16a0f03`))
                        .then((res: AxiosResponse) => {
                            if (res.data.data[currency]) {
                                emitResponse(room, type, `Курс покупки ${currencyResponseName[currency]} составляет ${res.data.data[currency]} Российских рублей`);
                            } else {
                                emitResponse(room, type, `Я не могу найти информацию по Вашему запросу`);
                            }
                        })
                        .catch((e) => {
                            emitResponse(room, type, `Я не могу найти информацию по Вашему запросу`);
                        });
                } else {
                    emitResponse(room, type, `Я не могу найти такую валюту`);
                }
            } else {
                emitResponse(room, type, `Пожалуйста, спросите курс еще раз, уточнив валюту`);
            }
        }
    }
}
