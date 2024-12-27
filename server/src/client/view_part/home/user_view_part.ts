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

export class UserViewPart extends ViewPart {
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
      <div id="user-header">
        <button id="back-button" class="back-button">❮</button>
      </div>
      <div id="user-page" class="home-page">
        <p>TokTokTalk</p>
        <div id="auth">
          <button id="login-btn" class="button">login</button>
          <img id="user-image"></img>
          <p id="user-name"></p>
        </div>
        <div id="users"></div>
      </div>
    `;

    content.querySelector('#back-button')?.addEventListener('click', (event) => {
        console.log('back button clicked');
        event.stopPropagation();
        Router.getInstance().requestStart(Parts.home);
    });
  }

  async onstart(args?: any) {
    console.log(`>>>>>>>>>>>>>> UserViewPart::onstart ${args}`)

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

    let container = document.getElementById('default-view-container');
    if(container) {
      container.remove();
    }
  }
}
