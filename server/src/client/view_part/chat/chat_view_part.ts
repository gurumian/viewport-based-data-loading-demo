// import * as THREE from 'three'

import { Control } from '../../control';
import { ViewPart } from '../../view_part';
import { InputPanel } from './input_panel';
// import { Janus } from 'janus-gateway';
import { v4 as uuidv4 } from 'uuid'
import { ChatMessages } from './chat_messages';
import { Message } from '../../util/webrtc/message';
import { JoinMessage } from '../../util/webrtc/join_message';
import { RestClient } from '../../util/rest_client';
import { VideoChannel } from '../../util/webrtc/video_channel';
import { AudioChannel } from '../../util/webrtc/audio_channel';
import { DataChannel } from '../../util/webrtc/data_channel';
import { Janus } from 'janus-gateway';
import { Parts } from '../parts';
import { Router } from '../../router';
import { MotionCapture } from '../../util/avatar/motion_capture';
import { VRMAvatar } from '../../util/avatar/vrm_avatar';
import { GUI } from "dat.gui"
import './chat_view_part.css'
import { isDebug, isKorean } from '../../config';
import { Dialog } from '../../util/dialog';
import { server, iceServer } from '../../config';
import { VideoComponent } from './video_component';
import { MediaPanel } from './media_panel';
import { ChatHeader } from './chat_header';

interface CommandMethods {
  [key: string]: (...args: string[]) => void;
}

export class ChatViewPart extends ViewPart {

  inputPanel: InputPanel | null = null
  mediaPanel: MediaPanel | null = null
  chatHeader: ChatHeader | null = null
  chatMessages: ChatMessages | null = null
  dataChannel: DataChannel | null = null
  audioChannel: AudioChannel | null = null
  restClient: RestClient | null = null

  chatApp: HTMLDivElement | null = null

  room: number = 0;

  // headsetEnabled: boolean = false;
  // microphoneEnabled: boolean = false;

  uid: string = ''

  // motionCapture: MotionCapture | null = null;
  avatar: VRMAvatar | null = null;

  videoComponent: VideoComponent | null = null;

  datGUI: GUI | null = null;
  controlGUI?: GUI

  constructor(public control: Control) {
    super(control)
  }

  async init(): Promise<void> {
    return super.init()
  }

  dispose(): void {
    super.dispose()
  }

  update(): void {
    super.update()
  }

  onkeydown(_: KeyboardEvent) {
    // console.log(e)
  }

  private buildStructure() {
    let content = document.getElementById('content')
    if(!content) {
      console.error('content is nil')
      return
    }
  }

