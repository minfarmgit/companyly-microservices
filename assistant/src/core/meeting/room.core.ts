import { MeetingCore } from "./meeting.core";
import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { WebStreams } from "./models/meeting.model";
import { RoomObject } from "./models/room.model";
import { map, takeUntil } from "rxjs/operators";
import { MemberClient, MemberServer } from "./models/member.model";
import { JoinMemberDto } from "./dto/join-member.dto";
import { MemberJoinedDto } from "./dto/member-joined.dto";
import { ServerMessage, ServerMessageTypes } from "./protocol";
import { ServerMessageDisconnectedDto } from "./dto/server-message-disconnected.dto";
import { Message } from "./models/message.model";
import { NewMessageDto } from "./dto/new-message.dto";
import { ServerMessageConnectedDto } from "./dto/server-message-connected.dto";
import { ServerMessageRequestKeyDto } from "./dto/server-message-request-key.dto";
import { config } from "../../config";
import { UserProfile } from "./models/profile.model";
import { UpdateRoomDto } from "./dto/update-room.dto";

const MAIN_SPEAKER_DELAY = 3000;
export class RoomCore {

  private meetingCore: MeetingCore;
  private destroyed = new Subject<any>();
  private roomId!: string;
  private key?: string;
  private userProfile: UserProfile;

  private spinnerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public spinner$:  Observable<boolean> = this.spinnerSubject.asObservable();

  private streamsSubject: BehaviorSubject<WebStreams> = new BehaviorSubject<WebStreams>({});
  public streams$: Observable<WebStreams> = this.streamsSubject.asObservable();

  private messagesSubject: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>([]);
  public  message$: Observable<Message[]> = this.messagesSubject.asObservable();

  private roomSubject: BehaviorSubject<RoomObject | null> = new BehaviorSubject<RoomObject | null>(null);
  public room$:  Observable<RoomObject | null> = this.roomSubject.asObservable();

  private roomMembers$: Observable<MemberServer[]> = this.room$.pipe(
    map((room: RoomObject | null) => room?.members || [])
  );

  public myStream!: MediaStream;
  public myVideoTrack?: MediaStreamTrack;
  public myAudioTrack?: MediaStreamTrack;

  private serverEventsCallbacks: Record<ServerMessageTypes, ((...args: any[]) => void) | undefined> = {
    ERROR: undefined,
    REQUEST_KEY: undefined,
    CONNECTED: undefined,
    DISCONNECTED: undefined,
    NOTIFICATION: undefined,
  };

  public speakersList: string[] = [];

  private mainSpeakerSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  public mainSpeaker$: Observable<string | undefined> = this.mainSpeakerSubject.asObservable();

  public members$: Observable<MemberClient[]> = combineLatest([
    this.roomMembers$,
    this.streams$
  ]).pipe(
    map((res: [MemberServer[], WebStreams]) => {
      const members = res[0];
      const streams = res[1];
      members.map((member: MemberServer): MemberClient => {
        const memberClient = member as MemberClient;
        const mainStream = streams[memberClient.mainPeerId];
        const shareStream = memberClient.sharePeerId ? streams[memberClient.sharePeerId] : undefined;
        if (mainStream) {
          memberClient.mainStream = mainStream;
        }
        if (shareStream) {
          memberClient.shareStream = shareStream;
        }
        if (memberClient.userId === this.userProfile.userId) {
          memberClient.me = true;
        }
        return memberClient;
      });
      return members;
    })
  );

  constructor(meetingCore: MeetingCore, userProfile: UserProfile) {
    this.meetingCore = meetingCore;
    this.userProfile = userProfile;
  }

  public get roomValue(): RoomObject | null {
    return this.roomSubject.value;
  }

  public get membersValue(): MemberClient[] {
    return this.roomSubject.value?.members || [];
  }

