uniformShader = function (gl) {
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix; 
    attribute vec3 aPosition;  //vec3 = vettore 3-dimensional     
    attribute vec2 aTexCoords;
    uniform mat4 uHeadlightProjectionMatrix;
    uniform mat4 uHeadlightViewMatrix;
    
    varying vec4 vPosHeadLight;
    varying vec2 vTexCoords;
    
    void main(void)                                
    { 
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0); 
      vTexCoords = aTexCoords; 
      vPosHeadLight = uHeadlightProjectionMatrix * uHeadlightViewMatrix * vec4(aPosition, 1.0);
    }
  `;

  var fragmentShaderSource = `
		precision highp float;	                         
    uniform sampler2D uSampler;  //serve perchè nello shader possiamo voler accedere a texture diverse, è l'oggetto che corrisponde alle tu(texture unit)
    uniform sampler2D uDepthSampler;
    uniform sampler2D uHeadlightSampler;
    
    varying vec2 vTexCoords;
    varying vec4 vPosHeadLight;  
    varying vec4 vPosition;

    void main(void)                                
    { 
      vec2 vHeadlightTexCoords = (vPosHeadLight/vPosHeadLight.w).xy;  //uso vPosHeadLight per generare le coordinate texture
      vHeadlightTexCoords = vHeadlightTexCoords*.5 +.5;
      vec3 tC = (vPosHeadLight/vPosHeadLight.w).xyz;  //coordinate texture sono tra -1 e 1 di default...
			tC = tC*0.5+0.5;  //...ma mi serve tra 0 e 1
      float storedDepth = texture2D(uDepthSampler,tC.xy).x;  //valore modellato nella shadowMap
        
        //controllo se le coordinate sono tra 0 e 1 e confronto storeDepth con la z di tC cioè la distanza
      if(vHeadlightTexCoords.x>=0.0 && vHeadlightTexCoords.x<=1.0 && vHeadlightTexCoords.y>=0.0 && vHeadlightTexCoords.y<=1.0 && vPosHeadLight.z >= 0.0 && (tC.x > 0.0 || tC.x < 1.0 ||
  	     		tC.y > 0.0 || tC.y < 1.0) && storedDepth+0.0009 > tC.z) {
        
        vec4 tex_headlight = texture2D(uHeadlightSampler,vHeadlightTexCoords);
        vec3 tex_standard = texture2D(uSampler,vTexCoords).xyz;
        vec3 result = mix(tex_standard, tex_headlight.rgb, tex_headlight.a);
        
        gl_FragColor = vec4(result, 1.0);
      }
      else {
        gl_FragColor = texture2D(uSampler,vTexCoords);  //texture2D prende il sampler(l'immagine della texture sul frammento) e le coordinate texture interpolate e ritorna un vec4         
      }
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
  var aTexCoordsIndex =2;
  var shaderProgram = gl.createProgram();  //creiamo un oggetto WebGLshaderProgram
  gl.attachShader(shaderProgram, vertexShader);  //incapsuliamo vertex Shader...
  gl.attachShader(shaderProgram, fragmentShader);  //...e fragment Shader
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");  //simile a quando abbiamo associato un oggetto ad un target
  gl.bindAttribLocation(shaderProgram, aTexCoordsIndex, "aTexCoords");
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
  shaderProgram.aTexCoordsIndex = aTexCoordsIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");  //andiamo a vedere in che blocco di memoria/handle si trova la variabile
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");  //dico al fragment shader qual è la texture unit da usare anche se di default è 0
  shaderProgram.uHeadlightSamplerLocation = gl.getUniformLocation(shaderProgram, "uHeadlightSampler");
  shaderProgram.uHeadlightProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightProjectionMatrix");
  shaderProgram.uHeadlightViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightViewMatrix");
  shaderProgram.uDepthSamplerLocation = gl.getUniformLocation(shaderProgram, "uDepthSampler");

  return shaderProgram;
};