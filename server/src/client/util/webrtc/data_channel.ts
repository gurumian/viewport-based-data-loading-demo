import { Janus } from 'janus-gateway';
import { Message } from "./message";
import { JoinMessage } from "./join_message";
import { JanusChannel } from "./janus_channel";

var opaqueId = "textroom-"+Janus.randomString(12);

export class DataChannel extends JanusChannel {

  // janus: any | null = null
  // plugin: any = null

  transactions: any = {}
  participants: any = {}

  // rid?: string = undefined

  constructor(public server: string, public iceServers: RTCIceServer[], public uid: string) {
    super(server, iceServers, uid)
  }

  init(): Promise<void> {
    return super.init()
  }

  attach(): Promise<any> {
    return new Promise((res, rej) => {
      this.janus.attach({
        plugin: "janus.plugin.textroom",
        opaqueId: opaqueId,
        iceServers: this.iceServers,
        success: (pluginHandle: any) => {
          this.plugin = pluginHandle;
          Janus.log("Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
          res(this.plugin)
        },
        error: (error: any) => {
          console.error("Error connecting to Janus", error);
          rej(error)
        },
        iceState: function(state: any) {
          Janus.log("ICE state changed to " + state);
        },
        mediaState: (medium: any, on: any) => {
          Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
          this.emit('mediaState', on);
        },
        webrtcState: (on: any) => {
          Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          if(on) {
            this.emit('setup', on)
          }
        },
        onmessage: this.onmessage.bind(this),
        ondataopen: this.ondataopen.bind(this),
        ondata: this.ondata.bind(this),
        oncleanup: this.oncleanup.bind(this)
      })
    })
  }

  async setup() {
    return this.plugin.send({ message: {
        request: "setup"
      }
    })
  }

  private onmessage(msg: any, jsep: any) {
    console.log(`${JSON.stringify(msg)}`)
    
    if(msg["error"]) {
      // bootbox.alert(msg["error"]);
      this.emit('error', msg.error)
    }

    if(jsep) {
      console.log(`${JSON.stringify(jsep)}`)

      this.plugin.createAnswer({
        jsep: jsep,
        // We only use datachannels
        tracks: [
          { type: 'data' }
        ],
        success: (jsep: any) => {
          Janus.debug("Got SDP!", jsep);
          let body = { request: "ack" };
          this.plugin.send({ message: body, jsep: jsep });
        },
        error: (error: string) => {
          Janus.error("WebRTC error:", error);
          // bootbox.alert("WebRTC error... " + error.message);
        }
      });
    }
  }

  private ondataopen(label: any, protocol: any) {
    Janus.log("The DataChannel is available!");
    console.log(`label: ${label}`)
    console.log(`protocol: ${protocol}`)
    // Prompt for a display name to join the default room
    // $('#roomjoin').removeClass('hide');
    // $('#registernow').removeClass('hide');
    // $('#register').click(registerUsername);
    // $('#username').focus();
  }

  private ondata(data: any) {
    Janus.log("We got data from the DataChannel!", data);
    // //~ $('#datarecv').val(data);
    let json = JSON.parse(data);
    let transaction = json["transaction"];
    if(this.transactions[transaction]) {
      // Someone was waiting for this
      this.transactions[transaction](json);
      delete this.transactions[transaction];
      return;
    }
    let what = json["textroom"];
    console.log(`what: ${what}`)
    if(what === "message") {
      // Incoming message: public or private?
      // let msg = Message.escapeXmlTags(json["text"]);
      // let from = json["from"];
      // let dateString = Message.getDateString(json["date"]);
      // let whisper = json["whisper"];
      // let sender = this.participants[from] ? this.participants[from] : Message.escapeXmlTags(json["display"]);
      // console.log(`sender: ${sender}`)
      // console.log(`message: ${msg}`)
      // console.log(`date: ${dateString}`)
      // console.log(`from: ${from}`)
      // if(whisper === true) {
      //   // Private message
      //   // $('#chatroom').append('<p style="color: purple;">[' + dateString + '] <b>[whisper from ' + sender + ']</b> ' + msg);
      //   // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
      //   console.log('whisper')
      // }
      // else {
      //   console.log('not whisper')
      //   // Public message
      //   // $('#chatroom').append('<p>[' + dateString + '] <b>' + sender + ':</b> ' + msg);
      //   // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
      // }

      let message = new Message(json)
      // message.sender = sender
      // message.sender = this.participants[from] ? this.participants[from] : Message.escapeXmlTags(json["display"]);

      this.emit("message", message)
    }
    else if(what === "announcement") {
      // Room announcement
      let msg = Message.escapeXmlTags(json["text"]);
      let dateString = Message.getDateString(json["date"]);
      console.log(msg)
      console.log(dateString)
      // $('#chatroom').append('<p style="color: purple;">[' + dateString + '] <i>' + msg + '</i>');
      // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
    }
    else if(what === "join") {
      // Somebody joined
      this.emit('join-message', new JoinMessage(json))
      // let username = json["username"];
      // let display = json["display"];
      // this.participants[username] = Message.escapeXmlTags(display ? display : username);
      // // if(username !== this.uid && $('#rp' + username).length === 0) {
      // if(username !== this.uid) {
      //   // Add to the participants list
      //   // $('#list').append('<li id="rp' + username + '" class="list-group-item">' + participants[username] + '</li>');
      //   // $('#rp' + username).css('cursor', 'pointer').click(function() {
      //   //   let username = $(this).attr('id').split("rp")[1];
      //   //   sendPrivateMsg(username);
      //   // });
      // }
      // $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' joined</i></p>');
      // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
    }
    else if(what === "list") {
      // Somebody joined
      let username = json["username"];
      let display = json["display"];
      this.participants[username] = Message.escapeXmlTags(display ? display : username);
      // if(username !== this.uid && $('#rp' + username).length === 0) {
      if(username !== this.uid) {
        // Add to the participants list
        // $('#list').append('<li id="rp' + username + '" class="list-group-item">' + participants[username] + '</li>');
        // $('#rp' + username).css('cursor', 'pointer').click(function() {
        //   let username = $(this).attr('id').split("rp")[1];
        //   sendPrivateMsg(username);
        // });
      }
      // $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' joined</i></p>');
      // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
    }
    else if(what === "leave") {
      // Somebody left
      let username = json["username"];
      // $('#rp' + username).remove();
      // $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' left</i></p>');
      // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
      delete this.participants[username];
      this.emit('leave', username);
    } 
    else if(what === "kicked") {
      // Somebody was kicked
      let username = json["username"];
      // $('#rp' + username).remove();
      // $('#chatroom').append('<p style="color: green;">[' + getDateString() + '] <i>' + participants[username] + ' was kicked from the room</i></p>');
      // $('#chatroom').get(0).scrollTop = $('#chatroom').get(0).scrollHeight;
      delete this.participants[username];
      if(username === this.uid) {
        // bootbox.alert("You have been kicked from the room", function() {
        //   window.location.reload();
        // });
      }
    } 
    else if(what === "destroyed") {
      if(json["room"] !== this.rid)
        return;
      // Room was destroyed, goodbye!
      Janus.warn("The room has been destroyed!");
      this.emit('destroyed');
      // bootbox.alert("The room has been destroyed", function() {
      //   window.location.reload();
      // });
    }
    else {
      // console.log(`unhandled ${what}`)
    }
  }

  dispose() {
    if(this.plugin) {
      this.plugin.detach();
      this.plugin = null;
    }
    super.dispose()
    console.log('DataChannel::diposed!');
  }

  private oncleanup() {
    Janus.log(" ::: Got a cleanup notification :::");
    // $('#datasend').attr('disabled', true);
  }

  request(register: {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const response = this.plugin.data({
        text: JSON.stringify(register),
        error: function(reason: any) {
          console.log(reason);
          reject(reason);
          // bootbox.alert(reason);
          // $('#username').removeAttr('disabled').val("");
          // $('#register').removeAttr('disabled').click(registerUsername);
        }
      });

      resolve(response);
    });
  }

