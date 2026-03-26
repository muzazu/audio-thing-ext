export type ExtEvent =
  | { type: 'SET_VOLUME'; gain: number }
  | { type: 'REMOVE_ENTRY' };
