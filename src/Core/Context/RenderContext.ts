import { Entity } from "ecsy-wd";

export interface IEditorRenderContext {
  mainCanvas: HTMLCanvasElement | null;
  mainCamera: Entity | null;
}

export const coreRenderContext: IEditorRenderContext = {
  mainCanvas: null,
  mainCamera: null,
};
