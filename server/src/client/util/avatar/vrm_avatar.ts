import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Avatar } from "./avatar";
import { VRMLoaderPlugin, VRM, VRMUtils, VRMHumanBoneName } from '@pixiv/three-vrm';
import { FaceLandmarkerResult, PoseLandmarkerResult } from "@mediapipe/tasks-vision";



interface VRMJson {
  extensionsUsed?: string[];
  extensions?: {
    VRM?: {
      exporterVersion: string;
    };
    VRMC_vrm?: {
      specVersion: string;
    };
  };
}

function parseVRMVersion(arrayBuffer: ArrayBuffer): string {
  const dataView = new DataView(arrayBuffer);
  
  // Check GLB magic
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546C67) {
    throw new Error('Invalid GLB file');
  }
  
  // Skip version and file length
  const jsonChunkLength = dataView.getUint32(12, true);
  const jsonChunk = new Uint8Array(arrayBuffer, 20, jsonChunkLength);
  
  // Parse JSON
  const jsonString = new TextDecoder().decode(jsonChunk);
  const json: VRMJson = JSON.parse(jsonString);
  
  return getVRMVersionFromJSON(json);
}

function getVRMVersionFromJSON(json: VRMJson): string {
  console.log(json);
  if (json.extensionsUsed && json.extensionsUsed.includes('VRM') && json.extensions?.VRM) {
    // VRM 0.0
    console.log("VRM 0.0");
    // return json.extensions.VRM.exporterVersion;
    return "0.0";
  }
  else if (json.extensions?.VRMC_vrm) {
    // VRM 1.0
    console.log("VRM 1.0");
    // return json.extensions.VRMC_vrm.specVersion;
    return "1.0";
  }
  else {
    throw new Error('Not a valid VRM file');
  }
}

function getVersion(url: string): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const vrmVersion = parseVRMVersion(arrayBuffer);
        console.log('VRM Version:', vrmVersion);
        res(vrmVersion);
      }
      catch (error) {
        console.error('Error parsing VRM file:', error);
        rej(error);
      }
    };
  
    fetch(url)
    .then(async (response) => {
      const blob = await response.blob();
      reader.readAsArrayBuffer(blob); 
    });
  })
}

export class VRMAvatar extends Avatar {
  vrm: VRM | null = null;

  private neutralLeftEyebrowPositions: number[] = [];
  private neutralRightEyebrowPositions: number[] = [];

  isLegacyVRM: boolean = false;

  constructor() {
    super();
  }

  async init(url: string) {
    try {
      const vrmVersion = await getVersion(url);
      console.log(vrmVersion);
      if(vrmVersion !== "1.0") {
        console.log("0.0 legacy version!")
        this.isLegacyVRM = true;
      }

      const vrm = await this.load(url);
      // this.scene.add(vrm.scene);
      if(this.isLegacyVRM) {
        vrm.scene.rotation.y = Math.PI;
      }

      vrm.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      this.vrm = vrm;
      // this.vrm.springBoneManager?.reset();
      // vrm.humanoid.resetNormalizedPose();
      this.setNaturalPose(vrm);

      return this.vrm.scene;
    }
    catch (e) {
      console.error(e);
    }
  }

