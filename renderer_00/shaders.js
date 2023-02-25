uniformShader = function (gl) {//la matrice di proiezione(ProjectionMatrix) la settiamo all'inizio e non la tocchiamo più. Invece la modelView è quella che tocchiamo tutto il tempo e aggiorniamo ogni volta.
  var vertexShaderSource = `
    uniform mat4 uModelViewMatrix;               
    uniform mat4 uProjectionMatrix;              
    attribute vec3 aPosition;  //vec3 = vettore 3-dimensional                    
    
    void main(void)                                
    {                                              
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;                           
    
    void main(void)                                
    {                                              
      gl_FragColor = vec4(uColor);                 
    }                                             
  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);  //viene creato un oggetto WebGLShader
  gl.shaderSource(vertexShader, vertexShaderSource);  //viene settato con il codice sorgente GLSL, attraverso la stringa vertexShaderSource
  gl.compileShader(vertexShader);  //infine viene compilato

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var shaderProgram = gl.createProgram();  //creiamo un oggetto WebGLshaderProgram
  gl.attachShader(shaderProgram, vertexShader);  //incapsuliamo vertex Shader...
  gl.attachShader(shaderProgram, fragmentShader);  //...e fragment Shader
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");  //simile a quando abbiamo associato un oggeto ad un target
  gl.linkProgram(shaderProgram);  //linkiamo i due shader

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");  //andiamo a vedere in che blocco di memoria/handle si trova la variabile
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  return shaderProgram;
};