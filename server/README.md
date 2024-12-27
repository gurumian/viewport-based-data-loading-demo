# toktoktalk
npm + typescript + webpack

## Quick guide

### Run the local server at localhost:8080
```bash
npm run dev
```

### Run the server for test
dev port: `30100`

```bash
npm install -g firebase-tools
firebase login 
firebase init emulators # space to select
firebase emulators:start
```
Please ensure the following line is uncommented when required.
```typescript
if (location.hostname === "localhost") {
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");
}
```



```bash
npm run dev:server # for the backend server
```
```bash
npm run dev # for the browser test
```

#### @deprecated
```bash
npm run build:server
npm run start
```


### Build for production in the dist/ directory
```bash
npm run build
```


### snap packaging
```bash
npm run pack
```

```bash
sudo snap install ./toktoktalk_1.0.0_amd64.snap --dangerous --devmode
```

```bash
snap run --shell toktoktalk

node --version
# check if it's v20.9.0
```


## Default settings
- port: `30100`


## media files
```bash
mkdir -p /var/snap/toktoktalk/x1/media
```
and copy mp3 files in the above directory.





### You might need to update `janus.transport.http.jcfg`
```
cors: {
  allow_origin = "*"
  allow_methods = "GET,POST,OPTIONS"
  allow_headers = "content-type,x-janus-session-id,x-janus-handle-id,x-janus-token"
  expose_headers = "x-janus-session-id,x-janus-handle-id"
  allow_credentials = true
}
```


## SVG Editor
https://yqnn.github.io/svg-path-editor/



## Sequence
It is assumed that:
- the maximum of participants is 2.


1. `start` button
2. [POST] / > uid (uuid4)
3. A client connects to the server thru *Socket.IO* (UserNotification).
4. *UserNotification* holds the user connections globally. It periodically picks and pops 2 users from the user list. And invite them regardless the status of the connections.
5. It also monitor the number of the participant over the all rooms. It will destroy the set of rooms (video, audio, text) unless # of participants of a room is 2.

Once a client is invited, it is programmed to leave the `default-view-part` to move to `chat-view-part`. When it leaves, the connection thru *Socket.IO(UserNotification)* will be disconnected.  
**It means that the users may use this session as much as they want.*

If anyone leaves the room, `janus:hangup` will be sent.

When a user finishes and go back to the `default-view-part`, it will try to connect to the server again.


## Known Issues:
- `Janus` cannot create an appropriate sdp. `Peerconnection` does, though.


## UFW

```bash
sudo ufw default allow outgoing
sudo ufw default deny incoming
```

for test
```bash
sudo ufw default allow incoming

```


```bash
sudo ufw allow 19763/tcp
sudo ufw allow 8088/tcp
sudo ufw allow 8188/tcp
sudo ufw allow 10000:20000/udp
sudo ufw allow 19763/tcp
sudo ufw allow 3478/udp
```


## Model (.VRM)
Copy the model files (.png and .vrm) to the following directory:
```
/var/snap/toktoktalk/common/models
```


## see also
https://github.com/gurumian/motioncapture-face



## for linux user.
```bash
chromium --ignore-gpu-blacklist --enable-gpu-rasterization --enable-native-gpu-memory-buffers --enable-features=VaapiVideoDecoder,VaapiVideoEncoder,VaapiVideoDecodeLinuxGL,UseChromeOSDirectVideoDecoder

```



```bash
sudo snap logs toktoktalk.toktoktalk -f
```
