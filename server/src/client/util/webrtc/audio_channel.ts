import { JanusChannel } from "./janus_channel";
import { Janus } from 'janus-gateway';
import { Message } from "./message";

var opaqueId = "audiobridge-"+Janus.randomString(12);
var audiosuspended = false;

export class AudioChannel extends JanusChannel {
  id: string | null = null;
  private webrtcUp: boolean = false

  private remoteStream: MediaStream | null = null

  constructor(public server: string, public iceServers: RTCIceServer[], public uid: string, public microphoneEnabled: boolean = false, public headsetEnabled: boolean = false) {
    super(server, iceServers, uid);
  }

  init(): Promise<void> {
    return super.init();
  }

  attach(): Promise<any> {
    console.log('attach!')
    return new Promise((res, rej) => {
      this.janus.attach({
        plugin: "janus.plugin.audiobridge",
        opaqueId: opaqueId,
        success: (plugin: any) => {
          this.plugin = plugin;
          Janus.log("Plugin attached! (" + plugin.getPlugin() + ", id=" + plugin.getId() + ")");
          res(plugin);
        },
        error: function(error: string) {
          rej(error)
        },
        consentDialog: function(on: boolean) {
          Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
        },
        iceState: function(state: any) {
          Janus.log("ICE state changed to " + state);
        },
        mediaState: (medium: any, on: boolean, mid: any) => {
          Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium + " (mid=" + mid + ")");
          this.emit('mediaState', on);
        },
        webrtcState: function(on: boolean) {
          Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        },
        onmessage: this.onmessage.bind(this),
        onlocaltrack: function(track: any, on: boolean) {
          Janus.debug("Local track " + (on ? "added" : "removed") + ":", track);
          // We're not going to attach the local audio stream
          // $('#audiojoin').addClass('hide');
          // $('#room').removeClass('hide');
          // $('#participant').removeClass('hide').html(myusername).removeClass('hide');
        },
        onremotetrack: this.onremotetrack.bind(this),
        oncleanup: () => {
          // webrtcUp = false;
          // Janus.log(" ::: Got a cleanup notification :::");
          // $('#participant').empty().addClass('hide');
          // $('#list').empty();
          // $('#mixedaudio').empty();
          // $('#room').addClass('hide');
          // remoteStream = null;
        },
      });
    });
  }

  dispose(): void {
    if(this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      })
    }
    if(this.plugin) {
      this.plugin.detach();
      this.plugin = null;
    }
    super.dispose()
    console.log('AudioChannel::disposed!');
  }

  private onmessage(msg: any, jsep: any) {
    Janus.log(" ::: Got a message :::", msg);
    let event = msg["audiobridge"];
    Janus.log("Event: " + event);
    if(event) {
      if(event === "joined") {
        if(msg["id"]) {
          this.id = msg["id"];
          Janus.log("Successfully joined room " + msg["room"] + " with ID " + this.id);
          if(!this.webrtcUp) {
            this.webrtcUp = true;
            this.createOffer().then((jsep: any) => {
              let publish = { request: "configure", muted: false };
              this.plugin.send({ message: publish, jsep: jsep });
            })
            .catch((error) => {
              Janus.error("WebRTC error:", error);
              // let publish = { request: "configure", muted: true };
              // this.plugin.send({ message: publish, jsep: jsep });
            });
          }
        }

        // Any room participant?
        if(msg["participants"]) {
          let list = msg["participants"];
          Janus.debug("Got a list of participants:", list);
          this.printParticipants(list);
        }
        else if(msg["suspended"]) {
        }
        else if(msg["resumed"]) {
        }
        else if(msg["error"]) {
        }
        // Any new feed to attach to?
        if(msg["leaving"]) {
          // One of the participants has gone away?
          let leaving = msg["leaving"];
          console.log(leaving)
          // Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
          // $('#rp'+leaving).remove();
        }
      }
      else if(event === "roomchanged") {
        // The user switched to a different room
        this.id = msg["id"];
        Janus.log("Moved to room " + msg["room"] + ", new ID: " + this.id);
        if(msg["participants"]) {
          // TODO
          let list = msg["participants"];
          Janus.debug("Got a list of participants:", list);
          this.printParticipants(list);
        }
      }
      else if(event === "destroyed") {
        Janus.warn("The room has been destroyed!");
      }
      else if(event === "event") {
        if(msg["participants"]) {
          if(msg["resumed"]) {
            console.log('resumed!')

          }
          let list = msg["participants"];
          Janus.debug("Got a list of participants:", list);
          this.printParticipants(list);
        }
        else if(msg["suspended"]) {
          console.log("suspended")
          console.log(msg["suspended"]);
        }
        else if(msg["resumed"]) {
          console.log("resumed")
          console.log(msg["resumed"]);
        }
        else if(msg["error"]) {
          console.log("error")
          console.log(msg["error_code"])
          this.emit('error', msg);
          if(msg["error_code"] === 485) {
          //   // This is a "no such room" error: give a more meaningful description
          //   bootbox.alert(
          //     "<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
          //     "does not exist...</p><p>Do you have an updated <code>janus.plugin.audiobridge.jcfg</code> " +
          //     "configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
          //     "from that sample in your current configuration file, then restart Janus and try again."
          //   );
          }
          else {
          //   bootbox.alert(msg["error"]);
          }
          return;
        }

        // Any new feed to attach to?
        if(msg["leaving"]) {
          // One of the participants has gone away?
          let leaving = msg["leaving"];
          console.log(`leaving: ${leaving}`)
          // Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
          // $('#rp'+leaving).remove();
        }
      }
    }

    if(jsep) {
      Janus.debug("Handling SDP as well...", jsep);
      this.plugin.handleRemoteJsep({ jsep: jsep });
    }
  }


  private printParticipants(list: []) {
    for(let f in list) {
      let id = list[f]["id"];
      let display = Message.escapeXmlTags(list[f]["display"]);
      let setup = list[f]["setup"];
      let muted = list[f]["muted"];
      let suspended = list[f]["suspended"];
      let spatial = list[f]["spatial_position"];
      Janus.debug("  >> [" + id + "] " + display + " (setup=" + setup + ", muted=" + muted + ")");
      console.log(suspended, spatial)
    }
  }

  private createOffer(): Promise<any> {
    return new Promise((res, rej) => {
      this.plugin.createOffer({
        // We only want bidirectional audio
        tracks: [
          { type: 'audio', capture: this.microphoneEnabled, recv: this.headsetEnabled },
        ],
        customizeSdp: function(jsep: any) {
          console.log(jsep)
          // if(stereo && jsep.sdp.indexOf("stereo=1") == -1) {
          //   // Make sure that our offer contains stereo too
          //   jsep.sdp = jsep.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
          //   // Create a spinner waiting for the remote video
          //   $('#mixedaudio').html(
          //     '<div class="text-center">' +
          //     '	<div id="spinner" class="spinner-border" role="status">' +
          //     '		<span class="visually-hidden">Loading...</span>' +
          //     '	</div>' +
          //     '</div>');
          // }
        },
        success: (jsep: any) => {
          Janus.debug("Got SDP!", jsep);
          // let publish = { request: "configure", muted: false };
          // this.plugin.send({ message: publish, jsep: jsep });
          res(jsep);
        },
        error: function(error: any) {
          Janus.error("WebRTC error:", error);
          // bootbox.alert("WebRTC error... " + error.message);
          rej(error);
        }
      });
    })
  }

  join(roomId: number) {
    console.log('join!!!')
    console.log(roomId)
    // console.log(`${roomId}`)
    this.rid = roomId
    let transaction = Janus.randomString(12);
    let register = {
			request: "join",
			transaction: transaction,
			room: this.rid,
      ptype: "publisher",
			suspended: audiosuspended,
			display: this.uid
		};

    // if(acodec === 'opus' || acodec === 'pcmu' || acodec === 'pcma')
		// 	register.codec = acodec;

    // this.plugin.send({ message: register })
    return this.request(register);
  }

  private onremotetrack(track: any, mid: any, on: boolean, metadata: any) {
    Janus.debug(
      "Remote track (mid=" + mid + ") " +
      (on ? "added" : "removed") +
      (metadata ? " (" + metadata.reason + ") " : "") + ":", track
    );

    if(this.remoteStream || track.kind !== "audio")
      return;


    if(!on) {
      // Track removed, get rid of the stream and the rendering
      this.remoteStream = null;
      // $('#roomaudio').remove();
      return;
    }

    this.remoteStream = new MediaStream([track]);

    this.emit("onremotestream", this.remoteStream);
  }

  request(register: {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.plugin.send({
        message: register, // Plugin-specific JSON payload
        success: function() {
          resolve();
        }, // Success callback
        error: function(error: any) {
          reject(error);
        }
      });
    });
  }
}
