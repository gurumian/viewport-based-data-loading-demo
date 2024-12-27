import { DataChannel } from './util/webrtc/data_channel';
import { Message } from './util/webrtc/message';
import { JoinMessage } from './util/webrtc/join_message';
import { AudioChannel } from './util/webrtc/audio_channel';
import { Janus } from 'janus-gateway';
import { server, iceServer } from './config';

// const server = 'https://janus.toktoktalk.com/janus'
// const iceServer: RTCIceServer = {
//   urls: 'stun:stun.l.google.com:19302'
// };

var dataChannel: DataChannel | null = null;
var audioChannel: AudioChannel | null = null;

export function startDataChannel(room: number, uid: string) {
  console.log(`typeof room: ${typeof room}`);
  if(typeof room === 'string') {
    room = parseInt(room);
  }

  console.log(`starting data channel for room ${room} with uid ${uid}`)
  dataChannel = new DataChannel(server, [iceServer], uid)
  dataChannel.on('message', (message: Message) => {
    // message from the server
    console.log(message.message);
    if(!message.message) {
      console.error('message is nil');
      return;
    }

    const msg = JSON.parse(message.message);
    if(msg) {
      if(msg.type == 'text') {
        console.log(`onDataChannelMessage ${msg.data} ${uid == message.from}`);
        (window as any).flutter_inappwebview.callHandler('onDataChannelMessage', 
          msg.data,
          uid == message.from // is self
        );
        // this.chatMessages?.addMessage(msg.data, this.uid == message.from, message.sender)

        // // good place to hook. i.e. link
        // let matches = this.detectURLs(msg.data)
        // if(matches && matches.length > 0) {
        //   matches.forEach(async (match) => {
        //     console.log(match)
        //     // let res = await this.getURLPreview(text)
        //     let res = await this.restClient?.preview(match)
        //     console.log(`preview: ${JSON.stringify(res)}`)
        //     console.log(res)
        //     // TODO:
        //     this.chatMessages?.addPreview(match, res, this.uid == message.from, message.sender)
        //   })
        // }
      }
      else {
        // TODO: image, motion data...
      }
    }
  })
  dataChannel.on('setup', (on: boolean) => {
    if(on) {
      console.log(`data channel join ${room}`)
      dataChannel?.join(room);
    }
  });
  dataChannel.on('destroyed', () => {
    // this.leave();
    // room destroyed
    (window as any).flutter_inappwebview.callHandler('onDataChannelLeave');
    console.log('leave!');
    console.log('destroyed!');
  });
  dataChannel.on('leave', () => {
    // this.leave();
    (window as any).flutter_inappwebview.callHandler('onDataChannelLeave');
    console.log('leave!');
  });
  dataChannel.on('join-message', (message: JoinMessage) => {
    console.log(message.uid);
    // if(message.uid !== this.uid) {
    //   this.chatMessages?.addMessage(`${message.uid} has joined`)
    // }
  })

  dataChannel.init()
  .then(() => {
    return dataChannel?.attach();
  })
  .then(() => {
    console.log('attached!')
    return dataChannel?.setup();
  })
  .catch(() => {
    console.log('failed to attach!');
  })
  .catch((error: any) => {
    console.error(error);
    // TODO
  });
}

export function stopDataChannel() {
  console.log('stopping data channel');
  dataChannel?.dispose();
  dataChannel = null;

  (window as any).flutter_inappwebview.callHandler('myHandler', 'Hello from JS')
  .then(function(result: any) {
    console.log(result.response);
  });
}

export function sendMessage(message: string) {
  console.log(`sending message: ${message}`);
  dataChannel?.message(JSON.stringify({
    type: 'text',
    data: message
  }));
}


export function startAudioChannel(microphone: boolean, headset: boolean, room: number, uid: string) {
  console.log(`starting audio channel for room ${room} with uid ${uid}`);
  if(typeof room === 'string') {
    room = parseInt(room);
  }

  stopAudioChannel();
  
  if(!(microphone || headset)){
    return;
  }

  audioChannel = new AudioChannel(server, [iceServer], uid, microphone, headset);
  audioChannel.on('onremotestream', (stream) => {
    let audio = document.getElementById('roomaudio'); // TODO:
    Janus.attachMediaStream(audio, stream);
  })
  audioChannel.init()
  .then(() => {
    return audioChannel?.attach();
  })
  .then(() => {
    console.log('attached!')
    // let roomId = "1234" // TODO
    if(!room) {
      console.error(`this room ${room}`);
      return;
    }
    audioChannel?.join(room);
  })
}

export function stopAudioChannel() {
  console.log('stopping audio channel');
  audioChannel?.dispose();
  audioChannel = null;
}

export function startVideoChannel() {
  console.log('starting video channel');
}

export function stopVideoChannel() {
  console.log('stopping video channel');
}
