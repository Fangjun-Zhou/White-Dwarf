import { cloneClonable, copyCopyable, createType } from "ecsy-wd";
import default_vert from "./Shader/DefaultShader/default_vert.glsl";
import default_frag from "./Shader/DefaultShader/default_frag.glsl";

interface BasicShaderAttribute {
  vPosition?: number;
  vNormal?: number;
  vColor?: number;
  vTexCoord?: number;
}

interface BasicShaderUniform {
  uM?: WebGLUniformLocation;
  uV?: WebGLUniformLocation;
  uP?: WebGLUniformLocation;
  uMV?: WebGLUniformLocation;
  uMVn?: WebGLUniformLocation;
  uMVP?: WebGLUniformLocation;

  uDirLight?: WebGLUniformLocation;
}

export class Material {
  glContext: WebGLRenderingContext;

  vertexSource: string;
  fragmentSource: string;
  attributes: string[] = [];
  uniforms: string[] = [];
  textureSamplers: string[] = [];

  vertexShader: WebGLShader | null = null;
  fragmentShader: WebGLShader | null = null;

  shaderProgram: WebGLProgram | null = null;

  // Attributes.
  attributeLocations: BasicShaderAttribute = {};
  // Uniforms.
  uniformLocations: BasicShaderUniform = {};
  // Texture samplers.
  samplerLocations: { [key: string]: WebGLUniformLocation } = {};

  // Texture buffers.
  textureBuffers: { [key: string]: WebGLTexture } = {};

  constructor(
    glContext: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    attributes: string[] = [],
    uniforms: string[] = [],
    textureSamplers: string[] = []
  ) {
    this.glContext = glContext;
    this.vertexSource = vertexShaderSource;
    this.fragmentSource = fragmentShaderSource;
    if (attributes.length) {
      this.attributes = attributes;
    }
    if (uniforms.length) {
      this.uniforms = uniforms;
    }
    if (textureSamplers.length) {
      this.textureSamplers = textureSamplers;
    }

    if (!this.glContext) {
      return;
    }

    this.compile(
      glContext,
      vertexShaderSource,
      fragmentShaderSource,
      this.attributes,
      this.uniforms,
      this.textureSamplers
    );
  }

  compile(
    glContext: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    attributes: string[],
    uniforms: string[],
    textureSamplers: string[]
  ) {
    // Compile vertex shader.
    this.vertexShader = glContext.createShader(
      glContext.VERTEX_SHADER
    ) as WebGLShader;
    if (!this.vertexShader) {
      throw new Error("Failed to create vertex shader");
    }
    glContext.shaderSource(this.vertexShader, vertexShaderSource);
    glContext.compileShader(this.vertexShader);
    if (
      !glContext.getShaderParameter(this.vertexShader, glContext.COMPILE_STATUS)
    ) {
      throw new Error(glContext.getShaderInfoLog(this.vertexShader) as string);
    }

    // Compile fragment shader.
    this.fragmentShader = glContext.createShader(
      glContext.FRAGMENT_SHADER
    ) as WebGLShader;
    if (!this.fragmentShader) {
      throw new Error("Failed to create fragment shader");
    }
    glContext.shaderSource(this.fragmentShader, fragmentShaderSource);
    glContext.compileShader(this.fragmentShader);
    if (
      !glContext.getShaderParameter(
        this.fragmentShader,
        glContext.COMPILE_STATUS
      )
    ) {
      throw new Error(
        glContext.getShaderInfoLog(this.fragmentShader) as string
      );
    }

    // Create shader program.
    this.shaderProgram = glContext.createProgram();
    if (!this.shaderProgram) {
      throw new Error("Failed to create shader program");
    }
    glContext.attachShader(this.shaderProgram, this.vertexShader);
    glContext.attachShader(this.shaderProgram, this.fragmentShader);
    glContext.linkProgram(this.shaderProgram);
    if (
      !glContext.getProgramParameter(this.shaderProgram, glContext.LINK_STATUS)
    ) {
      throw new Error("Failed to link shader program");
    }

    glContext.useProgram(this.shaderProgram);

    // Get attribute locations.
    for (const attribute of attributes) {
      const location = glContext.getAttribLocation(
        this.shaderProgram,
        attribute
      );

      this.attributeLocations[
        attribute as keyof typeof this.attributeLocations
      ] = location;

      glContext.enableVertexAttribArray(location);
    }

    // Get uniform locations.
    for (const uniform of uniforms) {
      this.uniformLocations[uniform as keyof typeof this.uniformLocations] =
        glContext.getUniformLocation(
          this.shaderProgram,
          uniform
        ) as WebGLUniformLocation;
    }

    // Get texture sampler locations.
    for (let i = 0; i < textureSamplers.length; i++) {
      const element = textureSamplers[i];
      this.samplerLocations[element] = glContext.getUniformLocation(
        this.shaderProgram,
        element
      ) as WebGLUniformLocation;
      glContext.uniform1i(this.samplerLocations[element], i);
    }

    // Create texture buffers.
    for (let i = 0; i < textureSamplers.length; i++) {
      const element = textureSamplers[i];
      this.textureBuffers[element] = glContext.createTexture() as WebGLTexture;
      this.glContext.activeTexture(this.glContext.TEXTURE0 + i);
      this.glContext.bindTexture(
        this.glContext.TEXTURE_2D,
        this.textureBuffers[element]
      );
      this.glContext.texImage2D(
        this.glContext.TEXTURE_2D,
        0,
        this.glContext.RGBA,
        1,
        1,
        0,
        this.glContext.RGBA,
        this.glContext.UNSIGNED_BYTE,
        null
      );
    }
  }

