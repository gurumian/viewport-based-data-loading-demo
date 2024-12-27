import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { DefaultViewPart } from './view_part/default_view_part'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import * as TWEEN from '@tweenjs/tween.js';
import EventEmitter from 'events';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'dat.gui';
import { isDebug } from './config';

const camera_helper_enabled: boolean = false;



export class Control extends EventEmitter{
  scene: THREE.Scene | null
  renderer: THREE.WebGLRenderer | null
  css3d_renderer?: CSS3DRenderer | null

  camera: THREE.PerspectiveCamera | null
  camera_helper?: THREE.CameraHelper
  controls: OrbitControls | null

  is_control_started: boolean = false
  is_dev_mode: boolean = (process.env.NODE_ENV === "development")

  // element: HTMLElement | null = null
  css3d_support: boolean = false

  stats: any | null

  constructor(public element: HTMLElement) {
    super()

    if(isDebug()) {
      this.is_dev_mode = true;
    }

    console.log(process.env.NODE_ENV)
    if(this.is_dev_mode) {
      this.stats = new Stats();
      document.body.appendChild( this.stats.dom );
    }

    this.scene = new THREE.Scene();
    this.scene.background = null;
    // this.scene.background = new THREE.Color(0xFFFFFF)
    // this.scene.fog = new THREE.Fog(new THREE.Color(0x666666), 1000, 50000)


    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    // this.renderer.setSize(window.innerWidth, window.innerHeight)
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(element.clientWidth, element.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: for softer shadows
    // this.renderer.setClearColor(0xFFFFFF, 1);
    this.renderer.setClearColor(0x8B0000, 1);
    // this.renderer = new THREE.WebGPURenderer( { antialias: true } );
    // this.renderer.toneMapping = THREE.NeutralToneMapping;
    // // this.renderer.setAnimationLoop( this.update );
    // this.renderer.setPixelRatio( window.devicePixelRatio );
    // this.renderer.shadowMap.enabled = true
    // this.renderer.setSize( window.innerWidth, window.innerHeight );
    
    if(this.css3d_support) {
      this.css3d_renderer = new CSS3DRenderer
      this.css3d_renderer.setSize(this.element.clientWidth, this.element.clientHeight);
      this.css3d_renderer.domElement.style.position = 'absolute'
      this.css3d_renderer.domElement.style.top = '0px'
      this.css3d_renderer.domElement.style.pointerEvents = 'none'
      this.css3d_renderer.domElement.style.zIndex = '1'
      this.css3d_renderer.domElement.style.background = 'none'
    }

    // if(this.element) {
    //   this.element.setAttribute('data-long-press-delay', '500') // long-press-event
    //   this.element.appendChild(this.renderer.domElement)
    // }

    this.camera = new THREE.PerspectiveCamera(50, element.clientWidth / element.clientHeight, 0.1, 10)
    // this.camera.position.x = -60
    // this.camera.position.y = 10
    // this.camera.position.z = 60
    // this.camera.position.x = 0
    // this.camera.position.y = 0
    // this.camera.position.z = 0.5
    this.camera_pos_x = 0;
    this.camera_pos_y = 0;
    this.camera_pos_z = 0.8;

    if(camera_helper_enabled) {
      this.camera_helper = new THREE.CameraHelper( this.camera );
      this.scene.add( this.camera_helper );
    }
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    // this.controls.enableDamping = true // Add smooth damping effect
    // this.controls.dampingFactor = 0.05

    this.controls.maxPolarAngle = Math.PI / 2 - 0.1 ;
    this.controls.addEventListener('start', () => {
      // stopCameraAnimation();
      this.is_control_started = true
      this.emit('dragstart')
    });
    this.controls.addEventListener('end', () => {
      // stopCameraAnimation();
      this.is_control_started = false
      this.emit('dragend')
    });
  }

  render() {
    if(!this.scene || !this.renderer || !this.camera) return

    if(this.css3d_renderer) {
      this.css3d_renderer.render(this.scene, this.camera)
    }

    this.renderer.render(this.scene, this.camera)
  }

  public init() {
    if(!this.renderer) {
      console.error('renderer is nil. This is not expected')
      return;
    }

    this.renderer.setSize(this.element.clientWidth, this.element.clientHeight)
    
    if(this.element) {
      this.element.appendChild(this.renderer.domElement)

      if(this.css3d_support && this.css3d_renderer) {
        this.element.appendChild(this.css3d_renderer.domElement)
      }
    }
    else {
      console.warn(`container doesn't exist`)
    }

    window.addEventListener('resize', () => {
      if(!this.camera || !this.renderer) return;
      
      this.camera.aspect = this.element.clientWidth / this.element.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.element.clientWidth, this.element.clientHeight)
      this.render()
    }, false)
  }

