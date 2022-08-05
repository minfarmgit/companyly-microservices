// @ts-ignore
import { Harker } from "hark";

export interface MemberServer {
  mainPeerId: string;
  sharePeerId?: string;
  userId: string;
  socketId: string;
  name: string;
  avatar: string;
  camState: boolean;
  micState: boolean;
  screenShare: boolean;
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  bot?: boolean;
  speech?: {
    rate: number,
    pitch: number,
    volume: number,
  };
}

export interface MemberClient extends MemberServer {
  me?: boolean;
  harker?: Harker;
  mainStream?: MediaStream;
  shareStream?: MediaStream;
}
