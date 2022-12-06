import { Attributes, Entity } from "ecsy-wd";
import { TransformData3D } from "../../../Core/Locomotion/DataComponent/TransformData3D";
import { EditorViewPortWebGLSystem } from "./EditorViewPortWebGLSystem";
import point_vert from "../../../Core/Render/Shader/EditorShader/point_vert.glsl";
import point_frag from "../../../Core/Render/Shader/EditorShader/point_frag.glsl";
import line_vert from "../../../Core/Render/Shader/EditorShader/line_vert.glsl";
import line_frag from "../../../Core/Render/Shader/EditorShader/line_frag.glsl";
import { mat3, mat4, vec2, vec3 } from "gl-matrix";

const moveControlThreshold = 10;

export class EditorViewPortWebGLTransformSystem extends EditorViewPortWebGLSystem {
  // WebGL shaders.
  pointAttributes: { [key: string]: number } = {
    vPosition: -1,
    vSize: -1,
    vColor: -1,
  };
  pointUniforms: { [key: string]: WebGLUniformLocation | null } = {
    uMV: null,
    uP: null,
    uMVn: null,
    uMVP: null,
  };
  pointShader: WebGLProgram | null = null;

  axisAttributes: { [key: string]: number } = {
    vPosition: -1,
    vColor: -1,
  };
  axisUniforms: { [key: string]: WebGLUniformLocation | null } = {
    uMV: null,
    uP: null,
    uMVn: null,
    uMVP: null,
  };
  axisShader: WebGLProgram | null = null;

  // WebGL buffers.
  vertexPositionBufferItemSize = 3;
  vertexSizeBufferItemSize = 1;
  vertexColorBufferItemSize = 4;

  pointVertexPositionBuffer: WebGLBuffer | null = null;
  pointVertexSizeBuffer: WebGLBuffer | null = null;
  pointVertexColorBuffer: WebGLBuffer | null = null;
  axisVertexPositionBuffer: WebGLBuffer | null = null;
  axisVertexColorBuffer: WebGLBuffer | null = null;
  axisTipVertexPositionBuffer: WebGLBuffer | null = null;
  axisTipVertexSizeBuffer: WebGLBuffer | null = null;
  axisTipVertexColorBuffer: WebGLBuffer | null = null;

  // Settings.
  pointColor = [1.0, 1.0, 1.0, 1.0];

  public init(attributes?: Attributes | undefined): void {
    super.init(attributes);

    // Initialize WebGL buffers.
    const pointVertices = new Float32Array([0, 0, 0]);
    this.pointVertexPositionBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexPositionBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      pointVertices,
      this.glContext.STATIC_DRAW
    );

