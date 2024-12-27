'use strict'

const express = require('express')
var cors = require('cors')
const { exec } = require("child_process")
// import { Session } from './session';
// const mqtt = require('mqtt')
// const { networkInterfaces } = require('os')
// const { createProxyMiddleware } = require('http-proxy-middleware');
// const authProxy = createProxyMiddleware({
//   target: 'https://toktoktalk-a52ce.firebaseapp.com', // Firebase project domain
//   changeOrigin: true, // Changes the origin header to match Firebase
//   pathRewrite: {
//     '^/__/auth': '/__/auth', // Ensures path is preserved
//   },
//   onProxyReq: (proxyReq: any) => {
//     console.log(`Proxying request to: ${proxyReq.path}`);
//   },
//   onError: (err: any, req: any, res: any) => {
//     console.error('Proxy Error:', err.message);
//     res.status(502).send('Proxy Error');
//   },
// })

import { v4 as uuidv4 } from 'uuid'
const bodyParser = require('body-parser')
// const swaggerUi = require('swagger-ui-express');
import * as fs from 'fs';
import * as path from 'path';
const axios = require('axios');
const cheerio = require('cheerio');
import { Agent } from './agent/agent'
import { UserNotification } from './user_notification'
import { mkdir, getFiles } from './utils/sys'
// const copyfiles = require('copyfiles')
// import { Room } from './room';

// const service_name: string = 'camera-manager.service'

// TODO: inotify /media

const app = express()
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


// async notification
const http = require('http').createServer(app);

export class Control {
  private port: number | undefined
  private model_files?: string[]
  stopped: boolean = false;
  private userNotification?: UserNotification
  constructor(config: {port: number, rootdir: string}, private agent: Agent) {
    if (config.hasOwnProperty('port')) {
      this.port = config['port']
    }
  }

