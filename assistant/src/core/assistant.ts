import { findBestMatch } from 'string-similarity';
import { Action } from "./action";
import { config } from "../config";
import { RoomCore } from "./meeting/room.core";
import { CommunicationType } from "./models/communicationType.model";

export class AssistantAI {

    public commandsList: Map<string, string> = new Map<string, string>();
    public actionsList: Map<string, Action> = new Map<string, Action>();

    constructor(actions: typeof Action[]) {
        actions.forEach((action: typeof Action) => {
            const instance: Action = new action();
            this.actionsList.set(instance.code, instance);
            if (instance.triggers) {
                instance.triggers.forEach((trigger: string) => {
                    this.commandsList.set(trigger, instance.code);
                });
            }
        });
    }

    public request(room: RoomCore, type: CommunicationType, message: string): void {
        const bestMatch = findBestMatch(message, Array.from(this.commandsList.keys())).bestMatch;
        if (bestMatch.rating > config.acceptCommandRating) {
            const code: string | undefined = this.commandsList.get(bestMatch.target);
            if (code) {
                this.actionsList.get(code)?.action(room, type, message);
            } else {
                this.runAi(room, type, message);
            }
        } else {
            this.runAi(room, type, message);
        }
    }

    private runAi(room: RoomCore, type: CommunicationType, message?: string): void {
        this.actionsList.get('ai')?.action(room, type, message);
    }
}
