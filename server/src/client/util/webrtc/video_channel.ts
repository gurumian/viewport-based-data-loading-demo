import { Janus } from 'janus-gateway';
import { RemoteFeed } from "./remote_feed";
import { JanusChannel } from "./janus_channel";

var opaqueId = "videoroomtest-"+Janus.randomString(12);

// var subscriber_mode = (getQueryStringValue("subscriber-mode") === "yes" || getQueryStringValue("subscriber-mode") === "true");
var subscriber_mode = false
var doSimulcast = false
// var doSvc = getQueryStringValue("svc");
// if(doSvc === "")
// 	doSvc = null;
// var acodec = (getQueryStringValue("acodec") !== "" ? getQueryStringValue("acodec") : null);
// var vcodec = (getQueryStringValue("vcodec") !== "" ? getQueryStringValue("vcodec") : null);
// var doDtx = (getQueryStringValue("dtx") === "yes" || getQueryStringValue("dtx") === "true");
// var subscriber_mode = (getQueryStringValue("subscriber-mode") === "yes" || getQueryStringValue("subscriber-mode") === "true");
// var use_msid = (getQueryStringValue("msid") === "yes" || getQueryStringValue("msid") === "true");


export class VideoChannel extends JanusChannel {
  janus: any | null = null;
  plugin: any = null;

  transactions: any = {};
  participants: any = {};

  // rid?: string = undefined;

  feeds: [] = [];
  feedStreams: any = {};

  remotes: RemoteFeed[] = [];

  localTracks: any = {};
  localVideos: number = 0;

  id: string | null = null;
  privateId: string | null = null;

  // hook track
  track: MediaStreamTrack | null = null;
  
  constructor(public server: string, public iceServers: RTCIceServer[], public uid: string) {
    super(server, iceServers, uid);
  }

  init(): Promise<void> {
    return super.init();
  }

