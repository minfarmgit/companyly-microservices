export interface Config {
    acceptCommandRating: number;
    acceptContextRating: number;
    trainDataPath: string;
    trainModelFolder: string;
    trainEpochs: number;
    modelId: string;
    socketAPI: string;
    socketSecure: boolean;
    avatar: string;
    name: string[];
    speech?: {
        rate: number,
        pitch: number,
        volume: number,
    };
}
