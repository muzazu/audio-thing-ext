export type ExtEvent =
  | { type: 'SET_VOLUME'; gain: number }
  | { type: 'REMOVE_ENTRY' }
  | { type: 'GET_CHANNEL_URL' };

export interface GetChannelUrlResponse {
  channelUrl: string | undefined;
}
