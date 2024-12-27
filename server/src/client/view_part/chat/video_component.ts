import { EventEmitter } from "events";
import { Control } from "../../control";
import { VRMAvatar } from "../../util/avatar/vrm_avatar";
import { VideoChannel } from "../../util/webrtc/video_channel";
import { MotionCapture } from "../../util/avatar/motion_capture";
import { Light } from "./light";
import { Janus } from 'janus-gateway';
import { server, iceServer } from "../../config";
import { Timer } from "../timer";
import './video_component.css';
import { GUI } from "dat.gui";

export class VideoComponent extends EventEmitter {
  videoChannel: VideoChannel | null = null;

  motionCapture: MotionCapture | null = null;
  light: Light | null = null;

  localVideo: HTMLDivElement | null = null
  remoteVideo: HTMLDivElement | null = null

  timer: Timer | null = null;

  parentDatGUI?: any;
  videoFolder?: any;

  constructor(private room: number, private uid: string, private control: Control, private avatarEnabled: boolean, private avatar?: VRMAvatar) {
    super();
  }

  async init(datGUI?: any) {
    this.light = new Light(this.control.scene!);

    this.timer = new Timer(() => {
      this.control?.update();
    }, 1000/25);
    this.timer.start();

    this.createVideoElements();

    this.videoChannel = new VideoChannel(server, [iceServer], this.uid);
    this.videoChannel.on('mediaState', (state: boolean) => {
      if(state) {
        // start
      }
      else {
        // stop
      }

      this.emit('mediaState', state);
    });
    if(this.avatarEnabled) {

      this.startMotionCapture();
      // hook track
      if(this.control && this.control.capture_stream) {
        this.videoChannel.track = this.control.capture_stream.getVideoTracks()[0];

        console.assert(this.videoChannel.track);
      }
    }
    

    // this.videoChannel = new VideoChannel(server, [], this.uid)
    this.videoChannel.on('error', (msg) => {
      this.emit('error', msg);
    });
    this.videoChannel.on('onstream', (stream) => {
      let video = document.getElementById('local-video') as HTMLVideoElement; // TODO:
      if(!video) {
        video = document.createElement('video') as HTMLVideoElement;
        video.id = 'local-video';
        document.getElementById('content')!.appendChild(video);
      }
      Janus.attachMediaStream(video, stream);
    });
    this.videoChannel.on('onremotestream', (stream) => {
      let video = document.getElementById('remote-video'); // TODO:
      Janus.attachMediaStream(video, stream);
    });
    this.videoChannel.on('onremoteremoved', (obj) => {
      let mid = obj.mid;
      let track = obj.track
      console.log(mid, track)
      // TODO:
    });
    this.videoChannel.init()
    .then(() => {
      return this.videoChannel?.attach();
    })
    .then(() => {
      console.log('attached!')
      console.assert(this.room);
      let roomId = this.room // TODO
      if(!roomId) {
        console.log("room id is nil!");
        return;
      }
      this.videoChannel?.join(roomId);
    })
    .catch((error: any) => {
      console.error(error);
    });

    this.parentDatGUI = datGUI;
    if(datGUI) {
      this.initGUI();
    }
  } 

  async dispose() {
    try {
      this.disposeGUI();
    }
    catch(e) {
      console.log(e)
    }
    

    if(this.timer) {
      this.timer.stop();
      this.timer = null;
    }

    if(this.light) {
      this.light.dispose();
      this.light = null;
    }

    this.stopMotionCapture();

    if(this.videoChannel) {
      this.videoChannel.dispose()
      this.videoChannel = null;

      this.disposeVideoElements();
    }
  }


  private createVideoElement(id: string) {
    const containerId = `${id}-container`;
    let videoContainer = document.getElementById(containerId) as HTMLDivElement;
    if(!videoContainer) {
      videoContainer = document.createElement('div') as HTMLDivElement;
      videoContainer.id = containerId;
    }

    videoContainer.className = "video-container";
    document.getElementById('content')!.appendChild(videoContainer);
    
    let video = document.getElementById(id) as HTMLVideoElement; // TODO:
    if(!video) {
      video = document.createElement('video') as HTMLVideoElement;
      video.id = id;
      video.autoplay = true;
      video.playsInline = true;
      videoContainer.appendChild(video);
    }
    return videoContainer;
  }

  createVideoElements() {
    this.localVideo = this.createVideoElement('local-video');
    this.remoteVideo = this.createVideoElement('remote-video');
  }

  disposeVideoElements() {
    if(this.localVideo) {
      this.localVideo.remove();
      // this.localVideo.parentNode?.removeChild(this.localVideo);
      this.localVideo = null;
    }

    if(this.remoteVideo) {
      // this.remoteVideo.parentNode?.removeChild(this.remoteVideo);
      this.remoteVideo.remove();
      this.remoteVideo = null;
    }
  }


  private stopMotionCapture() {
    if(this.motionCapture) {
      this.motionCapture.dispose();
      this.motionCapture = null;
    }

    if(this.avatar) {
      if(this.avatar.scene){
        this.control.scene?.remove(this.avatar.scene);
      }
      // this.avatar.dispose();
      // this.avatar = null;
    }

    const inputVideoElement = document.getElementById('input-video');
    if(inputVideoElement) {
      inputVideoElement.remove();
    }
  }

  async startMotionCapture() {
    // motion capture with a camera
    // avatar

    // 1. load a model
    // this.avatar = new VRMAvatar();
    // this.avatar.init('images/VRoid_V110_Female_v1.1.3.vrm');
    // console.assert(this.avatarURL);
    // const scene = await this.avatar.init(this.avatarURL!);
    const scene = this.avatar?.scene;
    if(scene) {
      scene.position.set(0, -1.0 - this.avatar!.upperHeight, 0);
      // this.control.camera?.lookAt(this.avatar.scene.position);
      this.control.scene?.add(scene);
    }

    // 2. motion capture
    let video = document.createElement('video') as HTMLVideoElement
    video.id = 'input-video'
    video.autoplay = true;
    
    // let localVideo = document.getElementById('local-video') as HTMLVideoElement;
    // if(localVideo) {
    //   localVideo.srcObject = this.control.capture_stream!;
    //   localVideo.autoplay = true;
    // }
    
    this.motionCapture = new MotionCapture(video);
    // this.motionCapture.videoEnabled = true;
    // document.body.appendChild(video);

    // this.motionCapture.on('face', this.onfaceupdated.bind(this));
    // this.motionCapture.on('pose', this.onposeupdated.bind(this));
    this.motionCapture.on('face_and_pose', this.onfaceposeupdated.bind(this));
    // this.motionCapture.helperEnabled = this.canvas_enabled;
    await this.motionCapture.init();
  }

  private onfaceposeupdated(args: any) {
    let {faceResults, poseResults} = args;
    if(this.avatar) {
      this.avatar.updateFace(faceResults);
      this.avatar.updatePose(poseResults);
    }
  }

  private initGUI() {
    console.assert(this.parentDatGUI);
    if(!this.parentDatGUI) {
      return;
    }

    this.videoFolder = this.parentDatGUI.addFolder('Video');
    if(this.light) {
      this.light.initGUI(this.videoFolder);
    }
  }

  private disposeGUI() {
    if(this.parentDatGUI && this.videoFolder) {
      this.parentDatGUI.removeFolder(this.videoFolder);
      this.videoFolder = null;
    }
  }
}
