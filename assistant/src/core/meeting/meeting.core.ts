import { Socket } from "socket.io-client";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { ProtocolToClient, ProtocolToServer } from "./protocol";
import { RoomPrev } from "./models/room.model";
import { MeetingEvents } from "./models/meeting.model";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinMemberDto } from "./dto/join-member.dto";
import { NewMessageDto } from "./dto/new-message.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";

export class MeetingCore {

  private socket: Socket;

  private roomsSubject: BehaviorSubject<RoomPrev[]> = new BehaviorSubject<RoomPrev[]>([]);
  public rooms$: Observable<RoomPrev[]> = this.roomsSubject.asObservable();

  public serverEvents: Record<MeetingEvents, Observable<any>>;

  constructor(socket: Socket) {
    this.socket = socket;
        this.serverEvents = {
      memberJoined: this.fromEvent(ProtocolToClient.MEMBER_JOINED),
      memberLeft: this.fromEvent(ProtocolToClient.MEMBER_LEFT),
      messagesList: this.fromEvent(ProtocolToClient.MESSAGES_LIST),
      roomsList: this.fromEvent(ProtocolToClient.ROOMS_LIST),
      roomData: this.fromEvent(ProtocolToClient.ROOM_DATA),
      serverMessage: this.fromEvent(ProtocolToClient.SERVER_MESSAGE),
      fromUserVoice: this.fromEvent(ProtocolToClient.FROM_USER_VOICE),
    }
  }

  init(): void {
    this.getRoomsList();
  }

  private fromEvent(protocol: string): Observable<any> {
    const subject: Subject<any> = new Subject<any>();
    const observable: Observable<any> = subject.asObservable();
    this.socket.on(protocol, (data) => {
      subject.next(data);
    })
    return observable;
  }

  private getRoomsList(): void {
    this.serverEvents.roomsList.subscribe((res: string) => {
      try {
        this.roomsSubject.next(JSON.parse(res));
      } catch (e) {
        console.log(e);
      }
    });
  }

  public get roomsValue(): RoomPrev[] {
    return this.roomsSubject.value;
  }

  public createRoom(data: CreateRoomDto): void {
    this.socket.emit(ProtocolToServer.CREATE_ROOM, JSON.stringify(data));
  }

  public joinMember(roomId: string, data: JoinMemberDto, key?: string): void {
    if (key) {
      this.socket.emit(ProtocolToServer.JOIN_MEMBER, roomId, JSON.stringify(data), key);
    } else {
      this.socket.emit(ProtocolToServer.JOIN_MEMBER, roomId, JSON.stringify(data));
    }
  }

  public leaveMember(roomId: string, userId: string): void {
    this.socket.emit(ProtocolToServer.LEAVE_MEMBER, roomId, userId);
  }

  public updateMember(roomId: string, data: UpdateMemberDto): void {
    this.socket.emit(ProtocolToServer.UPDATE_MEMBER, roomId, JSON.stringify(data));
  }

  public newMessage(roomId: string, data: NewMessageDto): void {
    this.socket.emit(ProtocolToServer.NEW_MESSAGE, JSON.stringify(data), roomId);
  }

  public newVoice(roomId: string, message: string): void {
    this.socket.emit(ProtocolToServer.ASSISTANT_NEW_VOICE, roomId, message);
  }

}
