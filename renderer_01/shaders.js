uniformShader = function (gl) {
  var vertexShaderSource = `
    uniform mat4 uModelViewMatrix;               
    uniform mat4 uProjectionMatrix;              
    attribute vec3 aPosition;  //vec3 = vettore 3-dimensional
    attribute vec3 aNormal;  
    uniform mat4 uViewMatrix;

    varying vec3 vVSNormal; //normale in view space
    varying vec3 vVSViewDirection;  //direzione di vista in view space
    varying vec3 vVSPosition; //posizione della luce in view space
    varying vec3 vVSSpotlightDirection;

    void main(void){
      //posizione del punto per il rasterizzatore
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);

      vVSNormal = normalize(uModelViewMatrix * vec4(aNormal, 0.0)).xyz;    //normale per vertice
      vVSViewDirection = -normalize(uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
      vVSPosition = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz;   //posizione della luce in view space
      
      //calcolo la direzione dei faretti in VS
      vVSSpotlightDirection = normalize(uViewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz;
    }                                            
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;                           
    uniform vec3 uVSLightDirection;  //direzione della luce in view space
    uniform vec3 uSpotlights[12];  //spotlights

    varying vec3 vVSNormal; //normale in view space
    varying vec3 vVSViewDirection;  //direzione di vista in view space
    varying vec3 vVSPosition;    //posizione della luce in view space
    varying vec3 vVSSpotlightDirection;  //direzione delle spotlights

    void main(void){
      //componente diffusa
      float diffuseLight = max(dot(uVSLightDirection, vVSNormal), 0.0)* 0.5 + 0.5;  
      vec3 diffuseColor = uColor.xyz * diffuseLight *0.5;

      //direzione riflessa
      vec3 reflection_dir = -uVSLightDirection + 2.0 * dot(uVSLightDirection, vVSNormal) * vVSNormal; //R=-L+2(N dot L)N

      //componente speculare
      float specularLight = max(0.0, pow(dot(vVSViewDirection, reflection_dir), 1.0));
      vec3 specularColor = uColor.xyz * specularLight;

      //spotlights
      float spotlightLight = 0.0;
      for(int i = 0; i < 12; i ++){
        float tmplight = 0.4;
        float cosangle = max(dot(normalize(vVSPosition-uSpotlights[i]), vVSSpotlightDirection), 0.0);
        if(cosangle < 0.69){ //senza if non viene tagliato direttamente
          tmplight = 0.0;
        }
        if(cosangle > 0.95) {
          tmplight = cosangle;
        }
        if(cosangle <= 0.95 && cosangle >= 0.69) {
          tmplight = pow(cosangle, 2.0);
        }
        
        spotlightLight += tmplight;
     }
      vec3 spotlightColor = vec3(0.5,0.5,0.2)*spotlightLight;

      gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor, 1.0);

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
  var aNormalIndex = 1;
  var shaderProgram = gl.createProgram();  //creiamo un oggetto WebGLshaderProgram
  gl.attachShader(shaderProgram, vertexShader);  //incapsuliamo vertex Shader...
  gl.attachShader(shaderProgram, fragmentShader);  //...e fragment Shader
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");  //simile a quando abbiamo associato un oggeto ad un target
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
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
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");  //andiamo a vedere in che blocco di memoria/handle si trova la variabile
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uVSLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uVSLightDirection");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  shaderProgram.uSpotlightsLocation = gl.getUniformLocation(shaderProgram, "uSpotlights");

  return shaderProgram;
};