  async onstart(args?: any) {
    console.log(`>>>>>>>>>>>>> ChatViewPart::onstart ${args}`);
    // args.client
    // args.room
    this.restClient = args.client;
    let room = args.room;
    this.room = room;
    this.uid = args.uid;
    this.avatar = args.avatar;

    this.buildStructure();

    let content = document.getElementById('content')
    if(!content) {
      console.error('content is nil')
      return
    }

    this.chatMessages = new ChatMessages(content);

    this.inputPanel = new InputPanel(content);
    this.inputPanel.on('message', this.onmessage.bind(this));
    this.inputPanel.on('click', async (args) => {
      console.log(`${args} clicked`)
      if(args === 'plus') {
        if(this.mediaPanel?.isVisible) {
          this.mediaPanel.visible = false;
        }
        else {
          this.mediaPanel!.visible = true;
        }
      }
    });

    this.mediaPanel = new MediaPanel(content);
    this.mediaPanel.on('click', (args) => {
      console.log(`${args} clicked`)
      if(args === 'headset') {
        // this.headsetEnabled = !this.headsetEnabled;
        this.onaudioclick(this.mediaPanel?.microphoneEnabled || false, this.mediaPanel?.headsetEnabled || false); // headset on, microphone on
        console.assert(this.mediaPanel, 'mediaPanel is nil')
        if(this.mediaPanel) {
          this.mediaPanel.enableAudioButton = this.mediaPanel.microphoneEnabled;
          this.mediaPanel.enableHeadsetButton = this.mediaPanel.headsetEnabled;
        }
      }
      else if(args === 'microphone') {
        // use mic or not
        // this.microphoneEnabled = !this.microphoneEnabled;
        this.onaudioclick(this.mediaPanel?.microphoneEnabled || false, this.mediaPanel?.headsetEnabled || false); // headset on, microphone on
        console.assert(this.mediaPanel, 'mediaPanel is nil')
        if(this.mediaPanel) {
          this.mediaPanel.enableAudioButton = this.mediaPanel.microphoneEnabled;
          this.mediaPanel.enableHeadsetButton = this.mediaPanel.headsetEnabled;
        }
      }
      else if(args === 'camera') {
        // TODO:
        this.onvideoclick()
        if(this.mediaPanel) {
          console.log(`avatar enabled: ${this.mediaPanel.avatarEnabled}`);
          this.mediaPanel.enableVideoButton = (this.videoComponent)? true : false;
        }
      }
    });


    this.chatHeader = new ChatHeader(content, this.uid, this.room);
    this.chatHeader.on('click', (args) => {
      console.log(`${args} clicked`)
      if(args === 'exit') {
        this.leave();
      }
    });
    // let uid = Janus.randomString(12)
    
    this.dataChannel = new DataChannel(server, [iceServer], this.uid)
    this.dataChannel.on('error', (msg) => {
      console.log(msg);
    });
    this.dataChannel.on('message', async (message: Message) => {
      // message from the server
      console.log(message.message)
      if(!message.message) {
        console.error('message is nil')
        return;
      }

      const msg = JSON.parse(message.message);
      if(msg) {
        if(msg.type == 'text') {
          this.chatMessages?.addMessage(msg.data, this.uid == message.from, message.sender)

          // good place to hook. i.e. link
          let matches = this.detectURLs(msg.data)
          if(matches && matches.length > 0) {
            matches.forEach(async (match) => {
              console.log(match)
              // let res = await this.getURLPreview(text)
              let res = await this.restClient?.preview(match)
              console.log(`preview: ${JSON.stringify(res)}`)
              console.log(res)
              // TODO:
              this.chatMessages?.addPreview(match, res, this.uid == message.from, message.sender)
            })
          }
        }
        else if (msg.type == 'event') {
          console.log(msg.data);
          if(message.from === this.uid) {
            console.log('this is me!');
          }
          else {
            // TODO: show a dialog.
            if(msg.data.channel == 'audio') {
              console.log(`microphone: ${msg.data.microphone}`);
              console.log(`headset: ${msg.data.headset}`);
              if(msg.data.microphone && !this.mediaPanel?.headsetEnabled) {
                const message = isKorean() ? 
                  '상대방이 스피커를 켰습니다. 마이크를 켜시겠습니까?':
                  'The other person has turned on their speaker. Would you like to activate your microphone?';

                const dialog = new Dialog(message);
                const res = await dialog.show();
                console.log(`dialog: ${res}`);
                if(res) {
                  // TODO:
                  if(this.mediaPanel) {
                    this.mediaPanel.headsetEnabled = true;
                  }
                }
              }

              if(msg.data.headset && !this.mediaPanel?.microphoneEnabled) {
                const message = isKorean() ?
                  '상대방이 마이크를 켰습니다. 스피커를 켜시겠습니까?':
                  'The other person has turned on their microphone. Would you like to activate your speakers?';
                const dialog = new Dialog(message);
                const res = await dialog.show();
                console.log(`dialog: ${res}`);
                if(res) {
                  // TODO:
                  if(this.mediaPanel) {
                    this.mediaPanel.microphoneEnabled = true;
                  }
                }
              }
            }
            else if(msg.data.channel == 'video') {
              if(!(this.mediaPanel?.cameraEnabled) && msg.data.state) {
                const message = isKorean() ?
                  '상대방이 비디오를 켰습니다. 비디오를 켜시겠습니까?':
                  'The other person has turned on their video. Would you like to activate your video?'
                const dialog = new Dialog(message);
                const res = await dialog.show();
                console.log(`dialog: ${res}`);
                if(res) {
                  // TODO:
                  if(this.mediaPanel) {
                    this.mediaPanel.cameraEnabled = true;
                  }
                }
              }
            }
          }
        }
        else {
          // TODO: image, motion data...
        }
      }
    })
    this.dataChannel.on('setup', (on) => {
      if(on) {
        this.join(room);
      }
    });
    this.dataChannel.on('destroyed', () => {
      this.leave();
    });
    this.dataChannel.on('leave', () => {
      this.leave();
    });
    this.dataChannel.on('join-message', (message: JoinMessage) => {
      console.log(message.uid)
      // if(message.uid !== this.uid) {
      //   this.chatMessages?.addMessage(`${message.uid} has joined`)
      // }
    })

    this.dataChannel.init()
    .then(() => {
      return this.dataChannel?.attach()
    })
    .then(() => {
      console.log('attached!')
      return this.dataChannel?.setup()
    })
    .catch(() => {
      console.log('failed to attach!')
    })
    .catch((error: any) => {
      console.error(error)
      // TODO
    })

    if(isDebug()) this.initGUI();
  }