    const pointSizes = new Float32Array([10]);
    this.pointVertexSizeBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexSizeBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      pointSizes,
      this.glContext.STATIC_DRAW
    );

    const pointColors = new Float32Array(this.pointColor);
    this.pointVertexColorBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexColorBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      pointColors,
      this.glContext.STATIC_DRAW
    );

    const axisVertices = new Float32Array(
      [
        [0, 0, 0],
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 1],
      ].flat()
    );
    this.axisVertexPositionBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisVertexPositionBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      axisVertices,
      this.glContext.STATIC_DRAW
    );

    const axisColors = new Float32Array(
      [
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [0, 1, 0, 1],
        [0, 1, 0, 1],
      ].flat()
    );
    this.axisVertexColorBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisVertexColorBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      axisColors,
      this.glContext.STATIC_DRAW
    );

    const axisTipVertices = new Float32Array(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ].flat()
    );
    this.axisTipVertexPositionBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexPositionBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      axisTipVertices,
      this.glContext.STATIC_DRAW
    );

    const axisTipSizes = new Float32Array([10, 10, 10]);
    this.axisTipVertexSizeBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexSizeBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      axisTipSizes,
      this.glContext.STATIC_DRAW
    );

    const axisTipColors = new Float32Array(
      [
        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 1, 0, 1],
      ].flat()
    );
    this.axisTipVertexColorBuffer = this.glContext.createBuffer();
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexColorBuffer
    );
    this.glContext.bufferData(
      this.glContext.ARRAY_BUFFER,
      axisTipColors,
      this.glContext.STATIC_DRAW
    );

    // Compile and link the shader program.
    this.pointShader = this.compileShader(
      point_vert,
      point_frag,
      this.pointAttributes,
      this.pointUniforms
    );

    this.axisShader = this.compileShader(
      line_vert,
      line_frag,
      this.axisAttributes,
      this.axisUniforms
    );
  }

  public drawInspectEntity(
    entity: Entity,
    transform: TransformData3D,
    tView: mat4,
    tProjection: mat4
  ): void {
    // Model matrix.
    const tModel = this.getModelMatrix(transform, true);
    // MV matrix.
    const tMV = mat4.create();
    mat4.multiply(tMV, tView, tModel);
    // MVn matrix.
    const tMVn = mat3.create();
    mat3.normalFromMat4(tMVn, tMV);
    // MVP matrix.
    const tMVP = mat4.create();
    mat4.multiply(tMVP, tProjection, tMV);

    // Draw the transform point gizmo.
    this.drawPoint(tMV, tProjection, tMVn, tMVP);
    // Draw the transform axis gizmo.
    this.drawAxis(tMV, tProjection, tMVn, tMVP);

    // Get the NDC to viewport matrix.
    const tNDCtoViewport = this.getNDCToViewportMatrix();

    // Generate the transformation matrix from model space to Viewport space.
    const tModelToViewport = mat4.create();
    mat4.multiply(tModelToViewport, tNDCtoViewport, tMVP);

    // Get the position of the entity in viewport space.
    const startPoint = vec3.transformMat4(
      vec3.create(),
      [0, 0, 0],
      tModelToViewport
    );
    // Get the end points for the axis gizmo.
    const endPointX = vec3.transformMat4(
      vec3.create(),
      [1, 0, 0],
      tModelToViewport
    );
    const endPointY = vec3.transformMat4(
      vec3.create(),
      [0, 1, 0],
      tModelToViewport
    );
    const endPointZ = vec3.transformMat4(
      vec3.create(),
      [0, 0, 1],
      tModelToViewport
    );

    // If the mouse is in the canvas, get the closest axis.
    if (this.mouseInCanvas) {
      // Get the closest axis.
      const xDistance = vec2.distance(
        this.mousePosition,
        vec2.fromValues(endPointX[0], endPointX[1])
      );
      const yDistance = vec2.distance(
        this.mousePosition,
        vec2.fromValues(endPointY[0], endPointY[1])
      );
      const zDistance = vec2.distance(
        this.mousePosition,
        vec2.fromValues(endPointZ[0], endPointZ[1])
      );

      const minDistance = Math.min(xDistance, yDistance, zDistance);

      let axisTipSizes: Float32Array = new Float32Array([10, 10, 10]);
      if (minDistance < moveControlThreshold) {
        if (minDistance == xDistance) {
          // Highlight the axis.
          axisTipSizes = new Float32Array([20, 10, 10]);

          this.highlightAxis = "x";
        } else if (minDistance == yDistance) {
          // Highlight the axis.
          axisTipSizes = new Float32Array([10, 20, 10]);

          this.highlightAxis = "y";
        } else if (minDistance == zDistance) {
          // Highlight the axis.
          axisTipSizes = new Float32Array([10, 10, 20]);

          this.highlightAxis = "z";
        }
      } else {
        // Reset the axis size.
        this.highlightAxis = null;
      }

      // Move the object.
      if (this.movingAxis) {
        switch (this.movingAxis) {
          case "x":
            this.moveAxis(endPointX, startPoint, 0);
            break;

          case "y":
            this.moveAxis(endPointY, startPoint, 1);
            break;

          case "z":
            this.moveAxis(endPointZ, startPoint, 2);
            break;

          default:
            break;
        }
      }

      this.glContext.bindBuffer(
        this.glContext.ARRAY_BUFFER,
        this.axisTipVertexSizeBuffer
      );
      this.glContext.bufferData(
        this.glContext.ARRAY_BUFFER,
        axisTipSizes,
        this.glContext.STATIC_DRAW
      );
    }
  }

  /**
   * Draw the gizmo point.
   * @param tMV
   * @param tProjection
   * @param tMVn
   * @param tMVP
   */
  private drawPoint(tMV: mat4, tProjection: mat4, tMVn: mat3, tMVP: mat4) {
    // Disable z testing.
    this.glContext.disable(this.glContext.DEPTH_TEST);

    this.glContext.useProgram(this.pointShader);

    // Set the shader uniforms.
    this.setUniforms(this.pointUniforms, tMV, tProjection, tMVn, tMVP);

    // Set the shader attributes.
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexPositionBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vPosition as number,
      this.vertexPositionBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexSizeBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vSize as number,
      this.vertexSizeBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.pointVertexColorBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vColor as number,
      this.vertexColorBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.drawArrays(this.glContext.POINTS, 0, 1);

    // Enable z testing.
    this.glContext.enable(this.glContext.DEPTH_TEST);
  }

  /**
   * Draw the axis lines.
   * @param tMV
   * @param tProjection
   * @param tMVn
   * @param tMVP
   */
  private drawAxis(tMV: mat4, tProjection: mat4, tMVn: mat3, tMVP: mat4) {
    this.glContext.disable(this.glContext.DEPTH_TEST);

    this.glContext.useProgram(this.axisShader);

    // Set the shader uniforms.
    this.setUniforms(this.axisUniforms, tMV, tProjection, tMVn, tMVP);

    // Set the shader attributes.
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisVertexPositionBuffer
    );
    this.glContext.vertexAttribPointer(
      this.axisAttributes.vPosition as number,
      this.vertexPositionBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisVertexColorBuffer
    );
    this.glContext.vertexAttribPointer(
      this.axisAttributes.vColor as number,
      this.vertexColorBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.drawArrays(this.glContext.LINES, 0, 6);

    // Draw the axis tips.
    this.glContext.useProgram(this.pointShader);

    // Set the shader uniforms.
    this.setUniforms(this.pointUniforms, tMV, tProjection, tMVn, tMVP);

    // Set the shader attributes.
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexPositionBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vPosition as number,
      this.vertexPositionBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexSizeBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vSize as number,
      this.vertexSizeBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );
    this.glContext.bindBuffer(
      this.glContext.ARRAY_BUFFER,
      this.axisTipVertexColorBuffer
    );
    this.glContext.vertexAttribPointer(
      this.pointAttributes.vColor as number,
      this.vertexColorBufferItemSize,
      this.glContext.FLOAT,
      false,
      0,
      0
    );

    this.glContext.drawArrays(this.glContext.POINTS, 0, 3);

    this.glContext.enable(this.glContext.DEPTH_TEST);
  }

  /**
   * Set the uniforms for glContext.
   * @param tMV
   * @param tProjection
   * @param tMVn
   * @param tMVP
   */
  private setUniforms(
    uniforms: { [key: string]: WebGLUniformLocation | null },
    tMV: mat4,
    tProjection: mat4,
    tMVn: mat3,
    tMVP: mat4
  ) {
    this.glContext.uniformMatrix4fv(
      uniforms.uMV as WebGLUniformLocation,
      false,
      tMV
    );
    this.glContext.uniformMatrix4fv(
      uniforms.uP as WebGLUniformLocation,
      false,
      tProjection
    );
    this.glContext.uniformMatrix3fv(
      uniforms.uMVn as WebGLUniformLocation,
      false,
      tMVn
    );
    this.glContext.uniformMatrix4fv(
      uniforms.uMVP as WebGLUniformLocation,
      false,
      tMVP
    );
  }

  /**
   * Compile the shader program and get the attribute and uniform locations.
   * @param vertexSource vertex shader source code.
   * @param fragmentSource fragment shader source code.
   * @param attributes vertex attributes location dictionary.
   * @param uniforms uniform location dictionary.
   * @returns compiled shader program.
   */
  private compileShader(
    vertexSource: string,
    fragmentSource: string,
    attributes: { [key: string]: number },
    uniforms: { [key: string]: WebGLUniformLocation | null }
  ): WebGLProgram {
    // Compile vertex shader.
    const pointVertexShader = this.glContext.createShader(
      this.glContext.VERTEX_SHADER
    ) as WebGLShader;
    if (!pointVertexShader) {
      throw new Error("Failed to create point vertex shader.");
    }
    this.glContext.shaderSource(pointVertexShader, vertexSource);
    this.glContext.compileShader(pointVertexShader);
    if (
      !this.glContext.getShaderParameter(
        pointVertexShader,
        this.glContext.COMPILE_STATUS
      )
    ) {
      throw new Error(
        this.glContext.getShaderInfoLog(pointVertexShader) as string
      );
    }

    // Compile fragment shader.
    const pointFragmentShader = this.glContext.createShader(
      this.glContext.FRAGMENT_SHADER
    ) as WebGLShader;
    if (!pointFragmentShader) {
      throw new Error("Failed to create point fragment shader.");
    }
    this.glContext.shaderSource(pointFragmentShader, fragmentSource);
    this.glContext.compileShader(pointFragmentShader);
    if (
      !this.glContext.getShaderParameter(
        pointFragmentShader,
        this.glContext.COMPILE_STATUS
      )
    ) {
      throw new Error(
        this.glContext.getShaderInfoLog(pointFragmentShader) as string
      );
    }

    // Compile and link shader program.
    const shaderProgram = this.glContext.createProgram();
    if (!shaderProgram) {
      throw new Error("Failed to create point shader program.");
    }
    this.glContext.attachShader(shaderProgram, pointVertexShader);
    this.glContext.attachShader(shaderProgram, pointFragmentShader);
    this.glContext.linkProgram(shaderProgram);
    if (
      !this.glContext.getProgramParameter(
        shaderProgram,
        this.glContext.LINK_STATUS
      )
    ) {
      throw new Error(
        this.glContext.getProgramInfoLog(shaderProgram) as string
      );
    }

    // Get the attribute and uniform locations.
    for (const key in attributes) {
      const location = this.glContext.getAttribLocation(shaderProgram, key);
      attributes[key] = location;
      this.glContext.enableVertexAttribArray(location);
    }

    for (const key in uniforms) {
      const location = this.glContext.getUniformLocation(shaderProgram, key);
      uniforms[key] = location;
    }

    return shaderProgram;
  }

  /**
   * Move the object along the axis.
   * @param axisEndPoint the end point of the axis.
   * @param startPoint the start point of the axis.
   */
  private moveAxis(axisEndPoint: vec3, startPoint: vec3, axisIndex: number) {
    const axisDir = vec2.create();
    vec2.sub(
      axisDir,
      vec2.fromValues(axisEndPoint[0], axisEndPoint[1]),
      vec2.fromValues(startPoint[0], startPoint[1])
    );
    // Get the mouse move magnitude on the axis.
    let axisMove = vec2.dot(
      axisDir,
      vec2.fromValues(this.mouseDelta[0], this.mouseDelta[1])
    );
    axisMove = axisMove / Math.pow(vec2.length(axisDir), 2);

    // Move the object.
    if (EditorViewPortWebGLSystem.inspectTransform) {
      EditorViewPortWebGLSystem.inspectTransform.position.value[axisIndex] +=
        axisMove;

      // Update the transform.
      EditorViewPortWebGLSystem.inspectEntity?.getMutableComponent(
        TransformData3D
      );
    }
  }
}
