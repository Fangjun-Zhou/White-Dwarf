import { Component, ComponentSchema } from "ecsy-wd";
import { Types } from "ecsy-wd";
import { IComponent } from "../../ComponentRegistry";

export enum BackgroundType {
  Color = 0,
  Texture = 1,
}

@IComponent.register
export class CameraData2D extends Component<CameraData2D> {
  static schema: ComponentSchema = {
    backgroundType: {
      type: Types.Number,
      default: BackgroundType.Color,
    },
    backgroundColor: {
      type: Types.String,
      default: "#000000",
    },
    backgroundTexture: {
      type: Types.String,
      default: "",
    },
  };

  backgroundType!: BackgroundType;

  backgroundColor!: string;
  backgroundTexture!: string;
}
