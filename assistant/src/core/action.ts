import { findBestMatch } from 'string-similarity';
import { config } from "../config";
import { RoomCore } from "./meeting/room.core";
import { CommunicationType } from "./models/communicationType.model";

interface MatchResult { match: string; rate: number };

export class Action {
    public code!: string;
    public triggers?: string[];
    public action(room: RoomCore, type: CommunicationType, message?: string, data?: any): void {};
    public contextTriggers?: string[];

    protected findContext(message: string): string | undefined {
        if (this.contextTriggers?.length) {
            const contextVariables: string[] = [];
            const partsArray: string[] = message.split(' ');
            partsArray.forEach((part: string, partIndex: number) => {
                for (let i = partIndex + 1; i <= partsArray.length; i++) {
                    contextVariables.push(partsArray.slice(partIndex, i).join(' '));
                }
            });
            const result: MatchResult = this.contextTriggers.map((trigger: string) => {
                const bestMatch = findBestMatch(trigger, contextVariables).bestMatch;
                return {
                    match: bestMatch.target,
                    rate: bestMatch.rating,
                }
            }).sort((a: MatchResult, b: MatchResult) => b.rate - a.rate)[0];
            return result.rate > config.acceptContextRating ? message.split(result.match)[1] : undefined;
        }
    }
}
