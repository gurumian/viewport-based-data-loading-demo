import * as THREE from "three";
import { Object3D, Material } from "three";

interface GraphResult {
  nodes: { [key: string]: Object3D };
  materials: { [key: string]: Material };
}

// export function useGraph(object: Object3D): GraphResult {
//   const nodes: { [key: string]: Object3D } = {};
//   const materials: { [key: string]: Material } = {};

//   object.traverse((obj: Object3D) => {
//     if (obj.name) {
//       nodes[obj.name] = obj;
//     }

//     const mesh = obj as THREE.Mesh;
//     if (mesh.material) {
//       const material = mesh.material as THREE.Material;
//       if (material.name && !materials[material.name]) {
//         materials[material.name] = material;
//       }
//     }
//   });

//   return { nodes, materials };
// }

export function useGraph(object: Object3D): GraphResult {
  const nodes: { [key: string]: Object3D } = {};
  const materials: { [key: string]: Material } = {};

  object.traverse((obj: Object3D) => {
    console.log(obj.name); // Log each node name
    if (obj.name) {
      nodes[obj.name] = obj;
    }

    const mesh = obj as THREE.Mesh;
    if (mesh.material) {
      const material = mesh.material as THREE.Material;
      if (material.name && !materials[material.name]) {
        materials[material.name] = material;
      }
    }
  });

  return { nodes, materials };
}

export function logNodeNames(object: Object3D): void {
  object.traverse((obj: Object3D) => {
    console.log(obj.name); // Log each node name
  });
}