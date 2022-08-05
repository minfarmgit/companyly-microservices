export interface JoinMemberDto {
  mainPeerId: string;
  userId: string;
  name: string;
  avatar: string;
  bot?: boolean;
  speech?: {
    rate: number,
    pitch: number,
    volume: number,
  };
}
