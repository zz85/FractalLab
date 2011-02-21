attribute vec3 vertexPosition;

uniform vec2  size;
uniform float scale;
uniform float cameraPitch;
uniform float cameraRoll;
uniform float cameraYaw;
uniform vec3  light;

varying float aspectRatio;
varying vec3  w;
varying vec3  u;
varying vec3  v;

void main() 
{
    w = vec3(0, 0, 1);
    v = vec3(0, 1, 0);
    u = vec3(1, 0, 0);
    gl_Position = vec4(vertexPosition, 1.0);
    aspectRatio = size.x / size.y;
}