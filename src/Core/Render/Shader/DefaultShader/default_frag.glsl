precision highp float;

// Uniforms.
uniform mat4 uMV;
uniform mat4 uP;
uniform mat4 uMVn;
uniform mat4 uMVP;

// Camera space position.
varying vec3 fPosition;
// Vertex color.
varying vec4 fColor;
// Model space normal.
varying vec3 fNormal;
// Texture coordinates.
varying vec2 fTexCoord;

void main(){
    gl_FragColor = fColor;
}