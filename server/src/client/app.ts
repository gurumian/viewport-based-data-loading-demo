import { Parts } from './view_part/parts'
import { Router } from './router'
import { LoginViewPart } from './view_part/login/login_view_part'
import { HomeViewPart } from './view_part/home/home_view_part'
import { ChatViewPart } from './view_part/chat/chat_view_part'
import { UserViewPart } from './view_part/home/user_view_part'

export enum State {
  none,
  prepared,
  started,
  stopped,
  paused
}

export class App {
  router: Router
  
  constructor() {
    this.router = Router.getInstance()
  }

  public init() {
    this.router.init()
    this.router.register(Parts.login, new LoginViewPart(this.router.control))
    this.router.register(Parts.home, new HomeViewPart(this.router.control))
    this.router.register(Parts.user, new UserViewPart(this.router.control)) 
    this.router.register(Parts.chat, new ChatViewPart(this.router.control))

    this.router.requestStart(Parts.login)
  }

  render() {
    this.router.control.render()
  }

  update(): void {
    this.router.update()
    this.render()
  }
}
