attribute vec2 vertexPosition;
varying   vec2 position;

void main(void) {
  gl_Position = vec4(vertexPosition, 0.0, 1.0);
  position = 0.5 * (vertexPosition + 1.0);
}
