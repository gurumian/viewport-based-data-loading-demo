// import * as THREE from "three";
// import { Camera } from "@mediapipe/camera_utils";
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
  // DrawingUtils,
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
// import * as Kalidokit from 'kalidokit';
import EventEmitter from "events";
import { Camera } from "./camera";
import { GUI } from "dat.gui";

// import { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/face_landmarker';

const pose_support: boolean = true;
const face_support: boolean = true;


export function roundLandmarks(result: FaceLandmarkerResult, decimals: number = 4): FaceLandmarkerResult {
  if (!result.faceLandmarks) {
    return result;
  }

  const roundedFaceLandmarks = result.faceLandmarks.map(faceLandmarks => 
    faceLandmarks.map(landmark => ({
      x: Number(landmark.x.toFixed(decimals)),
      y: Number(landmark.y.toFixed(decimals)),
      z: Number(landmark.z.toFixed(decimals))
    } as NormalizedLandmark))
  );

  return {
    ...result,
    faceLandmarks: roundedFaceLandmarks
  };
}


export class MotionCapture extends EventEmitter {
  private faceLandmarker: FaceLandmarker | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private camera?: Camera | null = null;

  _helperEnabled: boolean = false;
  _videoEnabled: boolean = false;

  constructor(
    private video: HTMLVideoElement,
    private canvas?: HTMLCanvasElement
  ) {
    super();
    if(canvas) {
      this.context = canvas.getContext("2d");
    }
    
    // this.clock = new THREE.Clock();
  }

  get videoEnabled() {
    return this._videoEnabled;
  }

  set videoEnabled(enable: boolean) {
    this._videoEnabled = enable;
    if(this._videoEnabled) {
      this.video.style.display = 'block';
    }
    else {
      this.video.style.display = 'none';
    }
  }

  get helperEnabled() {
    if(!this.canvas) false;
    return this._helperEnabled;
  }

  set helperEnabled(enable: boolean) {
    if(!this.canvas) return;

    this._helperEnabled = enable;
    if(this._helperEnabled) {
      this.canvas.style.display = 'block';
    }
    else {
      this.canvas.style.display = 'none';
    }
  }

  private async setupTrackers() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    if(face_support) {
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
    }

    if(pose_support) {
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
      });
    }
  }

  private async processFrame(videoElement: HTMLVideoElement) {
    if((videoElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) ||
      (videoElement.videoWidth == 0) ||
      (videoElement.videoHeight == 0)) {
      return;
    }

    if (!this.faceLandmarker && !this.poseLandmarker) return;

    let faceResults;
    if(face_support && this.faceLandmarker) {
      faceResults = this.faceLandmarker.detectForVideo(
        videoElement,
        performance.now()
      );
    }
    

    let poseResults;
    if(pose_support && this.poseLandmarker) {
      poseResults = this.poseLandmarker.detectForVideo(
        videoElement,
        performance.now()
      );
    }

    if (faceResults && faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
      this.emit("face", faceResults);
    }

    if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
      this.emit("pose", poseResults);
    }

    if(faceResults && poseResults) {
      this.emit("face_and_pose", {faceResults, poseResults});
    }

    // @mediapipe ~0.10.16. DrawingUtils hasn't supported since 0.10.17
    // if(this.helperEnabled) this.drawResultsOnCanvas(faceResults, poseResults);
  }

  // @mediapipe ~0.10.16. DrawingUtils hasn't supported since 0.10.17
  // private drawResultsOnCanvas(faceResults: any, poseResults: any) {
  //   if (!this.context || !this.canvas) return;
  //   this.context.save();
  //   this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  //   this.context.drawImage(
  //     this.video,
  //     0,
  //     0,
  //     this.canvas.width,
  //     this.canvas.height
  //   );

  //   const drawingUtils = new DrawingUtils(this.context);

  //   // Draw face landmarks
  //   if (faceResults && faceResults.faceLandmarks) {
  //     for (const landmarks of faceResults.faceLandmarks) {
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_TESSELATION,
  //         { color: "#C0C0C070", lineWidth: 1 }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
  //         { color: "#FF3030" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
  //         { color: "#30FF30" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
  //         { color: "#E0E0E0" }
  //       );

  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
  //         { color: "#FF8000" , lineWidth: 1}
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
  //         { color: "#FF8000", lineWidth: 1 }
  //       );

  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
  //         { color: "#FF8000" , lineWidth: 1}
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
  //         { color: "#FF8000", lineWidth: 1 }
  //       );
  //     }
  //   }

  //   // Draw pose landmarks
  //   if (poseResults && poseResults.landmarks) {
  //     for (const landmarks of poseResults.landmarks) {
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         PoseLandmarker.POSE_CONNECTIONS,
  //         { color: "#00FF00", lineWidth: 4 }
  //       );
  //       drawingUtils.drawLandmarks(landmarks, {
  //         color: "#FF0000",
  //         lineWidth: 2,
  //       });
  //     }
  //   }

  //   this.context.restore();
  // }

  async init() {
    await this.setupTrackers();

    this.camera = new Camera(this.video);
    await this.camera.init();
    this.camera.on('frame', (video: HTMLVideoElement) => {
      if (!this.video) return;
      if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
        this.processFrame(video);
      }
    });
    this.camera.start();
    // this.camera = new Camera(this.video, {
    //   onFrame: async () => {
    //     if (!this.video) return;
    //     if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
    //       return await this.processFrame(this.video);
    //     }
    //     else {
    //       console.log("Video not ready yet");
    //     }
    //   },
    //   width: 320,
    //   height: 240,
    // });

    // await this.camera.start();
  }

  update() {
    // if (this.vrm) {
    //   this.vrm.update(this.clock.getDelta());
    // }
  }

  dispose() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }

    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }

    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.camera) {
      this.camera.stop();
      this.camera.dispose();
      this.camera = null;
    }

    console.log("FullBodyTracker disposed");
  }

  initGUI() {
    
  }
}
