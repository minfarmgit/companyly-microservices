import { Config } from "./core/models/config.model";
import { environment } from "./env";

export const config: Config = {
    acceptCommandRating: 0.3,
    acceptContextRating: 0.3,
    trainDataPath: './aiTraining/trains/trainingData.json',
    trainModelFolder: './aiTraining/models',
    trainEpochs: 5000,
    modelId: '1658618164076',
    socketAPI: `${environment.host}:${environment.webrtcSocketPort}`,
    socketSecure: environment.webrtcSocketSecure,
    avatar: 'https://cdn.dribbble.com/users/281679/screenshots/14897126/media/f52c47307ac2daa0c727b1840c41d5ab.png?compress=1&resize=1000x750&vertical=top',
    botToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsInVzZXJuYW1lIjoiYm90c2ZlcmEiLCJlbWFpbCI6InppZGlrc0BodWUuYnkiLCJkcm9wbGV0SWQiOjEsImlhdCI6MTY1OTg2Mjk1N30.WsrqSdBfjgYFbaEPYDYnBzurQdfL7VgzKkpad6qK554',
    name: [
        'Сфера',
        'Sfera',
    ],
    speech: {
        rate: 0.9,
        pitch: 0.3,
        volume: 1.5,
    }
}
