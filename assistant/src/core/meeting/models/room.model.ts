import { MemberClient } from "./member.model";

export interface RoomObject {
  id: string;
  name: string;
  startTime: number | null;
  privateMode: boolean;
  key?: string;
  members: MemberClient[];
  invites: string[];
  moderators: string[];
}

export interface RoomPrev {
  id: string;
  name: string;
  startTime: number | null;
  privateMode: boolean;
  membersCount: number;
  invites: string[];
}
