import { Action } from "../action";
import { bkLabs } from "./ai_core";
import { config } from "../../config";
import { RoomCore } from "../meeting/room.core";
import { CommunicationType } from "../models/communicationType.model";
import { emitResponse } from "../utils/emitResponse";
import { dev } from "../../env";

export class AiAction extends Action {

    model: any;

    code = 'ai';

    constructor() {
        super();
        this.loadModel().then(res => this.model = res);
    }

    async loadModel(): Promise<any> {
        return  await bkLabs.nlu.loadModel(
            `file://.${dev ? '/assistant' : '/dist'}/aiTraining/models/${config.modelId}/model.json`,
            `${process.cwd()}${dev ? '/assistant' : '/dist'}/aiTraining/models/${config.modelId}/model_metadata.json`,
            () => {
                console.log('loaded Model!');
            }
        );
    }

    async processMessage(room: RoomCore, type: CommunicationType, message: string): Promise<any> {
        const encodedSentence = await bkLabs.nlu.encodeText(message);
        const predictData = await this.model[0].predict(encodedSentence);
        const myReply = bkLabs.nlu.predictReply(predictData, this.model[1]);
        if (room) {
            emitResponse(room, type, myReply);
        }
    }

     action(room: RoomCore, type: CommunicationType, message?: string): void {
        if (message) {
            this.processMessage(room, type, message);
        }
    }

}



