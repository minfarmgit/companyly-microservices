export interface MeetingInviteDto {
    fromUserProfile: {
        name: string;
        avatar: string;
        userId: string;
    },
    toUserId: string;
    meeting: {
        name: string;
        id: string;
    },
}