  use(glContext: WebGLRenderingContext) {
    glContext.useProgram(this.shaderProgram);
  }

  loadTexture(texture: string, src: string) {
    // Create a texture image.
    const image = new Image();
    image.src = src;
    image.onload = () => {
      this.glContext.bindTexture(
        this.glContext.TEXTURE_2D,
        this.textureBuffers[texture]
      );
      this.glContext.texImage2D(
        this.glContext.TEXTURE_2D,
        0,
        this.glContext.RGBA,
        this.glContext.RGBA,
        this.glContext.UNSIGNED_BYTE,
        image
      );

      // Use mipmap for texture.
      this.glContext.generateMipmap(this.glContext.TEXTURE_2D);

      // Set interpolation parameters for texture.
      this.glContext.texParameteri(
        this.glContext.TEXTURE_2D,
        this.glContext.TEXTURE_MIN_FILTER,
        this.glContext.LINEAR_MIPMAP_LINEAR
      );

      // Set the texture wrapping parameters.
      this.glContext.texParameteri(
        this.glContext.TEXTURE_2D,
        this.glContext.TEXTURE_WRAP_S,
        this.glContext.REPEAT
      );
      this.glContext.texParameteri(
        this.glContext.TEXTURE_2D,
        this.glContext.TEXTURE_WRAP_T,
        this.glContext.REPEAT
      );
    };
  }
}

export class MaterialDescriptor {
  fetchShader: boolean = false;
  vertexSource!: string;
  fragmentSource!: string;
  attributes: string[] = ["vPosition", "vNormal", "vColor", "vTexCoord"];
  uniforms: string[] = ["uM", "uV", "uP", "uMV", "uMVn", "uMVP", "uDirLight"];
  textureSamplers: { [key: string]: string } = {};

  constructor(
    textureSamplers: { [key: string]: string } = {},
    vertexSource: string = "",
    fragmentSource: string = ""
  ) {
    this.vertexSource = vertexSource;
    this.fragmentSource = fragmentSource;
    this.textureSamplers = textureSamplers;
  }

  copy(m: MaterialDescriptor): MaterialDescriptor {
    this.fetchShader = m.fetchShader;
    this.vertexSource = m.vertexSource;
    this.fragmentSource = m.fragmentSource;
    this.attributes = m.attributes;
    this.uniforms = m.uniforms;
    this.textureSamplers = m.textureSamplers;
    return this;
  }

  clone(): MaterialDescriptor {
    return new MaterialDescriptor().copy(this);
  }
}

export const MaterialDescriptorType = createType({
  name: "MaterialDescriptor",
  default: new MaterialDescriptor(),
  copy: copyCopyable<MaterialDescriptor>,
  clone: cloneClonable<MaterialDescriptor>,
});