  update(): void {
    if(!this.is_control_started) TWEEN.update()
    this.controls?.update()
    
    if(this.camera_helper) this.camera_helper.update();

    if(this.stats) this.stats.update();
    this.render()
  }

  get capture_stream() : MediaStream | undefined {
    if(!this.renderer || !this.renderer.domElement) return undefined
    return this.renderer.domElement.captureStream(25)
  }

  // initSettings(settings: GUI) {
  //   const camera = settings.addFolder('Camera');
  //   const position = camera.addFolder('Position');

  //   position.add(this, 'camera_pos_x', -10, 10).name('x').listen(); 
  //   position.add(this, 'camera_pos_y', -10, 10).name('y').listen(); 
  //   position.add(this, 'camera_pos_z', -10, 10).name('z').listen(); 
  // }

  get camera_pos_x() {
    if(!this.camera) return 0; // TODO
    return this.camera.position.x;
  }

  set camera_pos_x(x: number) {
    if(!this.camera) return;
    this.camera.position.setX(x);
  }

  get camera_pos_y() {
    if(!this.camera) return 0;
    return this.camera.position.y;
  }

  set camera_pos_y(y: number) {
    if(!this.camera) return;
    this.camera.position.setY(y);
  }

  get camera_pos_z() {
    if(!this.camera) return 0;
    return this.camera.position.z;
  }

  set camera_pos_z(z: number) {
    if(!this.camera) return;
    this.camera.position.setZ(z);
  }



  dispose() {
    this.disposeGUI();

    this.scene?.traverse((object: any) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material: any) => material.dispose());
        }
        else {
          object.material.dispose();
        }
      }
    });

    this.scene = null;

    if(this.camera) {
      this.camera = null;
    }

    if(this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if(this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  get background_color(): number[] {
    if (this.renderer) {
      const color = this.renderer.getClearColor(new THREE.Color());
      const alpha = this.renderer.getClearAlpha();
      return [
        Math.round(color.r * 255),
        Math.round(color.g * 255),
        Math.round(color.b * 255),
        alpha
      ];
    }
    return [0, 0, 0, 1];
  }

  set background_color(arg_color: number[]) {
    if (this.renderer) {
      const [r, g, b, a] = arg_color;
      const color = new THREE.Color(r / 255, g / 255, b / 255);
      this.renderer.setClearColor(color, a);
    }
  }

  initGUI(parentGUI: any) {
    const three = parentGUI.addFolder('3D');
    const camera = three.addFolder('Camera');
    const position = camera.addFolder('Position');

    const renderer = three.addFolder('Renderer');

    position.add(this, 'camera_pos_x', -10, 10).step(0.01).name('x'); 
    position.add(this, 'camera_pos_y', -10, 10).step(0.01).name('y'); 
    position.add(this, 'camera_pos_z', -10, 10).step(0.01).name('z');

    renderer.addColor(this, 'background_color').name('Color').onChange((value: any) => {
      console.log(`new color ${value}`)
    })
  }

  disposeGUI() {

  }
}
