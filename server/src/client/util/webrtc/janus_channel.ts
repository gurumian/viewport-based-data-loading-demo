import { EventEmitter } from "events";
import { Janus } from 'janus-gateway';

export abstract class JanusChannel extends EventEmitter {
  protected janus: any | null = null
  protected plugin: any = null

  transactions: any = {}
  participants: any = {}

  rid?: number = 0
  constructor(public server: string, public iceServers: RTCIceServer[], public uid: string) {
    super()
  }

  init(): Promise<void> {
    return new Promise((res, rej) => {
      Janus.init({
        debug: "all",
        dependencies: Janus.useDefaultDependencies(),
        callback: ()  => {
          if(!Janus.isWebrtcSupported()) {
            console.error('webrtc is not supported')
            rej();
          }
          // Janus is initialized, you can create a new session here
          this.janus = new Janus({
            server: this.server,
            success: () => {
              // Connected to Janus
              console.log("Connected to Janus");
              res();
            },
            error: (error: string) => {
              Janus.error(error);
              console.log('error')
              rej(error);
              // bootbox.alert(error, function() {
              //   window.location.reload();
              // });
            },
            destroyed: () => {
            //   window.location.reload();
                console.log('janus destroyed')
            }
          });
        },
      });
    }
  )}

  abstract attach(): Promise<any>

  dispose() {
    if(this.janus) {
      this.janus.destroy()
      this.janus = undefined
    }
  }
}