  dispose() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      // this.scene.remove(this.vrm.scene);
      this.vrm = null;
    }
  }

  get scene() {
    return this.vrm?.scene;
  }

  protected load(url: string): Promise<VRM> {
    console.log(`url: ${url}`)
    return new Promise((res, rej) => {
      const loader = new GLTFLoader();
      loader.register((parser: any) => new VRMLoaderPlugin(parser));
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          console.log(vrm);
          res(vrm);
        },
        (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
        (error) => {
          console.error(error);
          rej(error);
        }
      );
    });
  }

  updateFace(result: FaceLandmarkerResult) {
    if (!this.vrm || !result.faceLandmarks || result.faceLandmarks.length === 0) return;

    // this.initializeNeutralEyebrowDistances(result.faceLandmarks[0]);
    
    const landmarks = result.faceLandmarks[0];
    const expressionManager = this.vrm.expressionManager;
    if (!expressionManager) return;

    // Eye Blink
    const leftEyeOpenness = Math.max(0, Math.min(this.calculateEyeOpenness(landmarks, 159, 145, 33, 133), 1));
    const rightEyeOpenness = Math.max(0, Math.min(this.calculateEyeOpenness(landmarks, 386, 374, 362, 263), 1));
    expressionManager.setValue('blinkLeft', 1 - leftEyeOpenness);
    expressionManager.setValue('blinkRight', 1 - rightEyeOpenness);

    // Mouth Shapes for Vowel Sounds
    // expressionManager.setValue('ee', this.calculateEeShape(landmarks));
    // expressionManager.setValue('ih', this.calculateIhShape(landmarks));
    expressionManager.setValue('aa', this.calculateAaShape(landmarks));
    expressionManager.setValue('oh', this.calculateOhShape(landmarks));
    expressionManager.setValue('ou', this.calculateOuShape(landmarks));

    // console.log(expressionManager);


    

    // Eyebrow Movement
    const leftEyebrowIndices = [46, 53, 52, 65, 55]; // Left eyebrow landmarks
    const rightEyebrowIndices = [276, 283, 282, 295, 285]; // Right eyebrow landmarks

    if (
      this.neutralLeftEyebrowPositions.length === 0 ||
      this.neutralRightEyebrowPositions.length === 0
    ) {
      // Initialize neutral positions if not done yet
      this.initializeNeutralEyebrowPositions(landmarks);
    }

    // Calculate eyebrow movements
    const leftEyebrowMovements = this.calculateEyebrowMovement(
      landmarks,
      leftEyebrowIndices,
      this.neutralLeftEyebrowPositions
    );

    const rightEyebrowMovements = this.calculateEyebrowMovement(
      landmarks,
      rightEyebrowIndices,
      this.neutralRightEyebrowPositions
    );

    // Calculate average movement for inner and outer parts
    const leftInnerMovement = (leftEyebrowMovements[2] + leftEyebrowMovements[3]) / 2;
    const leftOuterMovement = (leftEyebrowMovements[0] + leftEyebrowMovements[1]) / 2;

    const rightInnerMovement = (rightEyebrowMovements[2] + rightEyebrowMovements[3]) / 2;
    const rightOuterMovement = (rightEyebrowMovements[0] + rightEyebrowMovements[1]) / 2;

    // Map the movements to VRM expressions
    expressionManager.setValue('BrowInnerUp', Math.max(0, (leftInnerMovement + rightInnerMovement) / 2));

    expressionManager.setValue('BrowOuterUpLeft', Math.max(0, leftOuterMovement));
    expressionManager.setValue('BrowOuterUpRight', Math.max(0, rightOuterMovement));

    expressionManager.setValue('BrowDownLeft', Math.max(0, -leftInnerMovement));
    expressionManager.setValue('BrowDownRight', Math.max(0, -rightInnerMovement));


    // Head Rotation
    const head = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head);
    if (head) {
      const headRotation = this.calculateHeadRotation(landmarks);
      const smoothedRotation = this.smoothRotation(head.rotation, headRotation);
      head.rotation.set(smoothedRotation.x, smoothedRotation.y, smoothedRotation.z, smoothedRotation.order);
    }

    // Eye Tracking with Refined Gaze
    this.updateEyeGaze(landmarks);

    this.vrm.update(this.clock.getDelta());

    
    

    // if(this.vrm.springBoneManager) {
      // const gravityVector = new THREE.Vector3(0, -9.8, 0);
    //   this.vrm.springBoneManager!.reset();
    //   const joints = this.vrm.springBoneManager.joints;
    //   joints.forEach((joint: any) => {
    //     joint.bone.position.add(gravityVector.clone().multiplyScalar(0.00002)); // Scale factor to adjust gravity strength
    //   });
    //   this.vrm.springBoneManager.update(this.clock.getDelta());
    // }
  }

  private updateEyeGaze(landmarks: any[]) {
    if (!this.vrm) return;

    // Adjust the gaze direction scaling factor
    const gazeFactor = 0.1; // Reduce this value to lessen the movement

    // Left eye gaze calculation
    const leftEyeBone = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftEye);
    if (leftEyeBone) {
      const leftEyeRotation = this.calculateEyeRotation(landmarks, 468, 33, 133).multiplyScalar(gazeFactor);
      leftEyeBone.rotation.set(leftEyeRotation.x, leftEyeRotation.y, 0);
    }

    // Right eye gaze calculation
    const rightEyeBone = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightEye);
    if (rightEyeBone) {
      const rightEyeRotation = this.calculateEyeRotation(landmarks, 473, 362, 263).multiplyScalar(gazeFactor);
      rightEyeBone.rotation.set(rightEyeRotation.x, rightEyeRotation.y, 0);
    }
  }

  private calculateEyeRotation(landmarks: any[], pupilIndex: number, innerCornerIndex: number, outerCornerIndex: number): THREE.Vector3 {
    const innerCorner = new THREE.Vector3(landmarks[innerCornerIndex].x, landmarks[innerCornerIndex].y, landmarks[innerCornerIndex].z);
    const outerCorner = new THREE.Vector3(landmarks[outerCornerIndex].x, landmarks[outerCornerIndex].y, landmarks[outerCornerIndex].z);
    const pupil = new THREE.Vector3(landmarks[pupilIndex].x, landmarks[pupilIndex].y, landmarks[pupilIndex].z);

    // Calculate the direction vector for gaze
    const eyeCenter = innerCorner.clone().add(outerCorner).multiplyScalar(0.5);
    const gazeDirection = pupil.clone().sub(eyeCenter).normalize();

    // Apply constraints to limit eye rotation
    const maxRotationX = 0.2; // Limit vertical rotation
    const maxRotationY = 0.2; // Limit horizontal rotation

    return new THREE.Vector3(
      THREE.MathUtils.clamp(gazeDirection.y, -maxRotationX, maxRotationX),
      THREE.MathUtils.clamp(gazeDirection.x, -maxRotationY, maxRotationY),
      0
    );
  }

  private calculateEyeOpenness(landmarks: any[], upper: number, lower: number, inner: number, outer: number): number {
    const upperPoint = new THREE.Vector3(landmarks[upper].x, landmarks[upper].y, landmarks[upper].z);
    const lowerPoint = new THREE.Vector3(landmarks[lower].x, landmarks[lower].y, landmarks[lower].z);
    const innerPoint = new THREE.Vector3(landmarks[inner].x, landmarks[inner].y, landmarks[inner].z);
    const outerPoint = new THREE.Vector3(landmarks[outer].x, landmarks[outer].y, landmarks[outer].z);

    const eyeHeight = upperPoint.distanceTo(lowerPoint);
    const eyeWidth = innerPoint.distanceTo(outerPoint);

    const openness = Math.max(0, Math.min(eyeHeight / eyeWidth, 1));
    // return openness * 1.5; // Scaling factor to amplify the openness value
    
    return openness * 2.0;
  }

  private calculateMouthOpenness(landmarks: any[], upper: number, lower: number, left: number, right: number): number {
    const upperPoint = new THREE.Vector3(landmarks[upper].x, landmarks[upper].y, landmarks[upper].z);
    const lowerPoint = new THREE.Vector3(landmarks[lower].x, landmarks[lower].y, landmarks[lower].z);
    const leftPoint = new THREE.Vector3(landmarks[left].x, landmarks[left].y, landmarks[left].z);
    const rightPoint = new THREE.Vector3(landmarks[right].x, landmarks[right].y, landmarks[right].z);

    const mouthHeight = upperPoint.distanceTo(lowerPoint);
    const mouthWidth = leftPoint.distanceTo(rightPoint);

    return Math.min(mouthHeight / mouthWidth, 3);
  }

  private calculateAaShape(landmarks: any[]): number {
    // 'aa' is similar to an open mouth
    return this.calculateMouthOpenness(landmarks, 13, 14, 78, 308);
  }
  
  // private calculateEeShape(landmarks: any[]): number {
  //   // 'ee' is a wide, slightly open mouth
  //   const mouthWidth = this.calculateMouthWidth(landmarks, 78, 308);
  //   const mouthHeight = this.calculateMouthHeight(landmarks, 13, 14);
  //   return Math.min(mouthWidth / mouthHeight, 1) * 0.7; // Scaling factor
  // }
  
  // private calculateIhShape(landmarks: any[]): number {
  //   // 'ih' is similar to 'ee' but less wide
  //   const eeShape = this.calculateEeShape(landmarks);
  //   return eeShape * 0.7; // Slightly less wide than 'ee'
  // }
  
  private calculateOhShape(landmarks: any[]): number {
    // 'oh' is a rounded, moderately open mouth
    const openness = this.calculateMouthOpenness(landmarks, 13, 14, 78, 308);
    const roundness = 1 - this.calculateMouthWidth(landmarks, 78, 308) / this.calculateMouthHeight(landmarks, 13, 14);
    return (openness + roundness) / 2;
  }
  
  private calculateOuShape(landmarks: any[]): number {
    // 'ou' is a small, rounded mouth
    const openness = this.calculateMouthOpenness(landmarks, 13, 14, 78, 308) * 0.5; // Less open than 'oh'
    const roundness = 1 - this.calculateMouthWidth(landmarks, 78, 308) / this.calculateMouthHeight(landmarks, 13, 14);
    return (openness + roundness) / 2;
  }
  
  private calculateMouthWidth(landmarks: any[], left: number, right: number): number {
    const leftPoint = new THREE.Vector3(landmarks[left].x, landmarks[left].y, landmarks[left].z);
    const rightPoint = new THREE.Vector3(landmarks[right].x, landmarks[right].y, landmarks[right].z);
    return leftPoint.distanceTo(rightPoint);
  }
  
  private calculateMouthHeight(landmarks: any[], upper: number, lower: number): number {
    const upperPoint = new THREE.Vector3(landmarks[upper].x, landmarks[upper].y, landmarks[upper].z);
    const lowerPoint = new THREE.Vector3(landmarks[lower].x, landmarks[lower].y, landmarks[lower].z);
    return upperPoint.distanceTo(lowerPoint);
  }

  // Method to initialize neutral positions
  private initializeNeutralEyebrowPositions(landmarks: any[]) {
    // Left eyebrow
    const leftEyebrowIndices = [46, 53, 52, 65, 55];
    this.neutralLeftEyebrowPositions = leftEyebrowIndices.map(
      (index) => landmarks[index].y
    );

    // Right eyebrow
    const rightEyebrowIndices = [276, 283, 282, 295, 285];
    this.neutralRightEyebrowPositions = rightEyebrowIndices.map(
      (index) => landmarks[index].y
    );
  }


  // private smoothEyebrowMovements(newMovements: number[], previousMovements: number[], smoothingFactor: number = 0.3): number[] {
  //   return newMovements.map((newValue, index) => {
  //     const prevValue = previousMovements[index] || 0;
  //     return prevValue + (newValue - prevValue) * smoothingFactor;
  //   });
  // }
  
  // Helper method to calculate eyebrow movement
  private calculateEyebrowMovement(
    landmarks: any[],
    eyebrowIndices: number[],
    neutralEyebrowPositions: number[]
  ): number[] {
    let movements: number[] = [];
    for (let i = 0; i < eyebrowIndices.length; i++) {
      const index = eyebrowIndices[i];
      const currentY = landmarks[index].y;
      const neutralY = neutralEyebrowPositions[i];
      let movement = (neutralY - currentY) / neutralY;

      // const faceSizeY = Math.abs(landmarks[10].y - landmarks[152].y);
      // Adjust sensitivity
      const sensitivityFactor = 1.2// * (0.2 / faceSizeY); //1.2 //2.0; // Adjust as needed
      movement *= sensitivityFactor;

      // Clamp the value between -1 and 1
      movement = THREE.MathUtils.clamp(movement, -1, 1);

      movements.push(movement);
    }
    return movements;
  }


  private smoothRotation(current: THREE.Euler, target: THREE.Euler, smoothFactor: number = 0.5): THREE.Euler {
    return new THREE.Euler(
      current.x + (target.x - current.x) * smoothFactor,
      current.y + (target.y - current.y) * smoothFactor,
      current.z + (target.z - current.z) * smoothFactor
    );
  }

  private calculateHeadRotation(landmarks: any[]): THREE.Euler {
    // Extract landmark positions
    const nose = new THREE.Vector3(landmarks[1].x, landmarks[1].y, landmarks[1].z);
    const leftEye = new THREE.Vector3(landmarks[33].x, landmarks[33].y, landmarks[33].z);
    const rightEye = new THREE.Vector3(landmarks[263].x, landmarks[263].y, landmarks[263].z);
    const leftMouth = new THREE.Vector3(landmarks[61].x, landmarks[61].y, landmarks[61].z);
    const rightMouth = new THREE.Vector3(landmarks[291].x, landmarks[291].y, landmarks[291].z);
  
    // Calculate midpoints
    const eyeCenter = new THREE.Vector3().addVectors(leftEye, rightEye).multiplyScalar(0.5);
    const mouthCenter = new THREE.Vector3().addVectors(leftMouth, rightMouth).multiplyScalar(0.5);
  
    // Calculate face orientation vectors
    const faceForward = new THREE.Vector3().subVectors(nose, eyeCenter).normalize(); // From eye center to nose
    const faceUp = new THREE.Vector3().subVectors(eyeCenter, mouthCenter).normalize(); // From mouth center to eye center
    const faceRight = new THREE.Vector3().crossVectors(faceUp, faceForward).normalize(); // Right vector
  
    // Correct faceUp to ensure orthogonality
    faceUp.crossVectors(faceForward, faceRight).normalize();
  
    // Build rotation matrix
    const rotationMatrix = new THREE.Matrix4().makeBasis(faceRight, faceUp, faceForward);
  
    // Adjust for coordinate system differences
    // const correctionMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2); // Rotate 90 degrees around X-axis
    // const offset = Math.PI / 2;
    const offset = (Math.PI/3) * 2;
    const correctionMatrix = new THREE.Matrix4().makeRotationX(offset); // Rotate 90 degrees around X-axis
    rotationMatrix.multiply(correctionMatrix);
  
    // Extract Euler angles
    const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'XYZ');
  
    // Return the Euler angles
    if(this.isLegacyVRM) {
      return new THREE.Euler(
        -euler.x,
        -euler.y,
        euler.z,
        'XYZ'
      );
    }
    return euler;
  }
  

  updatePose(result: PoseLandmarkerResult) {
    if (!this.vrm || !result.landmarks || result.landmarks.length === 0) return;

    const landmarks = result.landmarks[0];
    const humanoid = this.vrm.humanoid;
    if (!humanoid) return;

    // Update torso rotation (simplified for testing)
    this.applyTorsoRotation(humanoid, landmarks);

    // // Update Left and Right Arms
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.LeftUpperArm, landmarks, 11, 13);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.LeftLowerArm, landmarks, 13, 15);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.RightUpperArm, landmarks, 12, 14);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.RightLowerArm, landmarks, 14, 16);

    // Update Left and Right Legs
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.LeftUpperLeg, landmarks, 23, 25);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.LeftLowerLeg, landmarks, 25, 27);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.RightUpperLeg, landmarks, 24, 26);
    // this.applyLimbRotation(humanoid, VRMHumanBoneName.RightLowerLeg, landmarks, 26, 28);

    // this.vrm.update(this.clock.getDelta());
  }

  private applyTorsoRotation(humanoid: any, landmarks: any[]) {
    const torsoBone = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest) || 
                      humanoid.getNormalizedBoneNode(VRMHumanBoneName.UpperChest);
    if (!torsoBone) return;

    const leftShoulder = new THREE.Vector3(landmarks[11].x, landmarks[11].y, landmarks[11].z);
    const rightShoulder = new THREE.Vector3(landmarks[12].x, landmarks[12].y, landmarks[12].z);
    const spineDirection = new THREE.Vector3().subVectors(leftShoulder, rightShoulder).normalize();

    // Calculate rotation based on shoulder alignment
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), spineDirection);
    torsoBone.quaternion.slerp(targetQuaternion, 0.2); // Smooth the rotation
  }


  // private applyLimbRotation(humanoid: any, boneName: VRMHumanBoneName, landmarks: any[], startIndex: number, endIndex: number) {
  //   const bone = humanoid.getNormalizedBoneNode(boneName);
  //   if (!bone) return;

  //   const start = new THREE.Vector3(landmarks[startIndex].x, landmarks[startIndex].y, landmarks[startIndex].z);
  //   const end = new THREE.Vector3(landmarks[endIndex].x, landmarks[endIndex].y, landmarks[endIndex].z);

  //   // Calculate the direction vector between start and end landmarks
  //   const limbDirection = new THREE.Vector3().subVectors(end, start).normalize();
  //   const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), limbDirection);

  //   // Apply smoothed rotation to the bone
  //   bone.quaternion.slerp(targetQuaternion, 0.5);
  // }


  // private updateBodyPart(humanoid: any, boneName: VRMHumanBoneName, landmarks: any[], startIndex: number, endIndex: number, midIndex1?: number, midIndex2?: number) {
  //   const bone = humanoid.getNormalizedBoneNode(boneName);
  //   if (!bone) return;

  //   const start = new THREE.Vector3(landmarks[startIndex].x, landmarks[startIndex].y, landmarks[startIndex].z);
  //   const end = new THREE.Vector3(landmarks[endIndex].x, landmarks[endIndex].y, landmarks[endIndex].z);

  //   let direction = new THREE.Vector3().subVectors(end, start).normalize();

  //   if (midIndex1 !== undefined && midIndex2 !== undefined) {
  //       const mid1 = new THREE.Vector3(landmarks[midIndex1].x, landmarks[midIndex1].y, landmarks[midIndex1].z);
  //       const mid2 = new THREE.Vector3(landmarks[midIndex2].x, landmarks[midIndex2].y, landmarks[midIndex2].z);
  //       const midPoint = new THREE.Vector3().addVectors(mid1, mid2).multiplyScalar(0.5);
  //       direction = new THREE.Vector3().subVectors(midPoint, start).normalize();
  //   }

  //   const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  //   bone.quaternion.slerp(targetQuaternion, 0.5);
  // }

  setNaturalPose(vrm: VRM) {
    // Upper arms
    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
    const rightUpperArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
  
    // Lower arms
    // const leftLowerArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm);
    // const rightLowerArm = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm);
  
    // Hands
    const leftHand = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftHand);
    const rightHand = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightHand);
  
    // Apply rotations if bones are available
    if (leftUpperArm && rightUpperArm) {
      if(this.isLegacyVRM) {
        leftUpperArm.rotation.z = -THREE.MathUtils.degToRad(-65);
        rightUpperArm.rotation.z = -THREE.MathUtils.degToRad(65);  
      }
      else {
        leftUpperArm.rotation.z = THREE.MathUtils.degToRad(-65);
        rightUpperArm.rotation.z = THREE.MathUtils.degToRad(65);
      }
      
      // leftUpperArm.rotation.x = -THREE.MathUtils.degToRad(25);
      // rightUpperArm.rotation.x = -THREE.MathUtils.degToRad(25);
    }
  
    // if (leftLowerArm && rightLowerArm) {
    //   if(this.isLegacyVRM) {
    //     leftLowerArm.rotation.z = -THREE.MathUtils.degToRad(-45);
    //     rightLowerArm.rotation.z = -THREE.MathUtils.degToRad(45);
    //   }
    // }
  
    if (leftHand && rightHand) {
      leftHand.rotation.z = 0;
      rightHand.rotation.z = 0;
    }
  }

  get upperHeight(): number {
    const head = this.vrm?.humanoid.getNormalizedBoneNode('head');
    const hips = this.vrm?.humanoid.getNormalizedBoneNode('hips');

    if (!head || !hips) {
      console.error('Head or hips bone not found');
      return 0;
    }

    const headPosition = new THREE.Vector3();
    const hipsPosition = new THREE.Vector3();

    head.getWorldPosition(headPosition);
    hips.getWorldPosition(hipsPosition);

    const height = headPosition.y - hipsPosition.y;
    return height;
  }
}
