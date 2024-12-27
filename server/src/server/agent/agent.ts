'use strict'

// import { JanusClientSession } from './janus_client_session';
import { v4 as uuidv4 } from 'uuid';
// import { WebSocket } from 'ws';
// import WebSocket from 'ws';  // If WebSocket is the default export
// const WebSocketClient = require('websocket').client
const axios = require('axios');

import * as fs from 'fs';
import * as path from 'path';
// import { WebSocketClient } from './websocket_client';
// import { Session } from 'inspector/promises';

// const WebSocket = require('ws');
import { Session } from './session';
import { UniqueIdGenerator } from '../utils/unique_id_generator';
function genstr() {
  return Buffer.from(`${Math.random() * 10000000}`).toString('base64')
}

var roomId = 0;
function increaseRoomNumber(room: number, increment: number = 1): number {
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  const WRAP_AROUND_BITS = 32;

  let result = room + increment;

  if (result > MAX_SAFE_INTEGER) {
    // Wrap around using the lower 32 bits
    result = result % (2 ** WRAP_AROUND_BITS);
  }

  return result;
}

function generateUniqueID() {
  // return Date.now();
  roomId = increaseRoomNumber(roomId);
  return roomId;
}


interface Room {
  room: string;
  uuid?: number;
  participants?: Record<string, any>;
  prepared?: boolean;
}

interface Transaction {
  cmd: string;
  userdata?: Record<string, any>;
}

export class Agent {
  private transactions: Record<string, string | Transaction> = {};
  // private videoroomSession!: JanusClientSession;
  // private streamingSession!: JanusClientSession;
  private sessionId!: number;
  private rooms: Record<number, number> = {};
  private client?: WebSocket;
  private strmService!: string;
  // private manageServerAddr!: Record<string, any>;
  private stopped = false;
  private conn!: WebSocket;
  private uniqueIdGenerator: UniqueIdGenerator;
  // janusHost!: string;

  private textroomSession: Session | null = null;
  private audioroomSession: Session | null = null;
  private videoroomSession: Session | null = null;
  private warned: Map<number, number>;
  // const map = new Map<object, string>();

  
  // private janusRestUrl: string;
  // websocket?: WebSocketClient
  // constructor(public janusHost: string, public port: number, public strmServicePort: number, public manageServerAddr: Record<string, any>) {
  constructor(public janusUrl: string) {
    this.warned = new Map<number, number>();
    this.uniqueIdGenerator = new UniqueIdGenerator();
    // this.janusRestUrl = `${janusUrl}`;
    console.log(`janus url: ${this.janusUrl}`);
    this.textroomSession = new Session(this.janusUrl, 'janus.plugin.textroom');
    this.videoroomSession = new Session(this.janusUrl, 'janus.plugin.videoroom');
    this.audioroomSession = new Session(this.janusUrl, 'janus.plugin.audiobridge');
  }

  async init() {
    await this.textroomSession?.init();
    await this.textroomSession?.attach();
    
    await this.audioroomSession?.init();
    await this.audioroomSession?.attach();

    await this.videoroomSession?.init();
    await this.videoroomSession?.attach();

    this.monitor();
    return;
  }

  async createRoom() {
    // const room: number = generateUniqueID();
    const room: number = this.uniqueIdGenerator.nextId();
    console.log(`create room: ${room}`);
    const res_text = await this.textroomSession?.createRoom({
      room: room,
      description: `new text room ${room}`,
    });
    console.log(res_text);

    const res_audio = await this.audioroomSession?.createRoom({
      room: room,
      description: `new audio room ${room}`,
    });
    console.log(res_audio);

    const res_video = await this.videoroomSession?.createRoom({
      room: room,
      bitrate: 128000,
      videocodec: "vp8,vp9,h264",
      description: `new video room ${room}`,
    });
    console.log(res_video);
    return res_text.plugindata.data;
  }

  async destroyRoom(room: number) {
    console.log(`destroy room: ${room}`);
    try {
      await this.videoroomSession?.destroyRoom({
        room: room,
        description: `new video room ${room}`,
      });
    }
    catch(e) {
      console.error(e);
    }

    try { 
      await this.audioroomSession?.destroyRoom({
        room: room,
        description: `new audio room ${room}`,
      })
    }
    catch(e) {
      console.error(e);
    }

    try {
      const res = await this.textroomSession?.destroyRoom({
        room: room,
        description: `new text room ${room}`,
      });
      console.log(res);
      return res;
    }
    catch(e) {
      console.error(e);
    }

    return {
      // TODO:
    };
  }

  warn(room: number): number {
    console.log(`warn! ${room}`)
    let r = this.warned.get(room);
    if(r === undefined) {
      this.warned.set(room, 0);
      // console.log(`set!`)
      return 0;
    }

    console.log(`warning count: ${r}`);
    this.warned.set(room, r+1);
    return this.warned.get(room) || 0;
  }

  private async monitor() {
    let res = await this.textroomSession?.list();
    // console.log(res);
    if(res.textroom === 'success') {
      res.list.forEach(async (item: any) => {
        if(item.room === 1234) return;
        console.log(`[text] room-id: ${item.room} (${item.num_participants})`);
        if(item.num_participants < 2) {
          let count = this.warn(item.room);
          if(count > 5) {
            await this.destroyRoom(item.room);
          }
        }
      });
    }
    
    // this.textroomSession?.list().then((res: any) => {
    //   // console.log(res);
    //   if(res.textroom === 'success') {
    //     res.list.forEach((item: any) => {
    //       console.log(`[text] ${item.room} (${item.num_participants})`);
    //       if(item.room === '1234') return;
    //       if(item.num_participants < 2) {
    //         let count = this.warn(item.room);
    //         if(count > 5) {
    //           this.destroyRoom(item.room);
    //         }
    //       }
    //     });
    //   }
    // })


    // This is not mandatory.
    // Just listing.
    this.audioroomSession?.list().then((res: any) => {
      // console.log(res.list);
      // this.users = this.users.filter(item => !users.includes(item));
      res.list.forEach((item: any) => {
        if(item.room === 1234) return;
        console.log(`[audio] room-id: ${item.room} (${item.num_participants})`);
      })
    })

    this.videoroomSession?.list().then((res: any) => {
      // console.log(res.list);
      res.list.forEach((item: any) => {
        if(item.room === 1234) return;
        if(item.room === 5678) return;
        console.log(`[video] room-id: ${item.room} (${item.num_participants})`);
      })
    })

    if (!this.stopped) {
      // console.log('monitor')
      setTimeout(() => {
        this.monitor();
      }, 5000);
    }
  }

  private stop(): void {
    console.log('agent stop');
    if (this.stopped) {
      console.log('already stopped');
    }
    
    this.stopped = true;

    Object.values(this.rooms).forEach(room => {
      if (room) {
        // this.stopForwardVideoRoom(room, this.conn);
        // this.stopStreaming(room, this.conn);
      }
    });
  }

  dispose(): void {
    console.log('dispose');
    this.stop();
    if(this.textroomSession) {
      this.textroomSession?.dispose();
      this.textroomSession = null;
    }
    if(this.audioroomSession) {
      this.audioroomSession?.dispose();
      this.audioroomSession = null;
    }
    if(this.videoroomSession) {
      this.videoroomSession?.dispose();
      this.videoroomSession = null;
    }
  }
}
