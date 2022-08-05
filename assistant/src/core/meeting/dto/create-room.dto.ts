export interface CreateRoomDto {
  owner: string;
  name: string;
  privateMode: boolean;
  key?: string;
  invites: string[];
}
