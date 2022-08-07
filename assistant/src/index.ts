import { AssistantAI } from "./core/assistant";
import { actions } from "./actions";
import { io } from "socket.io-client";
import { MeetingCore } from "./core/meeting/meeting.core";
import { config } from "./config";
import { RoomCore } from "./core/meeting/room.core";
import { RoomPrev } from "./core/meeting/models/room.model";
import { Message } from "./core/meeting/models/message.model";
import { ProtocolToClient } from "./core/meeting/protocol";

const assistant: AssistantAI = new AssistantAI(actions);

const rooms: Map<string, RoomCore> = new Map([]);

const socket = io(config.socketAPI, {
    secure:true,
    reconnection: true,
    rejectUnauthorized : false
});

const meetingCore = new MeetingCore(socket);
meetingCore.init();

socket.on(ProtocolToClient.INVITED_ASSISTANT, (roomId: string, botId: string) => {
    setTimeout(() => {
        const room: RoomPrev | undefined = meetingCore.roomsValue.find((room: RoomPrev) => room.id === roomId);
        if (room && room.membersCount > 0) {
            setTimeout(() => {
                const newRoom: RoomCore | undefined = connectToRoom(room, meetingCore, botId);
                if (newRoom) {
                    rooms.set(roomId, newRoom);
                }
            }, 1000);
        }
    }, 3000);
});

socket.on(ProtocolToClient.KICKED_ASSISTANT, (roomId: string) => {
    const room: RoomCore | undefined = rooms.get(roomId);
    if (room) {
        room.destroy(false);
        rooms.delete(roomId);
    }
});

function connectToRoom(room: RoomPrev, meetingCore: MeetingCore, botId: string): RoomCore | undefined {
    if (room) {
        const roomCore = new RoomCore(meetingCore, {
            userId: botId,
            name: config.name[0],
            avatar: config.avatar,
        });
        roomCore.init(room.id);
        roomCore.message$.subscribe((res: Message[]) => {
            const newMessage = res.sort((a: Message, b: Message) => b.sendTime - a.sendTime)[0];
            if (newMessage && !newMessage.text.toLowerCase().includes('сфера присоединился') && (newMessage.text.toLowerCase().includes('сфера') || newMessage.text.toLowerCase().includes('sfera'))) {
                assistant.request(roomCore, 'text', newMessage.text.toLowerCase().replace('сфера', '').replace('sfera', ''));
            }
        });
        meetingCore.serverEvents.fromUserVoice.subscribe((newMessage: string) => {
            console.log('[Assistant][Socket] Speech: ', newMessage);
            if (newMessage && !newMessage.toLowerCase().includes('сфера присоединился') && (newMessage.toLowerCase().includes('сфера') || newMessage.toLowerCase().includes('sfera'))) {
                assistant.request(roomCore, 'voice', newMessage.toLowerCase().replace('сфера', '').replace('sfera', ''));
            }
        });
        return roomCore;
    }
    return undefined;
}

socket.on("connect", () => {
    console.log(`[Assistant][Socket] Connected to webrtc with id: ${socket.id}`);
});
