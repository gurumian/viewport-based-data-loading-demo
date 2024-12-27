import { Server, Socket } from 'socket.io';

interface ServerToClientEvents {
  notification: (message: string) => void;
}

interface ClientToServerEvents {
  join: (userId: string) => void;
  sendNotification: (data: { userId: string; message: string }) => void;
  setState: (state: 'available' | 'busy') => void;
}

interface InterServerEvents {
  // Define any inter-server events here if needed
}

interface SocketData {
  // Define any custom socket data here if needed
  uid: string,
  state: 'available' | 'busy';
}

// a user > to server
// Assumption: 
// This channel is for notification to a user.
// When A user clicks the 'start' button, a session will be created.
export class UserNotification {
  // users: string[] = [];
  // users: Set<string> = new Set();
  private io: any;
  private stopped: boolean = false;

  constructor(http: any) {
    this.io = require('socket.io')(http, {
      cors: {
        origin: "*", // Replace with your client's origin in production
        methods: ["GET", "POST"]
      }
    });
  }

  get numofusers(): number {
    // return this.users.size;
    return this.io.sockets.sockets.size;
  }

  get available(): string[] {
    return Array.from(this.io.sockets.sockets.values())
      .filter((socket) => (socket as Socket<{}, {}, {}, SocketData>).data.state === 'available')
      .map((socket) => (socket as Socket<{}, {}, {}, SocketData>).data.uid);
  }

  get numofAvailable(): number {
    return Array.from(this.io.sockets.sockets.values())
      .filter((socket) => (socket as Socket<{}, {}, {}, SocketData>).data.state === 'available')
      .length;
  }

  async init() {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
      console.log(`A user connected`);
      // const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        console.error('Connection attempt without userId');
        socket.disconnect();
        return;
      }
      // console.log(token);
      console.log(`userId: ${userId}`);
      socket.data.uid = userId;
      socket.data.state = 'available'; // Default state
      socket.join(userId);

      // TODO: updated it to use Set instead of array
      // this.users.add(userId);
      // this.users = shuffle(this.users); // ?
      // console.log(this.users);
      this.io.to(userId).emit('notification', {
        "message": "joined"
      });

      // Notify *all* connected clients that a user joined
      this.io.emit('notification', {
        message: 'enter',
        userId: userId,
      });

      // Join a room based on user ID
      socket.on('join', (userId: string) => {
        console.log(`joined! ${userId}`);
        // socket.data.uid = userId;
      });
  

      socket.on('setState', (state: 'available' | 'busy') => {
        socket.data.state = state;
        console.log(`User ${socket.data.uid} state updated to ${state}`);
        this.io.emit('notification', {
          message: 'state',
          userId: socket.data.uid,
          state: state
        });
      });

      // Example: Send a notification to a specific user
      socket.on('sendNotification', (data: { userId: string; message: string }) => {
        this.io.to(data.userId).emit('notification', data.message);
      });
  
      socket.on('disconnect', () => {
        console.log(`User ${socket.data.uid} disconnected`);
        
        // this.users.delete(socket.data.uid);
        // console.log(this.users);

        // Broadcast to everyone that this user disconnected
        this.io.emit('notification', {
          message: 'leave',
          userId: socket.data.uid,
        });
      });
    });

    // this.monitor();
  }

  notify(uid: string, message: any) {
    this.io.to(uid).emit('notification', message);
  }

  private stop(): void {
    if (this.stopped) {
      console.log('already stopped');
    }
    
    this.stopped = true;
    // Object.values(this.rooms).forEach(room => {
    //   if (room) {
    //     // this.stopForwardVideoRoom(room, this.conn);
    //     // this.stopStreaming(room, this.conn);
    //   }
    // });
  }

  // private monitor(): void {

  //   if (!this.stopped) {
  //     // console.log('monitor')
  //     setTimeout(() => {
  //       this.monitor();
  //     }, 5000);
  //   }
  // }

  talk(users: string[], room: string) {
    console.log('talk!!!!!!!!!!!!!!!!!!!!')
    console.log(users);
    console.log(room);
    users.forEach((user) => {
      this.notify(user, {
        "message": "talk",
        "room": room
      });
    })
    
    console.log('talk before!!!!!!!!!!!!!!!!!!!!')
    console.log(users);
    // this.users = this.users.filter(item => !users.includes(item));
    // console.log('talk after!!!!!!!!!!!!!!!!!!!!')
    // console.log(this.users);
  }
  // invite(users: string[], room: string) {
  //   users.forEach((user) => {
  //     this.notify(user, {
  //       "message": "invite",
  //       "room": room
  //     });
  //   })
    
  //   console.log('invite before!!!!!!!!!!!!!!!!!!!!')
  //   console.log(this.users);
  //   this.users = this.users.filter(item => !users.includes(item));
  //   console.log('invite after!!!!!!!!!!!!!!!!!!!!')
  //   console.log(this.users);
  // }

  dispose() {
    this.stop();
  }
}