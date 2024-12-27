import * as THREE from 'three'
import { GUI } from 'dat.gui'

const enable_light_helper: boolean = false

export class Light {
  dir_light: THREE.DirectionalLight
  dir_light_helper?: THREE.DirectionalLightHelper

  ambient_light: THREE.AmbientLight
  
  parentGUI?: GUI
  light_folder?: GUI;

  constructor(public scene: THREE.Scene) {
    this.dir_light = new THREE.DirectionalLight(0xffffff, 0.8)
    // this.dir_light.color.setHSL( 0.1, 1, 0.95 )
    // this.dir_light.position.set(this.x, this.y, this.z)
    // this.dir_light.position.set( 0.001, 0.001, 0.001 );
    // this.dir_light.position.multiplyScalar(2);
    this.x = 50;
    this.y = 50;
    this.z = 50;

    this.dir_light.castShadow = true;

    this.map_width = 4096;
    this.map_height = 4096;
    // this.dir_light.shadow.mapSize.width = 4096
    // this.dir_light.shadow.mapSize.height = 4096
    this.dir_light.intensity = 3;
    // this.dir_light.opacity = 0.7;
    // const d = 50;

    this.frustum = 50;
    // this.dir_light.shadow.camera.left = -this.frustum;
    // this.dir_light.shadow.camera.right = this.frustum;
    // this.dir_light.shadow.camera.top = this.frustum;
    // this.dir_light.shadow.camera.bottom = -this.frustum;

    this.shadow_camera_near = 1;
    this.shadow_camera_far = 10;
    // this.dir_light.shadow.camera.near = 1
    // this.dir_light.shadow.camera.far = 100000
    // this.dir_light.shadow.bias = - 0.0001
    scene.add(this.dir_light)


    this.ambient_light = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(this.ambient_light)

    if(enable_light_helper) {
      this.dir_light_helper = new THREE.DirectionalLightHelper(this.dir_light, 100);
      scene.add(this.dir_light_helper)
    }
  }

  get x(): number {
    if(!this.dir_light) {
      return 50;
    }
    return this.dir_light.position.x;
  }

  get y(): number {
    if(!this.dir_light) {
      return 50;
    }
    return this.dir_light.position.y;
  }

  get z(): number {
    if(!this.dir_light) {
      return 50;
    }
    return this.dir_light.position.z;
  }

  set x(val: number) {
    console.assert(this.dir_light);
    if(!this.dir_light) {
      return;
    }
    this.dir_light.position.setX(val);
  }

  set y(val: number) {
    console.assert(this.dir_light);
    if(!this.dir_light) {
      return;
    }
    this.dir_light.position.setY(val);
  }

  set z(val: number) {
    console.assert(this.dir_light);
    if(!this.dir_light) {
      return;
    }
    this.dir_light.position.setZ(val);
  }

  get frustum(): number {
    if(!this.dir_light) {
      return 50;
    }
    return this.dir_light.shadow.camera.right;
  }

  set frustum(val: number) {
    console.assert(this.dir_light);
    if(!this.dir_light) {
      return;
    }
    this.dir_light.shadow.camera.left = -val;
    this.dir_light.shadow.camera.right = val;
    this.dir_light.shadow.camera.top = val;
    this.dir_light.shadow.camera.bottom = -val;
  }

  get map_width(): number {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return -1;
    }
    return this.dir_light.shadow.mapSize.width;
  }

  set map_width(val: number) {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return;
    }
    this.dir_light.shadow.mapSize.width = val;
  }


  get map_height(): number {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return -1;
    }
    return this.dir_light.shadow.mapSize.height;
  }

  set map_height(val: number) {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return;
    }
    this.dir_light.shadow.mapSize.height = val;
  }

  get shadow_camera_near(): number {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return -1;
    }
    return this.dir_light.shadow.camera.near;
  }

  set shadow_camera_near(val: number) {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return;
    }
    this.dir_light.shadow.camera.near = val;
  }


  get shadow_camera_far(): number {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return -1;
    }
    return this.dir_light.shadow.camera.far;
  }

  set shadow_camera_far(val: number) {
    if(!this.dir_light) {
      console.error('dir_light is nil');
      return;
    }
    this.dir_light.shadow.camera.far = val;
  }

  dispose() {
    this.disposeGUI();

    if(this.dir_light_helper) this.scene.remove(this.dir_light_helper)
    if(this.dir_light) this.scene.remove(this.dir_light)

    if(this.ambient_light) this.scene.remove(this.ambient_light)
  }

  initGUI(parentGUI: any) {
    console.log('initGUI');
    this.parentGUI = parentGUI;
    this.light_folder = parentGUI.addFolder('Light');
    if(!this.light_folder) {
      console.error('failed to create a folder');
      return;
    }

    const map = this.light_folder.addFolder('Map');
    map.add(this, 'map_width', 0, 4096).step(0.01).name('width');
    map.add(this, 'map_height', 0, 4096).step(0.01).name('height');

    this.light_folder.add(this, 'x', -100, 100).step(0.01).name('x'); 
    this.light_folder.add(this, 'y', -100, 100).step(0.01).name('y'); 
    this.light_folder.add(this, 'z', -100, 100).step(0.01).name('z');
    this.light_folder.add(this, 'frustum', -100, 100).step(0.01).name('frustum');
    this.light_folder.add(this, 'shadow_camera_near', 1, 100000).step(0.01).name('Shadow camera near');
    this.light_folder.add(this, 'shadow_camera_far', 1, 100000).step(0.01).name('Shadow camera far');
  }

  private disposeGUI() {
    if(this.parentGUI && this.light_folder) {
      try {
        this.parentGUI.removeFolder(this.light_folder);
      }
      catch(e) {
        console.warn(e);
      }
    }
  }
}
