export interface ChatMessageDto {
    fromUserProfile: {
        name: string;
        avatar: string;
        userId: string;
    },
    toUserId: string;
    message: string;
}
