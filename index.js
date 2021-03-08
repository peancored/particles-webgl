import { createShader, createProgram, normalize } from './helpers.js';

const pointsNum = 100000;

function main() {
  const canvas = document.querySelector('#canvas');

  // const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true } );
  const gl = canvas.getContext('webgl2');

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  gl.enable(gl.BLEND);

  gl.disable(gl.DEPTH_TEST);

  const vertexShaderSource = document.querySelector('#vertex').textContent.trim();
  const fragmentShaderSource = document.querySelector('#fragment').textContent.trim();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const opacityAttributeLocation = gl.getAttribLocation(program, "a_opacity");
  const positionBuffer = gl.createBuffer();
  const colorLocation = gl.getUniformLocation(program, "u_color");

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.vertexAttribPointer(positionAttributeLocation, 2 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 0 /* offset */);
  gl.vertexAttribPointer(opacityAttributeLocation, 1 /* size */, gl.FLOAT /* type */, false /* normalize */, 3 * Float32Array.BYTES_PER_ELEMENT /* stride */, 2 * Float32Array.BYTES_PER_ELEMENT /* offset */);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.enableVertexAttribArray(opacityAttributeLocation);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas, 2);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);

  const points = [];
  const trailLength = 40;

  for (let i = 0; i < pointsNum; i++) {
    const point = {
      x: parseInt(Math.random() * gl.canvas.width),
      y: parseInt(Math.random() * gl.canvas.height),
      velocityX: Math.random() * 2 - 1,
      velocityY: Math.random() * 2 - 1,
      magnitude: 2,
      prevPoisitons: []
    };

    point.normVelX = normalize(point.velocityX, point.velocityY, point.magnitude);
    point.normVelY = normalize(point.velocityY, point.velocityX, point.magnitude);

    points.push(point);
  }
  //gl.bindVertexArray(vao);

  const primitiveType = gl.POINTS;
  const offset = 0;
  const count = pointsNum * (trailLength + 1);

  let xMax = gl.canvas.width;
  let yMax = gl.canvas.height;

  requestAnimationFrame(animate);

  let pointsArray = new Float32Array(3 * points.length * (trailLength + 1));

  gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

  const opacityReductionNumber = 6;

  function animate() {
    gl.clearColor(0.26, 0.33, 0.38, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < points.length; i++) {
      let point = points[i];
      const normX = -1.0 + 2.0 * point.x / xMax;
      const normY = -1.0 + 2.0 * point.y / yMax;

      pointsArray[(3 + 3*trailLength)*i] = normX;
      pointsArray[(3 + 3*trailLength)*i + 1] = normY;
      pointsArray[(3 + 3*trailLength)*i + 2] = 1.0/opacityReductionNumber;

      for (let j = 0; j < point.prevPoisitons.length; j++) {
        if (j % 3 == 2) {
          pointsArray[(3 + 3*trailLength) * i + 3 + j] = j / (opacityReductionNumber*point.prevPoisitons.length);
        } else {
          pointsArray[(3 + 3*trailLength) * i + 3 + j] = point.prevPoisitons[j];
        }
      }

      if (point.x < 0 || point.x > xMax) {
        point.normVelX = -point.normVelX;
      }

      if (point.y < 0 || point.y > yMax) {
        point.normVelY = -point.normVelY;
      }

      if (trailLength) {
        point.prevPoisitons.push(normX);
        point.prevPoisitons.push(normY);
        point.prevPoisitons.push(normY);

        if (point.prevPoisitons.length > trailLength * 3) {
          point.prevPoisitons.splice(0, 3);
        }
      }

      point.x += point.normVelX;
      point.y += point.normVelY;
    };


    gl.bufferData(gl.ARRAY_BUFFER, pointsArray, gl.DYNAMIC_DRAW);

    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(animate);
  }
}

main();
