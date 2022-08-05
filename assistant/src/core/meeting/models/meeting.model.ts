export enum MeetingEvents {
  memberJoined = 'memberJoined',
  memberLeft = 'memberLeft',
  messagesList = 'messagesList',
  roomsList = 'roomsList',
  roomData = 'roomData',
  serverMessage = 'serverMessage',
  fromUserVoice = 'fromUserVoice',
}

export type WebStreams = Record<string, MediaStream>;
