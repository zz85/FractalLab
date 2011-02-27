attribute vec3 vertexPosition;

uniform vec2  size;
uniform float scale;
uniform float surfaceDetail;
uniform float cameraPitch;
uniform float cameraRoll;
uniform float cameraYaw;
uniform float cameraFocalLength;
uniform vec3  light;

varying vec3  w;
varying vec3  u;
varying vec3  v;
varying mat3  cameraRotation;


// Return rotation matrix for rotating around vector v by angle
mat3 rotationMatrixVector(vec3 v, float angle)
{
    float c = cos(radians(angle));
    float s = sin(radians(angle));
    
    return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,
              (1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,
              (1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z);
}


void main() 
{
    w = vec3(0, 0, 1);
    v = vec3(0, 1, 0);
    u = vec3(1, 0, 0);
    cameraRotation = rotationMatrixVector(v, 180.0 - cameraYaw) * rotationMatrixVector(u, -cameraPitch) * rotationMatrixVector(w, cameraRoll);
    
    gl_Position = vec4(vertexPosition, 1.0);
}