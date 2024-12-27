import * as THREE from "three";
import { useGraph } from "./useGraph";
import { FaceLandmarkerResult, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export abstract class Avatar {
  protected clock: THREE.Clock;

  constructor() {
    this.clock = new THREE.Clock();
  }

  async init(url: string) {
    let gltf = await this.load(url);
    // let gltf = await this.load(`images/avatar.glb`);
    
    const { nodes } = useGraph(gltf.scene);
    console.log(nodes);
    // this.scene.add(gltf.scene);

    return gltf.scene;
  }

  protected abstract load(url: string): Promise<any>;
  abstract updateFace(result: FaceLandmarkerResult): void;
  abstract updatePose(result: PoseLandmarkerResult): void;

  dispose() {}
}
