import { Action } from "./core/action";
import { AiAction } from "./core/ai/ai.action";
import { CreateRoomAction } from "./actions/createRoom/createRoom.action";
import { GetWeatherAction } from "./actions/getWeather/getWeather.action";
import { ExchangeRatesAction } from "./actions/exchangeRates/exchangeRates.action";
import { LeaveRoomAction } from "./actions/leaveRoom/leaveRoom.action";
import { GetNewsAction } from "./actions/getNews/getNews.action";
import { InviteMemberAction } from "./actions/inviteMember/inviteMember.action";

export const actions: typeof Action[] = [
    AiAction,
    CreateRoomAction,
    GetWeatherAction,
    ExchangeRatesAction,
    LeaveRoomAction,
    GetNewsAction,
    InviteMemberAction,
];