  private processServerMessages(): void {
    this.meetingCore.serverEvents.serverMessage.subscribe((res: string) => {
      try {
        const resObject: ServerMessage<any> = JSON.parse(res);
        switch (resObject.code) {
          case ServerMessageTypes.DISCONNECTED:
            const cbDisconnected = this.serverEventsCallbacks[ServerMessageTypes.DISCONNECTED];
            if (cbDisconnected) {
              cbDisconnected((resObject as ServerMessage<ServerMessageDisconnectedDto>).message);
            }
            break;
          case ServerMessageTypes.CONNECTED:
            const cbConnected = this.serverEventsCallbacks[ServerMessageTypes.CONNECTED];
            if (cbConnected) {
              cbConnected((resObject as ServerMessage<ServerMessageConnectedDto>).message);
            }
            break;
          case ServerMessageTypes.REQUEST_KEY:
            const cbRequestKey = this.serverEventsCallbacks[ServerMessageTypes.REQUEST_KEY];
            if (cbRequestKey) {
              cbRequestKey((resObject as ServerMessage<ServerMessageRequestKeyDto>).message);
            }
            break;
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  private addNewStream(stream: MediaStream, peerId: string): void {
    const value = this.streamsSubject.value;
    value[peerId] = stream;
    this.streamsSubject.next(value);
  }

  public init(roomId: string, key?: string): void {
    this.roomId = roomId;
    if (key) {
      this.key = key;
    }
    this.meetingCore.serverEvents.roomData.pipe(
      takeUntil(this.destroyed)
    ).subscribe((res: string) => {
      try {
        const roomObject: RoomObject = JSON.parse(res);
        this.roomSubject.next(roomObject);
      } catch (e) {
        console.log(e);
      }
    });
    this.meetingCore.serverEvents.messagesList.pipe(
      takeUntil(this.destroyed)
    ).subscribe((res: string) => {
      try {
        const messagesList: Message[] = JSON.parse(res);
        this.messagesSubject.next(messagesList);
      } catch (e) {
        console.log(e);
      }
    });
    this.connectRoom();
    this.processServerMessages();
  }

  public bindServerEventCallback(event: ServerMessageTypes, cb: (...args: any[]) => void): void {
    this.serverEventsCallbacks[event] = cb;
  }

  public sendMessage(text: string): void {
    const messageData: NewMessageDto = {
      userId: this.userProfile.userId,
      name: this.userProfile.name,
      avatar: this.userProfile.avatar,
      text,
    }
    this.meetingCore.newMessage(this.roomId, messageData);
  }

  public sendVoice(message: string): void {
    this.meetingCore.newVoice(this.roomId, message);
  }

  public connectRoom(): void {
    this.afterGetUserMedia();
  }

  private afterGetUserMedia(): void {
    if (this.roomId) {
      const registerMemberObject: JoinMemberDto = {
        mainPeerId: '',
        userId: this.userProfile.userId,
        name: this.userProfile.name,
        avatar: this.userProfile.avatar,
        bot: true,
        speech: {
          rate: config.speech.rate,
          pitch: config.speech.pitch,
          volume: config.speech.volume,
        },
      };
      if (this.key) {
        this.meetingCore.joinMember(this.roomId, registerMemberObject, this.key);
      } else {
        this.meetingCore.joinMember(this.roomId, registerMemberObject);
      }
      this.toggleMic();
      setTimeout(() => {
         this.sendVoice('Всем привет!');
      }, 5000);
      this.meetingCore.serverEvents.memberJoined.pipe(
        takeUntil(this.destroyed)
      ).subscribe((res: string) => {
        try {
          const resObject: MemberJoinedDto= JSON.parse(res);
          console.log('[Assistant][Socket] connected user: ', resObject.userId);
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  public updateInvites(data: string[]): void {
    const room = this.roomValue;
    if (room) {
      this.updateRoom({
        name: room.name,
        privateMode: room.privateMode,
        invites: data,
        moderators: room.moderators,
      })
    }
  }

  public updateRoom(data: UpdateRoomDto): void {
    this.meetingCore.updateRoom(this.roomId, data, this.userProfile);
  }

  public destroy(joinFromOtherDevice: boolean): void {
    if (this.roomValue && !joinFromOtherDevice) {
      this.meetingCore.leaveMember(this.roomValue.id, this.userProfile.userId);
    }
    this.myStream?.getTracks().forEach(function(track) {
      track.stop();
    });
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggleMic(): void {
    this.meetingCore.updateMember(this.roomId, {
      userId: this.userProfile.userId,
      micState: true,
    });
  }

  public toggleCam(): void {
    const lastVal = this.myVideoTrack?.enabled;
    if (this.myVideoTrack !== undefined) {
      this.myVideoTrack.enabled = !lastVal;
      this.meetingCore.updateMember(this.roomId, {
        userId: this.userProfile.userId,
        camState: !lastVal,
      });
    }
  }

  public setSpinnerState(state: boolean): void {
    this.spinnerSubject.next(state);
  }
}