  onaudioclick(microphone: boolean, headset: boolean) {
    console.log('audioclick!!')
    if(this.audioChannel) {
      this.audioChannel.dispose();
      this.audioChannel = null;
    }
    
    if(microphone || headset) {
      this.audioChannel = new AudioChannel(server, [iceServer], this.uid, microphone, headset);
      this.audioChannel.on('error', (msg) => {
        console.log(msg);
      })
      this.audioChannel.on('mediaState', (state: boolean) => {
        console.log(`audio media state ${state} microphone: ${microphone} headset: ${headset}`);
        this.dataChannel?.message(JSON.stringify({
          type: 'event',
          data: {
            channel: 'audio',
            state: state,
            microphone: microphone,
            headset: headset,
          }
        }));
      });
      this.audioChannel.on('onremotestream', (stream) => {
        let audio = document.getElementById('roomaudio'); // TODO:
        Janus.attachMediaStream(audio, stream);
      })
      this.audioChannel.init()
      .then(() => {
        return this.audioChannel?.attach();
      })
      .then(() => {
        console.log('attached!')
        // let roomId = "1234" // TODO
        if(!this.room) {
          console.error(`this room ${this.room}`);
          return;
        }
        this.audioChannel?.join(this.room);
      })
    }
  }


  async onvideoclick() {
    // this.stopMotionCapture();

    if(this.videoComponent) {
      this.videoComponent.dispose()
      this.videoComponent = null;

      // this.disposeVideoElements();
    }
    else {
      //
      this.videoComponent = new VideoComponent(this.room, this.uid, this.control, this.mediaPanel?.avatarEnabled || false, this.avatar || undefined);
      this.videoComponent.on('error', (msg) => {
        console.log(msg);
      });
      this.videoComponent.on('mediaState', (state: boolean) => {
        console.log(`video media ${state}`);
        this.dataChannel?.message(JSON.stringify({
          type: 'event',
          data: {
            channel: 'video',
            state: state
          }
        }));
      });
      await this.videoComponent.init(this.datGUI); // isDebug
    }
  }

