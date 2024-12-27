import EventEmitter from "events";
import { Janus } from 'janus-gateway';
import { Message } from "./message";

// var use_msid = (getQueryStringValue("msid") === "yes" || getQueryStringValue("msid") === "true");

export class RemoteFeed extends EventEmitter {
  plugin: any = null
  feeds: any = []

  constructor(private janus: any, public id: string, public private_id: string, public display: string, private streams: any, public opaqueId: string, public roomId: number) {
    super()
  }

  async attach() {
    let janus = this.janus
    let opaqueId = this.opaqueId

    janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: opaqueId,
      success: this.onsuccess.bind(this),
      error: function(error: string) {
				Janus.error("  -- Error attaching plugin...", error);
				// bootbox.alert("Error attaching plugin... " + error);
			},
			iceState: (state: any) => {
				Janus.log("ICE state (feed #" + this.plugin.rfindex + ") changed to " + state);
			},
			webrtcState: function(on: boolean) {
				Janus.log("Janus says this WebRTC PeerConnection (feed #" + this.plugin.rfindex + ") is " + (on ? "up" : "down") + " now");
			},
			slowLink: function(uplink: any, lost: any, mid: any) {
				Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
					" packets on mid " + mid + " (" + lost + " lost packets)");
			},
      onmessage: this.onmessage.bind(this),
      onlocaltrack: function(track: any, on: any) {
				// The subscriber stream is recvonly, we don't expect anything here
        console.log(track, on)
			},
      onremotetrack: this.onremotetrack.bind(this),
      oncleanup: function() {
      },
    })
  }


  onremotetrack(track: any, mid: any, on: any, metadata: any) {
    Janus.debug(
      "Remote feed #" + this.plugin.rfindex +
      ", remote track (mid=" + mid + ") " +
      (on ? "added" : "removed") +
      (metadata? " (" + metadata.reason + ") ": "") + ":", track
    );
    if(!on) {
      this.emit('onremoteremoved', {mid, track})
      // Track removed, get rid of the stream and the rendering
      // $('#remotevideo'+remoteFeed.rfindex + '-' + mid).remove();
      // if(track.kind === "video") {
      //   remoteFeed.remoteVideos--;
      //   if(remoteFeed.remoteVideos === 0) {
      //     // No video, at least for now: show a placeholder
      //     if($('#videoremote'+remoteFeed.rfindex + ' .no-video-container').length === 0) {
      //       $('#videoremote'+remoteFeed.rfindex).append(
      //         '<div class="no-video-container">' +
      //           '<i class="fa-solid fa-video fa-xl no-video-icon"></i>' +
      //           '<span class="no-video-text">No remote video available</span>' +
      //         '</div>');
      //     }
      //   }
      // }
      delete this.plugin.remoteTracks[mid];
      return;
    }

    // if($('#remotevideo' + remoteFeed.rfindex + '-' + mid).length > 0)
    //   return;

    if(track.kind === "audio") {
      // New audio track: create a stream out of it, and use a hidden <audio> element
      let stream = new MediaStream([track]);
      this.plugin.remoteTracks[mid] = stream;
      Janus.log("Created remote audio stream:", stream);
      // $('#videoremote'+remoteFeed.rfindex).append('<audio class="hide" id="remotevideo' + remoteFeed.rfindex + '-' + mid + '" autoplay playsinline/>');

      // test
      let video = document.getElementById('remote-video') as HTMLVideoElement;
      if(!video) {
        console.assert('video is nil')
      }
      // Janus.attachMediaStream($('#remotevideo' + remoteFeed.rfindex + '-' + mid).get(0), stream);
      console.log(`remote attachMediaStream!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
      // Janus.attachMediaStream(video, stream);
      this.emit('onremotestream', stream);
      if(this.plugin.remoteVideos === 0) {
        // No video, at least for now: show a placeholder
        // if($('#videoremote'+remoteFeed.rfindex + ' .no-video-container').length === 0) {
        //   $('#videoremote'+remoteFeed.rfindex).append(
        //     '<div class="no-video-container">' +
        //       '<i class="fa-solid fa-video fa-xl no-video-icon"></i>' +
        //       '<span class="no-video-text">No remote video available</span>' +
        //     '</div>');
        // }
      } 
    }
    else {
      let video = document.getElementById('remote-video') as HTMLVideoElement;
      if(!video) {
        console.assert('video is nil')
      }
      this.plugin.remoteVideos++;
      let stream = new MediaStream([track]);
      this.plugin.remoteTracks[mid] = stream;
      Janus.log("Created remote video stream:", stream);
      this.emit('onremotestream', stream);
      // Janus.attachMediaStream(video, stream);

      // if(!bitrateTimer[remoteFeed.rfindex]) {
      //   $('#curbitrate'+remoteFeed.rfindex).removeClass('hide').removeClass('hide');
      //   bitrateTimer[remoteFeed.rfindex] = setInterval(function() {
      //     if(!$("#videoremote" + remoteFeed.rfindex + ' video').get(0))
      //       return;
      //     // Display updated bitrate, if supported
      //     let bitrate = remoteFeed.getBitrate();
      //     $('#curbitrate'+remoteFeed.rfindex).text(bitrate);
      //     // Check if the resolution changed too
      //     let width = $("#videoremote" + remoteFeed.rfindex + ' video').get(0).videoWidth;
      //     let height = $("#videoremote" + remoteFeed.rfindex + ' video').get(0).videoHeight;
      //     if(width > 0 && height > 0) {
      //       let res = width + 'x' + height;
      //       if(remoteFeed.simulcastStarted)
      //         res += ' (simulcast)';
      //       else if(remoteFeed.svcStarted)
      //         res += ' (SVC)';
      //       $('#curres'+remoteFeed.rfindex).removeClass('hide').text(res).removeClass('hide');
      //     }
      //   }, 1000);
      // }
    }
  }

  onmessage(msg: any, jsep: any) {
    Janus.debug(" ::: Got a message (subscriber) :::", msg);
    let event = msg["videoroom"];
    Janus.log("Event: " + event);
    if(msg["error"]) {
      console.error(`msg: ${msg["error"]}`);
      return;
    }

    if(event) {
      if(event === "attached") {
        for(let i=1;i<6;i++) {
          if(!this.feeds[i]) {
            this.feeds[i] = this.plugin;
            this.plugin.rfindex = i;
            break;
          }
        }
        Janus.log("Successfully attached to feed in room " + msg["room"]);
      }
      else if (event === "event") {
        // Check if we got a simulcast-related event from this publisher
        let substream = msg["substream"];
        let temporal = msg["temporal"];
        if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
          if(!this.plugin.simulcastStarted) {
            this.plugin.simulcastStarted = true;
            // Add some new buttons
            // addSimulcastSvcButtons(remoteFeed.rfindex, true);
          }
          // We just received notice that there's been a switch, update the buttons
          // updateSimulcastSvcButtons(remoteFeed.rfindex, substream, temporal);
        }
        // Or maybe SVC?
        let spatial = msg["spatial_layer"];
        temporal = msg["temporal_layer"];
        if((spatial !== null && spatial !== undefined) || (temporal !== null && temporal !== undefined)) {
          if(!this.plugin.svcStarted) {
            this.plugin.svcStarted = true;
            // Add some new buttons
            // addSimulcastSvcButtons(remoteFeed.rfindex, true);
          }
          // We just received notice that there's been a switch, update the buttons
          // updateSimulcastSvcButtons(remoteFeed.rfindex, spatial, temporal);
        }
      }
      else {
        // 
      }
    }

    if(jsep) {
      Janus.debug("Handling SDP as well...", jsep);
      let stereo = (jsep.sdp.indexOf("stereo=1") !== -1);
      this.plugin.createAnswer({
        jsep: jsep,
        // We only specify data channels here, as this way in
        // case they were offered we'll enable them. Since we
        // don't mention audio or video tracks, we autoaccept them
        // as recvonly (since we won't capture anything ourselves)
        tracks: [
          { type: 'data' }
        ],
        customizeSdp: (jsep: any) => {
          if(stereo && jsep.sdp.indexOf("stereo=1") == -1) {
            // Make sure that our offer contains stereo too
            jsep.sdp = jsep.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
          }
        },
        success: (jsep: any) => {
          Janus.debug("Got SDP!", jsep);
          let body = { request: "start", room: this.roomId };
          this.plugin.send({ message: body, jsep: jsep });
        },
        error: function(error: string) {
          Janus.error("WebRTC error:", error);
          // bootbox.alert("WebRTC error... " + error.message);
        }
      });
    }
  }

  onsuccess(pluginHandle: any) {
    this.plugin = pluginHandle;
    this.plugin.remoteTracks = {};
    this.plugin.remoteVideos = 0;
    this.plugin.simulcastStarted = false;
    this.plugin.svcStarted = false;
    Janus.log("Plugin attached! (" + this.plugin.getPlugin() + ", id=" + this.plugin.getId() + ")");
    Janus.log("  -- This is a subscriber");
    // Prepare the streams to subscribe to, as an array: we have the list of
    // streams the feed is publishing, so we can choose what to pick or skip

    let subscription = [];
    for(let i in this.streams) {
      let stream = this.streams[i];
      // If the publisher is VP8/VP9 and this is an older Safari, let's avoid video
      if(stream.type === "video" && Janus.webRTCAdapter.browserDetails.browser === "safari" &&
          ((stream.codec === "vp9" && !Janus.safariVp9) || (stream.codec === "vp8" && !Janus.safariVp8))) {
            console.warn("Publisher is using " + stream.codec.toUpperCase +
          ", but Safari doesn't support it: disabling video stream #" + stream.mindex);
        continue;
      }
      subscription.push({
        feed: stream.id,	// This is mandatory
        mid: stream.mid		// This is optional (all streams, if missing)
      });
      // FIXME Right now, this is always the same feed: in the future, it won't
      this.plugin.rfid = stream.id;
      this.plugin.rfdisplay = Message.escapeXmlTags(stream.display);
    }

    // We wait for the plugin to send us an offer
    let subscribe = {
    	request: "join",
    	room: this.roomId,
    	ptype: "subscriber",
    	streams: subscription,
    	use_msid: false,
    	private_id: this.private_id
    };

    console.log('SUBSCRIBE!!!')
    this.plugin.send({ message: subscribe });
  }

  dispose() {
    if(this.plugin) {
      this.plugin.detach();
      this.plugin = null;
    }
  }
}