  attach(): Promise<any> {
    return new Promise((res, rej) => {
      this.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: opaqueId,
        iceServers: this.iceServers,
        success: (pluginHandle: any) => {
          this.plugin = pluginHandle;
          Janus.log("Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
          res(this.plugin);
        },
        error: (error: any) => {
          console.error("Error connecting to Janus", error);
          // this.emit('error', error)
          rej();
        },
        consentDialog: (on: boolean) => {
          Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
          if(on) {
            console.log(`consent-diaglog ${on}`)
          }
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
          if(!on)
            return;

          this.plugin.send({ message: { request: "configure", bitrate: 0 }});
        },
        slowLink: function(uplink: boolean, lost: string, mid: string) {
          Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
            " packets on mid " + mid + " (" + lost + " lost packets)");
        },
        onmessage: this.onmessage.bind(this),
        onlocaltrack: this.onlocaltrack.bind(this),
        onremotetrack: function(track: any, mid: any, on: any) {
          // The publisher stream is sendonly, we don't expect anything here
          console.log(track, mid, on);
        },
        oncleanup: () => {
          Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
          // mystream = null;
          delete this.feedStreams[this.id!];
          // $('#videolocal').html('<button id="publish" class="btn btn-primary">Publish</button>');
          // $('#publish').click(function() { publishOwnFeed(true); });
          // $("#videolocal").parent().parent().unblock();
          // $('#bitrate').parent().parent().addClass('hide');
          // $('#bitrate a').unbind('click');
          this.localTracks = {};
          this.localVideos = 0;
        }
      })
    })
  }

  onlocaltrack(track: any, on: boolean) {
    console.log(`local track!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
    console.log(track, on)
    Janus.debug("Local track " + (on ? "added" : "removed") + ":", track);
    let trackId = track.id.replace(/[{}]/g, "");
    if(!on) {
      // Track removed, get rid of the stream and the rendering
      let stream = this.localTracks[trackId];
      if(stream) {
        try {
          let tracks = stream.getTracks();
          for(let i in tracks) {
            let mst = tracks[i];
            if(mst !== null && mst !== undefined)
              mst.stop();
          }
        // eslint-disable-next-line no-unused-vars
        } 
        catch(e) {
          console.error(e);
        }
      }
      if(track.kind === "video") {
        // $('#myvideo' + trackId).remove();
        this.localVideos--;
        if(this.localVideos === 0) {
          console.log('No video, at least for now: show a placeholder');
          // No video, at least for now: show a placeholder
          // if($('#videolocal .no-video-container').length === 0) {
          //   $('#videolocal').prepend(
          //     '<div class="no-video-container">' +
          //       '<i class="fa-solid fa-video fa-xl no-video-icon"></i>' +
          //       '<span class="no-video-text">No webcam available</span>' +
          //     '</div>');
          // }
        }
      }
      delete this.localTracks[trackId];
      return;
    }

    let stream = this.localTracks[trackId];
    if(stream) {
      // We've been here already
      return;
    }
    // $('#videos').removeClass('hide').removeClass('hide');
    // if($('#mute').length === 0) {
    //   // Add a 'mute' button
    //   $('#videolocal').append('<button class="btn btn-warning btn-sm bottom-left m-2" id="mute">Mute</button>');
    //   $('#mute').click(toggleMute);
    //   // Add an 'unpublish' button
    //   $('#videolocal').append('<button class="btn btn-warning btn-sm bottom-right m-2" id="unpublish">Unpublish</button>');
    //   $('#unpublish').click(unpublishOwnFeed);
    // }
    if(track.kind === "audio") {
      // We ignore local audio tracks, they'd generate echo anyway
      if(this.localVideos === 0) {
        // No video, at least for now: show a placeholder
        // if($('#videolocal .no-video-container').length === 0) {
        //   $('#videolocal').prepend(
        //     '<div class="no-video-container">' +
        //       '<i class="fa-solid fa-video fa-xl no-video-icon"></i>' +
        //       '<span class="no-video-text">No webcam available</span>' +
        //     '</div>');
        // }
      }
    }
    else {
      // New video track: create a stream out of it
      this.localVideos++;
      // $('#videolocal .no-video-container').remove();
      stream = new MediaStream([track]);
      this.localTracks[trackId] = stream;
      Janus.log("Created local stream:", stream);
      Janus.log(stream.getTracks());
      Janus.log(stream.getVideoTracks());
      // $('#videolocal').prepend('<video class="rounded centered" id="myvideo' + trackId + '" width=100% autoplay playsinline muted="muted"/>');
      // let video = document.getElementById('local-video')
      // if(!video) {
      //   console.assert('video is nil')
      // }

      console.log(`local attachMediaStream!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
      console.log(stream)
      // Janus.attachMediaStream(video, stream);
      this.emit('onstream', stream);
      // Janus.attachMediaStream($('#myvideo' + trackId).get(0), stream);
    }
    if(this.plugin.webrtcStuff.pc.iceConnectionState !== "completed" &&
      this.plugin.webrtcStuff.pc.iceConnectionState !== "connected") {
      // $("#videolocal").parent().parent().block({
      //   message: '<b>Publishing...</b>',
      //   css: {
      //     border: 'none',
      //     backgroundColor: 'transparent',
      //     color: 'white'
      //   }
      // });
    }
  }

  onmessage(msg: any, jsep: any) {
    Janus.debug(" ::: Got a message (publisher) :::", msg);
    if(jsep) {
      console.log(`${JSON.stringify(jsep)}`)
    }
    let event = msg["videoroom"];
    Janus.debug("Event: " + event);
    console.log(`${JSON.stringify(msg)}`)
    if(event) {
      console.log(event)
      //note: registerUsername() then, joined will be called
      if(event === "joined") {
        this.onjoined(msg)
      }
      else if(event === "destroyed") {
        // The room has been destroyed
        Janus.warn("The room has been destroyed!");
        // bootbox.alert("The room has been destroyed", function() {
        //   window.location.reload();
        // });
      }
      else if(event === "event") {
        this.onevent(msg, jsep)  
      }
    }

    if(jsep) {
      Janus.debug("Handling SDP as well...", jsep);
      this.plugin.handleRemoteJsep({ jsep: jsep });
      // Check if any of the media we wanted to publish has
      // been rejected (e.g., wrong or unsupported codec)
      // let audio = msg["audio_codec"];
      // if(mystream && mystream.getAudioTracks() && mystream.getAudioTracks().length > 0 && !audio) {
      //   // Audio has been rejected
      //   console.warn("Our audio stream has been rejected, viewers won't hear us");
      // }
      // let video = msg["video_codec"];
      // if(mystream && mystream.getVideoTracks() && mystream.getVideoTracks().length > 0 && !video) {
      //   // Video has been rejected
      //   console.warn("Our video stream has been rejected, viewers won't see us");
      //   // Hide the webcam video
      //   // $('#myvideo').addClass('hide');
      //   // $('#videolocal').prepend(
      //   //   '<div class="no-video-container">' +
      //   //     '<i class="fa-solid fa-video fa-xl no-video-icon" style="height: 100%;"></i>' +
      //   //     '<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
      //   //   '</div>');
      // }
    }
  }


  onevent(msg: any, jsep: any) {
    if(jsep) console.log(jsep)
    if(msg["streams"]) {
      let streams = msg["streams"];
      for(let i in streams) {
        let stream = streams[i];
        stream["id"] = this.id;
        stream["display"] = this.uid;
      }
      if(!this.id) {
        console.error(`id ${this.id}`)
        return;
      }
      this.feedStreams[this.id] = streams;
    }

    else if(msg["publishers"]) {
      let list = msg["publishers"];
      Janus.debug("Got a list of available publishers/feeds:", list);
      for(let f in list) {
        if(list[f]["dummy"])
          continue;
        let id = list[f]["id"];
        let display = list[f]["display"];
        let streams = list[f]["streams"];
        for(let i in streams) {
          let stream = streams[i];
          stream["id"] = id;
          stream["display"] = display;
        }
        this.feedStreams[id] = streams;
        Janus.debug("  >> [" + id + "] " + display + ":", streams);
        // newRemoteFeed(id, display, streams);
        let remoteFeed = new RemoteFeed(this.janus, id, this.privateId!, display, streams, opaqueId, this.rid!)
        remoteFeed.on('onremotestream', (stream) => {
          // relay
          this.emit('onremotestream', stream);
        });
        remoteFeed.on('onremoteremoved', (obj) => {
          // relay
          this.emit('onremoteremoved', obj);
        });
        remoteFeed.attach().then(() => {
          this.remotes.push(remoteFeed)
        });
      }
    }

    else if(msg["leaving"]) {
      // // One of the publishers has gone away?
      let leaving = msg["leaving"];
      Janus.log("Publisher left: " + leaving);
      // let remoteFeed = null;
      // for(let i=1; i<6; i++) {
      //   if(feeds[i] && feeds[i].rfid == leaving) {
      //     remoteFeed = feeds[i];
      //     break;
      //   }
      // }
      // if(remoteFeed) {
      //   Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
      //   $('#remote'+remoteFeed.rfindex).empty().addClass('hide');
      //   $('#videoremote'+remoteFeed.rfindex).empty();
      //   feeds[remoteFeed.rfindex] = null;
      //   remoteFeed.detach();
      // }
      // delete feedStreams[leaving];
    }

    else if(msg["unpublished"]) {
      // One of the publishers has unpublished?
      let unpublished = msg["unpublished"];
      Janus.log("Publisher left: " + unpublished);
      if(unpublished === 'ok') {
        // That's us
        this.plugin.hangup();
        return;
      }
      // let remoteFeed = null;
      // for(let i=1; i<6; i++) {
      //   if(feeds[i] && feeds[i].rfid == unpublished) {
      //     remoteFeed = feeds[i];
      //     break;
      //   }
      // }
      // if(remoteFeed) {
      //   Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
      //   $('#remote'+remoteFeed.rfindex).empty().addClass('hide');
      //   $('#videoremote'+remoteFeed.rfindex).empty();
      //   feeds[remoteFeed.rfindex] = null;
      //   remoteFeed.detach();
      // }
      // delete feedStreams[unpublished];
    }
    
    else if(msg["error"]) {
      this.emit('error', msg);
      if(msg["error_code"] === 426) {
        // This is a "no such room" error: give a more meaningful description
        // bootbox.alert(
        //   "<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
        //   "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
        //   "configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
        //   "from that sample in your current configuration file, then restart Janus and try again."
        // );
      }
      else {
        // bootbox.alert(msg["error"]);
      }
    }
  }

  onjoined(msg: any) {
    let id = msg["id"]
    this.id = id
    console.log(`id: ${id}`)
    let privateId = msg["private_id"];
    this.privateId = privateId
    console.log(`private id: ${privateId}`)
    Janus.log(`Successfully joined room ${msg["room"]} with ID ${id}`);

    if(subscriber_mode) {
      // TODO:
    }
    else {
      this.publishOwnFeed()
    }

    if(msg["publishers"]) {
      let list = msg["publishers"];
      Janus.debug("Got a list of available publishers/feeds:", list);
      for(let f in list) {
        if(list[f]["dummy"])
          continue;
        let id = list[f]["id"];
        let streams = list[f]["streams"];
        let display = list[f]["display"];
        for(let i in streams) {
          let stream = streams[i];
          stream["id"] = id;
          stream["display"] = display;
        }
        
        this.feedStreams[id] = streams;
        Janus.debug("  >> [" + id + "] " + display + ":", streams);
        let remoteFeed = new RemoteFeed(this.janus, id, this.privateId!, display, streams, opaqueId, this.rid!);
        remoteFeed.on('onremotestream', (stream) => {
          // relay
          this.emit('onremotestream', stream);
        });
        remoteFeed.on('onremoteremoved', (obj) => {
          // relay
          this.emit('onremoteremoved', obj);
        });
        remoteFeed.attach().then(() => {
          this.remotes.push(remoteFeed)
        })
      }
    }
  }

  dispose() {
    // TODO
    this.unpublishOwnFeed();
    this.destoryLocalTracks();

    this.remotes.forEach((remoteFeed) => {
      remoteFeed.dispose();
    })
    this.remotes = [];

    if(this.plugin) {
      this.plugin.detach();
      this.plugin = null;
    }
    super.dispose();
    console.log('VideoChannel::diposed!');
  }

  destoryLocalTracks() {
    Object.keys(this.localTracks).forEach((key) => {
      console.log(`${key}: ${this.localTracks[key as keyof typeof this.localTracks]}`);
      let stream = this.localTracks[key] as MediaStream;
      stream.getTracks().forEach((track: any) => {
        track.stop();
      });
    });
  }

  join(roomId: number) {
    console.log(`${roomId}`)
    this.rid = roomId
    let transaction = Janus.randomString(12);
    let register = {
			request: "join",
			transaction: transaction,
			room: this.rid,
      ptype: "publisher",
			username: this.uid,
			display: this.uid
		};

    return this.request(register);
  }

  unpublishOwnFeed() {
    // Unpublish our stream
    // $('#unpublish').attr('disabled', true).unbind('click');
    let unpublish = { request: "unpublish" };
    return this.request(unpublish);
  }

  publishOwnFeed(useAudio: boolean = false) {
    // Publish our stream
    // $('#publish').attr('disabled', true).unbind('click');
  
    // We want sendonly audio and video (uncomment the data track
    // too if you want to publish via datachannels as well)
    let tracks = [];
    if(useAudio) tracks.push({ type: 'audio', capture: true, recv: false });
    
    tracks.push({ type: 'video', capture: this.track ? this.track : true, recv: false,
      // We may need to enable simulcast or SVC on the video track
      simulcast: doSimulcast,
      // We only support SVC for VP9 and (still WIP) AV1
      // svc: ((vcodec === 'vp9' || vcodec === 'av1') && doSvc) ? doSvc : null
      svc: null
    });
    //~ tracks.push({ type: 'data' });
  
    this.createOffer(tracks)
    .then((jsep) => {
      let publish: any = { 
        request: "configure",
        audio: useAudio,
        video: true,
        bitrate: 128000
      };
      // You can force a specific codec to use when publishing by using the
      // audiocodec and videocodec properties, for instance:
      // 		publish["audiocodec"] = "opus"
      // to force Opus as the audio codec to use, or:
      // 		publish["videocodec"] = "vp9"
      // to force VP9 as the videocodec to use. In both case, though, forcing
      // a codec will only work if: (1) the codec is actually in the SDP (and
      // so the browser supports it), and (2) the codec is in the list of
      // allowed codecs in a room. With respect to the point (2) above,
      // refer to the text in janus.plugin.videoroom.jcfg for more details.
      // We allow people to specify a codec via query string, for demo purposes
      // if(acodec)
      //   publish["audiocodec"] = acodec;
      // if(vcodec)
      //   publish["videocodec"] = vcodec;
      publish["videocodec"] = "vp9"
      // publish["audiocodec"] = "mp3"
      this.plugin.send({ message: publish, jsep: jsep });
    })
    .catch((error: any) => {
      Janus.error("WebRTC error:", error);
      if(useAudio) {
        this.publishOwnFeed(false);
      }
      else {
        // bootbox.alert("WebRTC error... " + error.message);
        // $('#publish').removeAttr('disabled').click(function() { publishOwnFeed(true); });
      }
    });
    // this.plugin.createOffer({
    //   tracks: tracks,
    //   customizeSdp: (jsep: any) => {
    //     console.log(jsep)
    //     // If DTX is enabled, munge the SDP
    //     // if(doDtx) {
    //     //   jsep.sdp = jsep.sdp
    //     //     .replace("useinbandfec=1", "useinbandfec=1;usedtx=1")
    //     // }
    //   },
    //   success: (jsep: any) => {
    //     Janus.debug("Got publisher SDP!", jsep);
    //     let publish: any = { request: "configure", audio: useAudio, video: true };
    //     // You can force a specific codec to use when publishing by using the
    //     // audiocodec and videocodec properties, for instance:
    //     // 		publish["audiocodec"] = "opus"
    //     // to force Opus as the audio codec to use, or:
    //     // 		publish["videocodec"] = "vp9"
    //     // to force VP9 as the videocodec to use. In both case, though, forcing
    //     // a codec will only work if: (1) the codec is actually in the SDP (and
    //     // so the browser supports it), and (2) the codec is in the list of
    //     // allowed codecs in a room. With respect to the point (2) above,
    //     // refer to the text in janus.plugin.videoroom.jcfg for more details.
    //     // We allow people to specify a codec via query string, for demo purposes
    //     // if(acodec)
    //     //   publish["audiocodec"] = acodec;
    //     // if(vcodec)
    //     //   publish["videocodec"] = vcodec;
    //     publish["videocodec"] = "vp8"
    //     // publish["audiocodec"] = "mp3"
    //     this.plugin.send({ message: publish, jsep: jsep });
    //   },
    //   error: (error: string) => {
    //     Janus.error("WebRTC error:", error);
    //     if(useAudio) {
    //       this.publishOwnFeed(false);
    //     }
    //     else {
    //       // bootbox.alert("WebRTC error... " + error.message);
    //       // $('#publish').removeAttr('disabled').click(function() { publishOwnFeed(true); });
    //     }
    //   }
    // });
  }


  createOffer(tracks: any): Promise<any> {
    return new Promise((res, rej) => {
      this.plugin.createOffer({
        tracks: tracks,
        customizeSdp: (jsep: any) => {
          console.log("Generated SDP before publishing:", jsep.sdp);
          if (!jsep.sdp.includes("m=video")) {
            console.error("No video in SDP:", jsep.sdp);
          }
          // If DTX is enabled, munge the SDP
          // if(doDtx) {
          //   jsep.sdp = jsep.sdp
          //     .replace("useinbandfec=1", "useinbandfec=1;usedtx=1")
          // }
        },
        success: (jsep: any) => {
          Janus.debug("Got publisher SDP!", jsep);
          res(jsep);
        },
        error: (error: string) => {
          rej(error);
        }
      });
    })
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
