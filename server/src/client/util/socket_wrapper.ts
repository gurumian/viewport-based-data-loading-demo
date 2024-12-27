import { EventEmitter } from "events";
import {io, Socket} from 'socket.io-client';

export class SocketWrapper extends EventEmitter {

  socket?: Socket;

  constructor(public server: string) {
    super();
  }

  init(): Promise<void> {
    return new Promise((res, rej) => {
      this.socket = io(this.server);
      this.socket.on('connect', () => {
        console.log('Connected to server');
        res();
      });
      
      this.socket.on('message', (data) => {
        console.log('Received message:', data);
        this.emit('message', data);
      });

      this.socket.on('notification', (data) => {
        console.log(`notification: ${JSON.stringify(data)}`);

        if(Object.hasOwn(data, 'message')) {
          if(data.message === 'invite') {
            this.emit('invited', data.room);
          }
        }
      })
      
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        rej();
      });
      // Sending a message
      this.socket.emit('message', 'Hello, server!');
    })
  }

  join(id: string) {
    this.socket?.emit('join', id);
  }

  dispose() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}