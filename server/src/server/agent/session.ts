const axios = require('axios');

// function genstr() {
//   return Buffer.from(`${Math.random() * 10000000}`).toString('base64')
// }

export class Session {
  private handleId: number = 0;
  private sessionId: number = 0;
  constructor(private url: string, private plugin: string) {
  }

  genstr() {
    return Buffer.from(`${Math.random() * 10000000}`).toString('base64')
  }

  async init() {
    const createSessionResponse = await axios.post(this.url, {
      janus: 'create',
      transaction: this.genstr()
    });
    this.sessionId = createSessionResponse.data.data.id;
    console.log(`[${this.plugin}] Session created: ${this.sessionId}`);
    return this.sessionId;
  }

  async attach() {
    const url = `${this.url}/${this.sessionId}`;
    const attachPluginResponse = await axios.post(url, {
      janus: 'attach',
      plugin: this.plugin,
      transaction: this.genstr(),
    });
    const handleId = attachPluginResponse.data.data.id;
    console.log('Attached to plugin:', handleId);
    this.handleId = handleId;
    return handleId;
  }

  async list() {
    const url = `${this.url}/${this.sessionId}/${this.handleId}`
    const messageResponse = await axios.post(url, {
      janus: 'message',
      body: {
        request: 'list'
      },
      transaction: this.genstr(),
    });
    // console.log('Plugin response:', messageResponse.data.plugindata.data);
    return messageResponse.data.plugindata.data;
  }

  async dispose () {
    await axios.post(`${this.url}/${this.sessionId}`, {
      janus: 'destroy',
      transaction: this.genstr(),
    });
    console.log('Session destroyed');
  }

  async destroyRoom(options: any): Promise<any> {
    const url = `${this.url}/${this.sessionId}/${this.handleId}`
    console.log(`destroy the room ${url}`)
    const messageResponse = await axios.post(url, {
      janus: 'message',
      body: {
        request: 'destroy',
        ...options
      },
      transaction: this.genstr()
    });
    return messageResponse.data;
  }

  async createRoom(options: any): Promise<any> {
    const url = `${this.url}/${this.sessionId}/${this.handleId}`
    console.log(`create a room ${url}`)
    const messageResponse = await axios.post(url, {
      janus: 'message',
      body: {
        request: 'create',
        ...options
      },
      transaction: this.genstr()
    });

    // TODO: check 
    
    // {
    //   janus: 'success',
    //   session_id: 2414102943324985,
    //   transaction: 'OTU5MjQ4LjE2NjIxMDkyNDM=',
    //   sender: 199155687376091,
    //   plugindata: {
    //     plugin: 'janus.plugin.textroom',
    //     data: {
    //       textroom: 'created',
    //       room: '7bb3d26e-1904-443b-a8c1-df5b1265aea3',
    //       permanent: false
    //     }
    //   }
    // }
    
    return messageResponse.data;

    // try {
    //   const response: AxiosResponse<TextroomCreateResponse> = await axios.post(
    //     `${this.url}/${this.plugin}`,
    //     {
    //       janus: 'message',
    //       body: {
    //         request: 'create',
    //         ...options
    //       },
    //       transaction: generateTransactionId()
    //     }
    //   );
  
    //   if (response.data.textroom === 'created') {
    //     return response.data;
    //   } else {
    //     throw new Error('Failed to create textroom');
    //   }
    // } catch (error) {
    //   console.error('Error creating textroom:', error);
    //   throw error;
    // }
  }

  // async create(room: string): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "create",
  //     room,
  //   });
  // }

  // async destroy(room: string): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "destroy",
  //     room,
  //   });
  // }

  // async attach(): Promise<Record<string, any>> {
  //   const root: Record<string, any> = {
  //     janus: "attach",
  //     plugin: this.pid,
  //     opaque_id: this.oid,
  //     session_id: this.sid,
  //   };
  //   return root;
  // }

  // async list(): Promise<Record<string, any>> {
  //   return this.template({ request: "list" });
  // }

  // async listParticipants(room: string): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "listparticipants",
  //     room,
  //   });
  // }

  // async forward(
  //   room: string,
  //   pub_id: string,
  //   host: string,
  //   port: number,
  //   pt: number
  // ): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "rtp_forward",
  //     room,
  //     publisher_id: pub_id,
  //     host,
  //     video_port: port,
  //     video_pt: pt,
  //     // video_rtcp_port: port + 1,
  //   });
  // }

  // async stopForward(
  //   room: string,
  //   pub_id: string,
  //   stream_id: number
  // ): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "stop_rtp_forward",
  //     room,
  //     publisher_id: pub_id,
  //     stream_id,
  //   });
  // }

  // async streaming(
  //   secret: string,
  //   id: string,
  //   name: string,
  //   video: boolean,
  //   audio: boolean,
  //   data: boolean,
  //   videoiface: string,
  //   videoport: number[],
  //   videopt: number,
  //   videortpmap: string,
  //   type: string,
  //   description: string,
  //   videosimulcast: boolean,
  //   threads: number
  // ): Promise<Record<string, any>> {
  //   const root = this.template({
  //     request: "create",
  //     secret,
  //     id,
  //     name,
  //     video,
  //     audio,
  //     data,
  //     videoiface,
  //     videopt,
  //     videortpmap,
  //     type,
  //     description,
  //     videosimulcast,
  //     threads,
  //   });

  //   root.body.videoport = videoport[0];
  //   if (videosimulcast) {
  //     console.log(`simulcast enabled: port:[${videoport[1]},${videoport[2]}]`);
  //     if (videoport[1]) {
  //       root.body.videoport2 = videoport[1];
  //     }
  //     if (videoport[2]) {
  //       root.body.videoport3 = videoport[2];
  //     }
  //   }
  //   console.log(root);
  //   return root;
  // }

  // async stopStreaming(
  //   room: string,
  //   secret: string
  // ): Promise<Record<string, any>> {
  //   return this.template({
  //     request: "destroy",
  //     id: room,
  //     secret,
  //   });
  // }

  // private template(body: Record<string, any>): Record<string, any> {
  //   return {
  //     janus: "message",
  //     plugin: this.pid,
  //     body,
  //     handle_id: this.handleId,
  //     session_id: this.sid,
  //   };
  // }
}
