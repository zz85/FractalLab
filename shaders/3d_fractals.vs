attribute vec3 vertexPosition;

uniform vec2  size;
uniform float scale;
uniform float surfaceSmoothness;
uniform float cameraPitch;
uniform float cameraRoll;
uniform float cameraYaw;
uniform float cameraFocalLength;
uniform vec3  light;

varying float aspectRatio;
varying vec3  w;
varying vec3  u;
varying vec3  v;
varying mat3  cameraRotation;
varying float epsfactor;
varying vec3  c3;
varying vec3  phi3;


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
    aspectRatio = size.x / size.y;
    
    // Dodecahedron serpinski
    // Thanks to Knighty:
    // http://www.fractalforums.com/index.php?topic=3158.msg16982#msg16982
    float PHI = 1.61803399;
    float _IKVNORM_ = 1.0 / sqrt(pow(PHI*(1.0 + PHI), 2.0) + pow(PHI*PHI - 1.0, 2.0) + pow(1.0 + PHI, 2.0));
    float _C1_ = PHI * (1.0 + PHI) * _IKVNORM_;
    float _C2_ = (PHI*PHI - 1.0) * _IKVNORM_;
    float _1C_ = (1.0 + PHI) * _IKVNORM_;

    phi3 = vec3(0.5, 0.5 / PHI, 0.5 * PHI);
    c3   = vec3(_C1_, _C2_, _1C_);
    
    
    float fovfactor = 1.0 / sqrt(1.0 + cameraFocalLength * cameraFocalLength);
    float pixelScale = 1.0 / min(size.x, size.y);
    epsfactor = 2.0 * fovfactor * surfaceSmoothness * pixelScale;
    
    gl_Position = vec4(vertexPosition, 1.0);
}