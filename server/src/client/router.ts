import { Control } from "./control";
import { ViewPart } from "./view_part";
// import { Control } from "./control";
// import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
// import { Camera } from "./camera"
// import { TrackballControls } from "./trackball_controls";


// export class ViewPart {
//   constructor(public control: Control) {
//   }

//   init(): Promise<void> {
//     return new Promise((res, _) => {
//       setTimeout(() => {
//         // this.started = true
//         res()
//       })
//     })
//   }

//   dispose(): void {
//     // this.started = false
//   }

//   update(): void {
//   }

//   onkeydown(event: KeyboardEvent) {
//     if (event.code === 'Space') {
//       // TODO
//     }
//   }
// }


export class Router {
  public static route(p: number, args: any) {
    let router = Router.getInstance()
    router.requestStart(p, args)
  }

  private static instance: Router;

  parts: {[key:string]: ViewPart} = {}
  current: number = 0
  control: Control

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }

    return Router.instance;
  }

  private constructor() {
    const element = document.getElementById('container') || document.body
    this.control = new Control(element)
    this.control.init()
  }

  init() {
    // if(!this.control)
    //   throw new Error('missing members')

    // document.addEventListener('keydown', (event) => {
    //   this.parts[this.current].onkeydown(event)
    // }, false)
  }

  async register(p: number, viewpart: ViewPart) {
    this.parts[p] = viewpart
    this.parts[p].init()
  }

  async unregister(p: number) {
    this.parts[p].dispose()
    delete this.parts[p]
  }

  async requestStart(p: number, args?: any) {
    // await this.control.camera?.reset()
    // this.controls?.reset()
    if(this.current == p) {
      console.log(`already ${p}`);
      return;
    }

    if(this.current) await this.requestStop(this.current)
    
    let part = this.parts[p];
    console.assert(part);

    console.log(`requestStart ${p} args:${args}`)
    console.log(part)
    await part.start(args);
    this.current = p
  }

  async requestStop(p?: number) {
    console.log(`requestStop ${p}`)
    p = p || this.current
    if(p) {
      let part = this.parts[p]
      if(!part) return
  
      await part.stop()
    }
    this.current = 0
  }

  update() {
    if(this.parts[this.current]) this.parts[this.current].update()
    this.control.update()
  }
}