  async init() {
    this.userNotification = new UserNotification(http);
    await this.userNotification.init();

    mkdir(this.model_path);
    this.model_files = this.getModelFiles();
    console.log(this.model_files);
    // TODO: if not pair .svg and .vrm, remove it.
    
    // mkdir(this.media_path)
    // this.audio_files = this.getAudioFiles()

    // let media_path = 'media'
    // const snapData = process.env.SNAP_DATA;
    // if(snapData) {
    //   media_path = `${snapData}/${media_path}`
    // }
    // else {
    //   media_path = path.join(__dirname, media_path)
    // }
    // console.log(`media path: ${media_path}`)

    
    // app.get('/sub', (req: { body: any; }, res: any) => {
    //   res.sendFile(path.join(__dirname, '../client/sub.html'), (err: any) => {
    //     if (err) {
    //       res.status(500).send(`Error loading sub.html: ${err} for ${req}`);
    //     }
    //   });
    // });

    // app.use('/__/auth', authProxy); // tried. but not working.
    app.use(express.static(path.join(__dirname, '../client')));
    app.use('/models', express.static(this.model_path));

    // app.use('/media', express.static(this.media_path))

    // app.post('/', (req: { body: any; }, res: { json: (arg0: { result: string; id: any; }) => void; }) => {
    //   let id = uuidv4()
    //   let name = id;
    //   console.log(req.body);
    //   let body = req.body;
    //   if (body.hasOwnProperty('name')) {
    //     name = body.name;
    //   }

    //   console.log(`sessions: ${id}:${name} has been created successfully`)
    // })

    app.delete('/room', async (req: { body: any; }, res: { json: (arg0: { result: string; room: any; reason?: string; }) => void; }) => {
      console.log('request to destroy a room!');
      console.log(`for ${req.body.room}`);
      await this.agent?.destroyRoom(req.body.room);
      res.json({
        result: 'ok',
        room: req.body.room
      });
    })

    app.post('/room', async (req: { body: any; }, res: { json: (arg0: { result: string; room: any; reason?: string; }) => void; }) => {
      console.log('request to create a room!');
      console.log(`for ${req.body.users}`);
      if(req.body.users.length < 2) {
        res.json({
          result: 'nok',
          reason: 'not enough users',
          room: null
        })
        return;
      }
      
      try {
        let data = await this.agent?.createRoom();
        this.userNotification?.talk(req.body.users, data.room);
        res.json({
          result: 'ok',
          room: data.room
        })
      }
      catch(e) {
        console.log(e);
        res.json({
          result: 'nok',
          reason: 'failed to create a room',
          room: null
        })
      }
    })

    app.get('/numofusers', (_: { body: any; }, res: { json: (arg0: { result: string; numofusers: any; }) => void; }) => {
      console.log(`numofusers ${this.userNotification?.numofusers}`);
      res.json({
        result: 'ok',
        numofusers: this.userNotification?.numofAvailable
      })
    })

    app.get('/users', (req: { body: any; }, res: { json: (arg0: { result: string; users: any, nextCursor: any; }) => void; }) => {
      const limit = parseInt(req.body.limit) || 20;
      const cursor = parseInt(req.body.cursor) || 0;
    
      console.assert(this.userNotification, 'userNotification is not initialized');
      console.assert(this.userNotification?.available, 'users is not initialized');

      if(!this.userNotification?.available) {
        res.json({
          result: 'nok',
          users: [],
          nextCursor: null
        });
        return;
      }
      else {
        // const paginatedUsers = this.userNotification?.users.slice(cursor, cursor + limit);
        const paginatedUsers = Array.from(this.userNotification?.available || []).slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < this.userNotification?.numofAvailable ? cursor + limit : null;
        res.json({
          result: 'ok',
          users: paginatedUsers,
          nextCursor: nextCursor
        });
      }
    })

    // app.post('/', (req: { body: any; }, res: { json: (arg0: { result: string; id: any; }) => void; }) => {
    //   let id = uuidv4()
    //   let name = id;
    //   console.log(req.body);
    //   let body = req.body;
    //   if(body.hasOwnProperty('name')) {
    //     name = body.name;
    //   }

    //   // this.sessions[id] = new Session()
    //   res.json({
    //     result: 'ok',
    //     id: id
    //   })

    //   console.log(`sessions: {${id}} has been created successfully`)
    // })

    app.get('/model', (req: any, res: any) => {
      console.log('[GET] model!');
      res.json({
        result: 'ok',
        data: this.model_files
      });
    });
  }

  start() {
    // this.monitor();
    const server = http.listen(this.port, '0.0.0.0', () => {
      console.log(`server is running at ${server.address().port}`)
    })
  }

  getModelFiles() {
    const directoryPath = this.model_path;
    const allFiles = getFiles(directoryPath, directoryPath);
    console.log('All files:', allFiles);
  
    // Filter files to include only .svg and .vrm extensions
    const filteredFiles = allFiles.filter(item =>
      item.endsWith('.svg') || item.endsWith('.vrm')
    );
  
    return filteredFiles.map(item => `/models/${item}`);
  }

  get model_path(): string {
    let p: string = 'models'
    const snapCommon: string | undefined = process.env.SNAP_COMMON;
    if(snapCommon) {
      p = `${snapCommon}/${p}`
    }
    else {
      p = path.join(__dirname, p)
    }
    return p
  }

  // private async monitor() {
  //   if(this.userNotification) {
      
  //     for(;this.userNotification.users.length >=2;) {
  //       // 1. pick 2
  //       // 2. create a room
  //       // 3. invite with room
  //       // 4. users must be updated!
  //       console.log(this.userNotification.users);
  //       let user1 = this.userNotification.users[0];
  //       let user2 = this.userNotification.users[1];
  //       try {
  //         let data = await this.agent.createRoom();
  //         console.log(data)
  //         this.userNotification?.invite([user1, user2], data.room);
  //       }
  //       catch(e) {
  //         console.log(e);
  //       }
  //     }
  //   }
    
  //   if (!this.stopped) {
  //     // console.log('monitor')
  //     setTimeout(() => {
  //       this.monitor();
  //     }, 1000);
  //   }
  // }
}
