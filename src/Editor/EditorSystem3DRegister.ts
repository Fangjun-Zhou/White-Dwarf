import { World } from "ecsy/World";
import { IWorldRegister } from "../Utils/IWorldRegister";

export class EditorSystem3DRegister {
  mainCanvas: HTMLCanvasElement;

  constructor(mainCanvas: HTMLCanvasElement) {
    this.mainCanvas = mainCanvas;
  }

  register: IWorldRegister = (world: World) => {
    // world.registerSystem(EditorViewPort3DSystem, {
    //   mainCanvas: this.mainCanvas,
    // });
  };
}