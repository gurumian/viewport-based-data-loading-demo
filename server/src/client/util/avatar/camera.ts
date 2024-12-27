import EventEmitter from 'events';

export class Camera extends EventEmitter {
  stopped: boolean = false;

  constructor(private element: HTMLVideoElement) {
    super();
  }

  init(): Promise<MediaStream> {
    return new Promise((res, rej) => {
      navigator.mediaDevices.getUserMedia({
        video: { 
          width: this.width, height: this.height,
          frameRate: 25 //25,
        }, // TODO:
        audio: false,
      })
      .then((stream) => {
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const frameRate = settings.frameRate;
        console.log(`Current frame rate: ${frameRate} FPS`);

        this.element.srcObject = stream;
        this.element.addEventListener("loadeddata", () => {
          this.element.play();
          res(stream);
        });
      })
      .catch((error) => {
        rej(error);
      });
    });
  }

  get width(): number {
    return 320;
  }

  get height(): number {
    return 240;
  }

  // onFrame(now: any, metadata: any) {
  onFrame() {
    // console.log(metadata);
    if(!this.stopped) {
      this.emit('frame', this.element);
      this.element.requestVideoFrameCallback(this.onFrame.bind(this));
    }
  }

  start() {
    if(!this.stopped)
      this.element.requestVideoFrameCallback(this.onFrame.bind(this));
  }

  stop() {
    this.element.pause();
    this.stopped = true;
  }

  dispose() {
    this.stop();

    const stream = this.element.srcObject as MediaStream;
    if(stream) {
      const tracks = stream.getTracks() as MediaStreamTrack[];
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      this.element.srcObject = null;
    }
  }
}
