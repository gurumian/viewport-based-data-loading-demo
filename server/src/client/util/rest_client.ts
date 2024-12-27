import { EventEmitter } from 'events'
const http = require('axios').default;

export class RestClient extends EventEmitter {
  constructor(public url?: string, public port?: number) {
    super()

    // if(!port) {
    //   port = 10101
    // }
    // this.port = port
    
    // const port = 10090
    // note that 10089 - /tibot/
    // refer to `/etc/nginx/site-available/default`
    // console.log(`${window.location.protocol}//${window.location.hostname}/tibot/`)
    let protocol = window.location.protocol || 'http:'

    console.log(`port: ${window.location.port}`)
    console.log(`protocol ${protocol}`)
    if(!url) {
      console.log(window.location.hostname)
      // const u = new URL(window.location.hostname)
      // url = `${protocol}//${window.location.hostname}:${port}`
      if(protocol === 'https:') {
        // TODO: we assume that it's redirected.
        url = `${protocol}//${window.location.hostname}`
      }
      else {
        url = `${protocol}//${window.location.hostname}:${window.location.port}`
      }
      
      console.log(url)
      this.url = url 
    }
    // this.url = url || `${protocol}//${window.location.hostname}:${port}`

    console.log(`url: ${this.url}`)
    console.log(`port: ${this.port}`)
    // this.init()
  }


  async init() {
    let res = await http.post(this.url, {
      // origin: ['https://dev.gurumlab.com'],
      // credentials: true,
      // 'origin': ['*'],
      // credentials: true,
    })
    // let body = res.data
    // console.log(body)
    // console.log(res.data)
    // this.id = body['id']
    // console.log(this.id)
    return res.data
  }

  async getModelFiles() {
    let model_url = `${this.url}/model`
    console.log(`model files! ${model_url}`)
    let urls: string [] = []
    let res = await http.get(model_url, {})
    console.log(res)
    if(Object.hasOwn(res.data, 'result')) {
      console.log('it has result!!!')
      if(res.data.result == 'ok') {
        console.log('ok!!!')
        res.data.data.forEach((path: string) => {
          urls.push(encodeURI(`${this.url}${path}`))
        })
        return urls
      }
    }
    return undefined
  }
  
  async getAudioFiles() {
    let audio_url = `${this.url}/audio`
    console.log(`audio files! ${audio_url}`)
    let urls: string [] = []
    let res = await http.get(audio_url, {})
    console.log(res)
    if(Object.hasOwn(res.data, 'result')) {
      console.log('it has result!!!')
      if(res.data.result == 'ok') {
        console.log('ok!!!')
        res.data.data.forEach((path: string) => {
          urls.push(encodeURI(`${this.url}${path}`))
        })
        return urls
      }
    }
    return undefined
  }

  async nusers() {
    let res = await http.get(`${this.url}/numofusers`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return res.data;
  }

  async getUsers(currentCursor: number) {
    // fetch(`/api/online-users?limit=20&cursor=${currentCursor}`)
    // .then(response => response.json())
    // .then(data => {
    //   data.users.forEach(user => {
    //     const userElement = document.createElement('div');
    //     userElement.textContent = `${user.name} - Last seen: ${user.lastSeen}`;
    //     userList.appendChild(userElement);
    //   });

    //   currentCursor = data.nextCursor;
    //   if (data.nextCursor === null) {
    //     loadMoreButton.style.display = 'none';
    //   }
    // });
    let res = await http.get(`${this.url}/users?limit=20&cursor=${currentCursor}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return res.data;
  }

  async preview(url: string) {
    console.log('preview')
    console.log(url)
    let res = await http.post(`${this.url}/api/preview`, {
      body: JSON.stringify({ url }),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
    )
    let body = res.data
    // console.log(body)
    // console.log(res.data)
    return body
  }

  dispose() {

  }
}
