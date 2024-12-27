import { Control } from "../../control";
import { ViewPart } from "../../view_part";
import { RestClient } from "../../util/rest_client";
import { Router } from "../../router";
import { Parts } from "../parts";
// import { StartPanel } from "./start_panel";
import { SocketWrapper } from "../../util/socket_wrapper";
import { Loader } from "./loader";
// import { AvatarPanel } from "./avatar_panel";
import { VRMAvatar } from "../../util/avatar/vrm_avatar";
import { apiServer } from "../../config";
import "./home_view_part.css";
import { FileDrop } from "../../util/file_drop";
import { isKorean } from "../../config";

// import { firebaseConfig } from "../../firebase_config";
// import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, signOutUser, auth } from '../../firebase_auth';
import { EventEmitter } from "events";
// import { getDatabase, ref, get } from "firebase/database";
import { UserItemView } from "./user_item_view";
import { db } from "../../firebase_config";
import { collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore';

// const mockUsers = [
//   {
//     name: 'John Doe',
//     age: 20,
//     bio: 'I am a software engineer',
//     country: 'Korea',
//     sex: 'male',
//     profile: 'https://example.com/avatar.png',
//   },
//   {
//     name: 'Jane Smith',
//     age: 25,
//     bio: 'I am a software engineer',
//     country: 'Korea',
//     sex: 'female',
//     profile: 'https://example.com/avatar2.png',
//   },
// ];


export class HomeViewPart extends ViewPart {
  restClient: RestClient | null = null;

  uid: string = "";
  // startPanel: StartPanel | null = null;
  // avatarPanel: AvatarPanel | null = null;

  // socket?: Socket;
  socketWrapper?: SocketWrapper | null = null;
  loader?: Loader | null = null;
  
  avatar?: VRMAvatar | null = null;

  images: string[] = [];
  avatars: string[] = [];

  selectAvatarUrl: string = "";

  fileDrop?: FileDrop;

  logon: boolean = false;
  currentCursor: number = 0;

  db: any;

  constructor(public control: Control) {
    super(control);
    // firebase.initializeApp(firebaseConfig);
    // const app = initializeApp(firebaseConfig);
    // console.log(app);
    // const analytics = getAnalytics(app);
    // console.log(analytics);
  }

  async init(): Promise<void> {
    return super.init();
  }

  dispose(): void {
    if(this.avatar) {
      this.avatar.dispose();
      this.avatar = null;
    }
    super.dispose();
  }

  update(): void {
    super.update();
  }

  onkeydown(_: KeyboardEvent) {
    // console.log(e)
  }

  async updateUsers() {
    console.log(`updateUsers ${this.currentCursor}`);
    this.restClient = new RestClient(apiServer);
    let res = await this.restClient.getUsers(this.currentCursor);
    console.log(res);
    let usersDiv = document.getElementById('users') as HTMLDivElement;
    if(usersDiv) {
      usersDiv.innerHTML = '';

      // mockUsers.forEach((user: any) => {
      //   console.log(user);
      //   const userView = new UserItemView(usersDiv, user);
      //   userView.on('click', (user: any) => {
      //     console.log(`user clicked ${user.name}`);
      //     Router.getInstance().requestStart(Parts.user, {
      //       "uid" : user.id,
      //     });
      //   });
      // });
      

      console.log(`this.uid: ${this.uid}`);
      this.getUserData(this.uid);
      res.users.forEach((user: any) => {
        console.log(user);
        const userView = new UserItemView(usersDiv, user);
        userView.on('click', (user: any) => {
          console.log(`user clicked ${user.name}`);
          this.getUserData(user.id);
          Router.getInstance().requestStart(Parts.user, {
            "uid" : user.id,
          });
        });
      });
    }
    this.currentCursor = res.nextCursor || 0;
    console.log(`this.currentCursor: ${this.currentCursor}`);
  }

  private async buildStructure() {

    // const userLanguage = navigator.language || (navigator as any).userLanguage;
    const title = isKorean() ? "랜덤 채팅, 즐거움과 소통이 시작되는 곳" : 'Random Chat - Instant Chat with Strangers';

    let content = document.getElementById("content");
    if (!content) {
      console.assert("contain must not be nil");
      return;
    }

    let header = document.getElementById('header');
    console.assert(header);
    if(!header) {
      return;
    }

    header.innerHTML = `
      <div id="title">
      </div>
    `;
    
    content.innerHTML = `
      <div id="home-page" class="home-page">
        <p>TokTokTalk</p>
        <div id="auth">
          <button id="login-btn" class="button">login</button>
          <img id="user-image"></img>
          <p id="user-name"></p>
        </div>
        <div id="users"></div>
      </div>
    `;

    
    onAuthStateChanged(auth, async (user) => {
      console.log(`onAuthStateChanged`);
      if (user) {
        console.log("User is signed in:", user);
        this.uid = user.uid;
        // User is signed in, update UI accordingly
        this.logon = true;
        
        const button = document.getElementById('login-btn');
        if(button) {
          button.innerText = 'logout';
        }

        const img = document.getElementById('user-image') as HTMLImageElement;
        if(img && user.photoURL) {
          img.src = user.photoURL;
        }

        const name = document.getElementById('user-name') as HTMLParagraphElement;
        if(name && user.displayName) {
          name.innerText = user.displayName;
        }

        // load users
        this.updateUsers();
        this.startSocket();
      }
      else {
        console.log("User is signed out");
        // User is signed out, update UI accordingly
        this.logon = false;

        const button = document.getElementById('login-btn');
        if(button) {
          button.innerText = 'login';
        }

        const img = document.getElementById('user-image') as HTMLImageElement;
        if(img) {
          img.src = '';
        }

        const name = document.getElementById('user-name') as HTMLParagraphElement;
        if(name) {
          name.innerText = '';
        }

      }
    });

    document.getElementById('login-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if(this.logon) {
        signOutUser();
      }
      else {
        signInWithGoogle();
      }
    });

    // content.innerHTML = `
    //   <div id="home-page" class="home-page">
    //     <h1>Hi, there!</h1>
    //     <h2>${title}</h2>
    //     <div class="start-panel">
    //       <img src="${this.selectAvatarUrl}" alt="avatar" class="avatar-image">
    //       <button id="start-btn" class="button">${(userLanguage === 'ko-KR') ? "시작하기" : 'Start'}</button>
    //       <button id="select-avatar-btn" class="button">${(userLanguage === 'ko-KR') ? "아바타 변경" : 'Change Avatar'}</button>
    //     </div>
    //   </div>
    // `;
  }

  async getUserData(uid: string) {
    try {
      const userDocRef = doc(db, "users", uid); // Collection: 'users', Document ID: uid
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        console.log("User data:", userDocSnap.data());
        return userDocSnap.data();
      } else {
        console.log("No data available for this user.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  async onstart(args?: any) {
    console.log(`>>>>>>>>>>>>>> DefaultViewPart::onstart ${args}`)

    let content = document.getElementById("content");
    if (!content) {
      console.assert("contain must not be nil");
      return;
    }

    // this.restClient = new RestClient(apiServer);
    // const files = await this.restClient.getModelFiles()
    // if(!files) {
    //   console.error('files is nil');
    //   return;
    // }
    // console.log(files);

    // const svgs = files.filter((file) => file.endsWith('.svg'));
    // if(svgs.length == 0) {
    //   console.error('svgs is nil');
    //   return;
    // }

    // this.selectAvatarUrl = svgs[0];
    // this.images = svgs;
    // this.avatars = files.filter((file) => file.endsWith('.vrm'));
    // console.log(svgs);


    this.buildStructure();
    // const container = document.getElementById('default-view-container') as HTMLDivElement;

    // this.avatarPanel = new AvatarPanel(container, files);
    // await this.avatarPanel.init();

    // document.getElementById('start-btn')?.addEventListener('click', this.onclick.bind(this));
    // document.getElementById('select-avatar-btn')?.addEventListener('click', this.onChangeAvatar.bind(this));

    // let root = document.getElementById('root') as HTMLDivElement;
    // if(root) {
    //   this.fileDrop = new FileDrop(root);
    //   this.fileDrop.on('onfiledrop', this.onFileDrop.bind(this));
    // }
  }

  private async onChangeAvatar() {
    this.showAvatarSelectionModal(this.images);
  }
  
  startSocket() {
    this.socketWrapper = new SocketWrapper(apiServer);
    this.socketWrapper.on('invited', (room) => {
      console.log(room);
      Router.getInstance().requestStart(Parts.chat, {
        "client": this.restClient,
        "room": room,
        "uid" : this.uid,
        "avatar": this.avatar,
      });
    });
    this.socketWrapper.on('message', (data) => {
      console.log(data);
    });
    this.socketWrapper.init().then(() => {
      this.socketWrapper?.join(this.uid);
    });
  }

  async onclick(_: MouseEvent) {
    console.log("Start button clicked!");
    const container = document.getElementById('home-page') as HTMLDivElement;
    console.assert(container, "container must not be nil");
    this.loader = new Loader(container as HTMLDivElement);
    this.loader.setOnCancel(() => {
      window.location.reload();
    })
    this.loader.show();

    this.restClient = new RestClient(apiServer);
    let res = await this.restClient.init();
    console.log(res);
    // let uid = uuidv4();
    let uid = res.id;
    this.uid = uid;

    if(this.avatar) {
      this.avatar.dispose();
      this.avatar = null;
    }

    const avatarUrl = this.selectAvatarUrl.replace(/\.svg$/, '.vrm');

    this.avatar = new VRMAvatar();
    await this.avatar.init(avatarUrl);
    this.startSocket();
  }

  onstop(args?: any) {
    console.log(`<<<<<<<<<<<<<<< DefaultViewPart::onstop ${args}`)
    if(this.fileDrop) {
      this.fileDrop.dispose();
      this.fileDrop = undefined;
    }

    const content = document.getElementById("home-page");
    if(content) {
      content.remove();
    }

    if(this.loader) {
      this.loader.dispose();
      this.loader = null;
    }

    if (this.restClient) {
      this.restClient = null;
    }

    // if (this.avatarPanel) {
    //   this.avatarPanel.dispose();
    //   this.avatarPanel = null;
    // }

    // if (this.startPanel) {
    //   this.startPanel.dispose();
    //   this.startPanel = null;
    // }

    if(this.socketWrapper) {
      this.socketWrapper.dispose();
      this.socketWrapper = null;
    }

    let container = document.getElementById('default-view-container');
    if(container) {
      container.remove();
    }
  }


  private showAvatarSelectionModal(avatars: string[]) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${isKorean() ? '아바타 선택' : 'Select Avatar'}</h2>
        <div class="avatar-grid"></div>
      </div>
    `;
  
    const avatarGrid = modal.querySelector('.avatar-grid') as HTMLDivElement;
  
    avatars.forEach(avatar => {
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = 'Avatar option';
      img.className = 'avatar-option';
      img.addEventListener('click', () => {
        this.selectAvatar(avatar);
        document.body.removeChild(modal);
      });
      avatarGrid.appendChild(img);
    });
  
    document.body.appendChild(modal);
  }
  
  private selectAvatar(avatarUrl: string) {
    const avatarImage = document.querySelector('.avatar-image') as HTMLImageElement;
    if (avatarImage) {
      avatarImage.src = avatarUrl;
    }
    // You might want to update this.avatarPanel.selectAvatarUrl here as well
    // if (this.avatarPanel) {
    //   this.avatarPanel.selectAvatarUrl = avatarUrl;
    // }
    this.selectAvatarUrl = avatarUrl;
  }
  
  // private isKorean(): boolean {
  //   const userLanguage = navigator.language || (navigator as any).userLanguage;
  //   return userLanguage === 'ko-KR';
  // }
  

  onFileDrop(files: File[]) {
    const file = files[0];
    if(file.type == '') { // safari
      if(file.name.endsWith('vrm')) {
        
      }
    }
    
    function isRight(file: File) {
      if(file.type == 'model/vrml')
        return true;

      if(file.type == '' && file.name.endsWith('vrm'))
        return true;

      return false;
    }

    if(isRight(file)) {
      console.log(file);

      // if(this.avatar && this.avatar.scene) {
      //   this.scene?.remove(this.avatar.scene);
      //   this.avatar.dispose();
      //   this.avatar = null;
      // }

      // const video = document.getElementById('input-video') as HTMLVideoElement;
      // if(video) {
      //   if(!this.scene) {
      //     console.log('scene is nil')
      //     return
      //   }
      //   this.avatar = new VRMAvatar();
      //   const url = URL.createObjectURL(file);
      //   this.avatar.init(url)
      //   .then(() => {
      //     if(this.avatar && this.avatar.scene) {
      //       this.avatar.scene.position.set(0, -1.5, 0);
      //       this.control.camera?.lookAt(this.avatar.scene.position);
      //       this.scene?.add(this.avatar.scene);
      //     }
      //     URL.revokeObjectURL(url);
      //   })
      // }
    }
  }
}
