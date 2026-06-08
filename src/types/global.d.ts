/* eslint-disable no-var */
import { Server } from 'socket.io';

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  } | undefined;
}

declare module 'express' {
  interface Application {
    set(key: 'io', value: Server): this;
    get(key: 'io'): Server;
  }
}

export {};
