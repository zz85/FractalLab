attribute vec3 vertexPosition;

uniform vec2  size;
uniform float scale;
uniform float cameraPitch;
uniform float cameraRoll;
uniform float cameraYaw;
uniform vec3  light;
uniform float rotation;

varying float aspectRatio;
varying mat2  rotationMatrix;

void main() 
{
    float rc = cos(radians(rotation));
    float rs = sin(radians(rotation));
    rotationMatrix = mat2(rc, rs, -rs, rc);
    
    gl_Position = vec4(vertexPosition, 1.0);
    aspectRatio = size.x / size.y;
}