  join(roomId: number): Promise<any> {
    console.log(`${roomId}`)
    this.rid = roomId
    let transaction = Janus.randomString(12);
    let register = {
			textroom: "join",
			transaction: transaction,
			room: this.rid,
			username: this.uid,
			display: 'user'
		};

    return this.request(register)
  }

  create(roomId: number): Promise<any> {
    console.log('create')
    let transaction = Janus.randomString(12);
    let register = {
			textroom: "create",
      room: roomId,
      description: `new text room ${roomId}`,
      // secret: "mysecret",
      // pin: "1234",
      // is_private: false,
      // history: 50
			transaction: transaction,
		};

    return this.request(register)
  }

  list(): Promise<[]> {
    return new Promise((res, rej) => {
      console.log('list')
      let transaction = Janus.randomString(12);
      let register = {
        textroom: "list",
        transaction: transaction,
      };
  
      this.transactions[transaction] = (response: any) => {
        console.log(response)
        if(response["textroom"] === "error") {
          if(response["error_code"] === 417) {
            console.log(`error code`)
          }
          else {
          }
          rej(response["error_code"])
        }
        else if(response["textroom"] === "success") {
          // res()
          res(response["list"])
        }
      }
      this.request(register)
    });
  }

  destroy(roomId?: number): Promise<any> {
    roomId = roomId || this.rid
    console.log('delete')
    let transaction = Janus.randomString(12);
    let register = {
			textroom: "destroy",
      room: roomId,
			transaction: transaction,
		};

    return this.request(register)
  }


  leave(roomId?: number): Promise<any> {
    roomId = roomId || this.rid
    console.log('leave')
    let transaction = Janus.randomString(12);
    let register = {
			textroom: "leave",
      room: roomId,
			transaction: transaction,
		};
    return this.request(register)
  }

  message(message: string): Promise<any> {
    let roomId = this.rid

    let transaction = Janus.randomString(12);
    let register = {
			textroom: "message",
      room: roomId,
			transaction: transaction,
      text: message
//       "to" : "<username to send the message to; optional, only needed in case of private messages>",
//       "tos" : "<array of usernames to send the message to; optional, only needed in case of private messages>",
//       "text" : "<content of the message to send, as a string>",
//       "ack" : <true|false, whether the sender wants an ack for the sent message(s); optional, true by default>

    };
    return this.request(register)
  }
}