  onstop(args?: any) {
    console.log(`<<<<<<<<<<<<<<<< ChatViewPart::onstop ${args}`);
    // destroy dat.GUI
    if(this.datGUI) {
      this.datGUI.domElement.remove();
      this.datGUI.destroy();
      this.datGUI = null;
    }

    // this.stopMotionCapture();

    if(this.audioChannel) {
      this.audioChannel.dispose();
      this.audioChannel = null;
    }

    if(this.videoComponent) {
      this.videoComponent.dispose()
      this.videoComponent = null;
    }

    if(this.dataChannel) {
      this.dataChannel.dispose()
      this.dataChannel = null
    }

    if(this.chatApp) {
      this.chatApp.remove();
    }

    if(this.chatHeader) {
      this.chatHeader.dispose();
      this.chatHeader = null;
    }

    if(this.inputPanel) {
      this.inputPanel.dispose();
      this.inputPanel = null;
    }

    if(this.mediaPanel) {
      this.mediaPanel.dispose();
      this.mediaPanel = null;
    }

    if(this.chatMessages) {
      this.chatMessages.dispose();
      this.chatMessages = null;
    }

    if(this.restClient) {
      this.restClient = null;
    }

    // this.disposeVideoElements();
  }

  detectURLs(message: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.match(urlRegex);
  }

  // async getURLPreview(url: string) {
  //   const response = await fetch('/api/preview', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ url }),
  //   });
  //   return response.json();
  // }

  onmessage(text: string) {
    console.log('Message received from input box:', text);
    const [command, ...args] = text.trim().split(' ');
  
    const commandMethods: CommandMethods = {
      "/create": () => this.create(),
      "/join": (roomId: string) => this.join(parseInt(roomId)),
      "/list": () => this.list(),
      "/leave": () => this.leave(),
      "/destroy": (roomId: string) => this.destroy(parseInt(roomId)),
    };

    if (command in commandMethods) {
      // Call the corresponding method
      commandMethods[command](...args);
    } else {
      // console.log("Not a recognized command");
      // Handle regular input or show error message
      if (this.dataChannel) {
        this.dataChannel.message(JSON.stringify({
          type: 'text',
          data: text
        }));
      }
    }
  }
  
  // Assuming these methods are defined in your class:
  private async create() {
    // Implementation for create
    console.log('create')

    // if(!this.room) {
    //   this.room = uuidv4();
    // }
    await this.dataChannel?.destroy(this.room); // ?
    await this.dataChannel?.create(this.room);

    // join
    await this.dataChannel?.join(this.room)
  }
  
  private list() {
    // Implementation for list
    console.log('list')
    // let roomIds: string[] = []
    this.dataChannel?.list().then((list: []) => {
      console.log(list)
      list.forEach((item: any) => {
        // roomIds.push(item.room)
        this.chatMessages?.addMessage(item.room)
      })
      // this.dataChannel?.message()

      // console.log(roomIds)
      // this.chatMessages?.addMessage(roomIds)
    })
  }
  
  private join(roomId: number) {
    // Implementation for join
    console.log(`Joining room ${roomId}`);
    this.dataChannel?.join(roomId)
  }

  private leave() {
    this.dataChannel?.leave();
    setTimeout(() => {
      Router.getInstance().requestStart(Parts.home)
    })
  }

  private async destroy(roomId?: number) {
    if(roomId == 0) {
      this.dataChannel?.list().then((list: []) => {
        const roomIds = list.map(room => room['room']);
        console.log(roomIds);
        roomIds.forEach((roomId) => {
          this.dataChannel?.destroy(roomId);
        });
      })
      return
    }

    this.dataChannel?.destroy(roomId);
  }


  // private onfaceposeupdated(args: any) {
  //   let {faceResults, poseResults} = args;
  //   if(this.avatar) {
  //     this.avatar.updateFace(faceResults);
  //     this.avatar.updatePose(poseResults);
  //   }
  // }

  private initGUI() {
    this.datGUI = new GUI({
      width: 310,
      autoPlace: false
    });

    const containerId = 'dg-container';
    let element = document.getElementById(containerId);
    if(!element) {
      element = document.createElement('div') as HTMLDivElement;
      element.id = containerId;
      document.body.appendChild(element);
    }

    
    this.datGUI.domElement.classList.add('custom-dg');
    if(this.control) {
      this.control.initGUI(this.datGUI);
    }
    element.appendChild(this.datGUI.domElement);
  }
}
