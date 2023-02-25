/*
the FollowFromUpCamera always look at the car from a position above right over the car
*/
FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();  //si tiene una copia del frame da aggiornare
  
  /* update the camera with the current car position */
  this.update = function(car_position){
    this.frame = car_position;
  }

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    let up = glMatrix.vec4.create();
    
    glMatrix.vec3.transformMat4(eye, [0  ,50,0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
    glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
    
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));	//lookAt costruisce la matrice di trasformazione, cioè l'inverso del frame di vista
  }
}

/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
ChaseCamera = function(){

  /* the only data it needs is the frame of the camera */
  this.frame = [0,0,0];
  
  /* update the camera with the current car position */
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();  //punto di vista
    let target = glMatrix.vec3.create();  //dove deve guardare
    glMatrix.vec3.transformMat4(eye, [0,2,6.0], this.frame);  //prendo il punto di vista e lo trasformo per il frame della       macchina
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);  //stessa cosa della riga precedente
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);  //lookAt prende il punto di vista,dove deve guardare e il vettore UP e fa i prodotti vettoriali per fare la matrice	
  }
}

/* Per i fanali dobbiamo fare la stessa cosa che abbiamo fatto per la ChaseCamera soltanto 
che piazzeremo il VFM davanti */
Headlights_VF = function(){

  /* the only data it needs is the frame of the camera */
  this.frame = [0,0,0];
  
  /* update the camera with the current car position */
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();  //punto di vista
    let target = glMatrix.vec3.create();  //dove deve guardare
    glMatrix.vec3.transformMat4(eye, [0  ,0.5 ,-2.0 ,1.0], this.car.frame);  //prendo il punto di vista e lo trasformo per il frame della macchina
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.car.frame); //stessa cosa della riga precedente
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
  }
}

/* the observer camera allows you to go around. With the wasd keys you can move and with the mouse you can either look around */
ObserverCamera = function() {
  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();  //si tiene una copia del frame da aggiornare
  this.xMovement = 0;
  this.yMovement = 0;
  this.zMovement = 0;
  this.mouseCoords = [0, 0];

  //origine del frame: in un angolo
  let OriginObserverMatrix = glMatrix.mat4.create();
  glMatrix.mat4.fromTranslation(OriginObserverMatrix, [-5 , -10, -100]);
  glMatrix.mat4.mul(this.frame,OriginObserverMatrix, this.frame);

  this.update = function(){ 
    let translationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(translationMatrix, [this.xMovement, this.yMovement, this.zMovement]);
    glMatrix.mat4.mul(this.frame, translationMatrix, this.frame);
    //rotazione con il mouse
    let rotationMatrix = glMatrix.mat4.create();  
    glMatrix.mat4.fromRotation(rotationMatrix, -this.mouseCoords[1] * 0.001, [1, 0, 0]);//angolo in radianti * asse x
    glMatrix.mat4.mul(this.frame, rotationMatrix, this.frame);
    glMatrix.mat4.fromRotation(rotationMatrix, -this.mouseCoords[0]* 0.001, [0, 1, 0]); //angolo in radianti * asse y
    glMatrix.mat4.mul(this.frame, rotationMatrix, this.frame);
  }

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){
    return this.frame;
  }
}

/* the main object to be implemented */
var Renderer = new Object();

/* array of cameras that will be used */
Renderer.cameras = [];
Renderer.cameras.push(new FollowFromUpCamera());  //add a FollowFromUpCamera
Renderer.cameras.push(new ChaseCamera());  //add a ChaseCamera
Renderer.cameras.push(new ObserverCamera());  //add a ObserverCamera
Renderer.currentCamera = 0;  //set the camera currently in use

/*
create the buffers for an object as specified in common/shapes/triangle.js
*/
Renderer.createObjectBuffers = function (gl, obj) {

  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

	if(typeof obj.texCoords != 'undefined'){  //se il valore non è undefined, allora ha le coordinate texture
    		obj.texCoordsBuffer = gl.createBuffer();
    		gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

   if(typeof obj.tangents != 'undefined'){  //se il valore non è undefined, allora ha le tangenti
       obj.tangentsBuffer = gl.createBuffer();
      	gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
      	gl.bufferData(gl.ARRAY_BUFFER, obj.tangents, gl.STATIC_DRAW);
      	gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
     
     if(typeof obj.normals != 'undefined'){  //se il valore non è undefined, allora ha le normali
		  	obj.normalBuffer = gl.createBuffer();
 		 		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
 		 		gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
  			gl.bindBuffer(gl.ARRAY_BUFFER, null);
  			}
    	
  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

/*
draw an object as specified in common/shapes/triangle.js for which the buffer 
have already been created
*/
Renderer.drawObject = function (gl, obj, fillColor, lineColor, shader) {

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(shader.aPositionIndex);
  gl.vertexAttribPointer(shader.aPositionIndex,3, gl.FLOAT, false, 0, 0);

	if(typeof obj.texCoords != 'undefined'){  //controllo se il tipo dell'oggetto ha coordinate texture
	  	gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);	
  		gl.enableVertexAttribArray(shader.aTexCoordsIndex);
  		gl.vertexAttribPointer(shader.aTexCoordsIndex, 2, gl.FLOAT, false, 0, 0);
	}

  if( typeof obj.tangentsBuffer != 'undefined'){   //controllo se il tipo dell'oggetto ha le tangenti
     gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
    	gl.enableVertexAttribArray(shader.aTangentsIndex);
    	gl.vertexAttribPointer(shader.aTangentsIndex, 3, gl.FLOAT, false, 0, 0);
  }
    
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(shader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  gl.uniform4fv(shader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(shader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

};

Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  Renderer.triangle = new Triangle();

  this.cube = new Cube(10);
  this.createObjectBuffers(gl,this.cube);
  
  this.cylinder = new Cylinder(10);
  this.createObjectBuffers(gl,this.cylinder );
  
  Renderer.createObjectBuffers(gl, this.triangle);

  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i) { 
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);
	  	}

	Renderer.loadTexture(gl,0,"../common/textures/street4.png");  //carico le texture con il loro indirizzo
	Renderer.loadTexture(gl,1,"../common/textures/facade4.jpg");
	Renderer.loadTexture(gl,2,"../common/textures/roof.jpg");
	Renderer.loadTexture(gl,3,"../common/textures/grass_tile.png");
  Renderer.loadTexture(gl,4,"../common/textures/ruote.jpg");
  Renderer.loadTexture(gl,5,"../common/textures/gold.jpg");
  Renderer.loadTexture(gl,6,"../common/textures/red1.jpg");
  Renderer.loadTexture(gl,7,"../common/textures/headlight.png");

  speedWheelsAngle = 0;
  shadowMapSize = 512.0;   //quanti pixel sto dedicando alla shadowMapSize
};
//tu(texture unit):  ha il compito di accedere alle texture quando gli viene chiesto
Renderer.loadTexture = function (gl,tu, url){  //funzione che carica le texture
	var image = new Image();
	image.src = url;
	image.addEventListener('load',function(){	
		gl.activeTexture(gl.TEXTURE0+tu);  //quale texture unit è attiva,settiamo la texture corrente a 0+tu
		var texture = gl.createTexture();  //creiamo un oggetto texture WebGL
		gl.bindTexture(gl.TEXTURE_2D,texture);  //uniamo la texture ad un texture target
    if(tu == 7) {
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);  //carichiamo l'image sulla texture
    }
    else {
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);  //carichiamo l'image sulla texture
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);  //specifichiamo il wrapping mode ...
		  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);  //...per tutte le coordinate
    }
		
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);  //come la texture deve essere campionata quando Magnification, in questo caso filtring lineare
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)  //come la texture deve essere campionata quando Minification, in questo caso filtring lineare
		});
	}

/* Framebuffer diverso da quello dell'environment maps perchè non c'è il tipo storage e inoltre il formato interno e il formato dei dati sono depth_component */
function createFramebuffer(gl,size){
    gl.activeTexture(gl.TEXTURE0+8);
		var depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		const depthTextureSize = size;
		gl.texImage2D(
	    gl.TEXTURE_2D,      // target
		0,                  // mip level
		gl.DEPTH_COMPONENT, // internal format
		depthTextureSize,   // width
		depthTextureSize,   // height
		0,                  // border
		gl.DEPTH_COMPONENT, // format
		gl.UNSIGNED_INT,    // type
		null);              // data
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
		var depthFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,       // target
			gl.DEPTH_ATTACHMENT,  // attachment point
			gl.TEXTURE_2D,        // texture target
			depthTexture,         // texture
			0);                   // mip level
    	gl.bindTexture(gl.TEXTURE_2D, null);
    	// create a color texture of the same size as the depth texture
		var colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			depthTextureSize,
			depthTextureSize,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null,
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
	// attach it to the framebuffer
	gl.framebufferTexture2D(
 	   gl.FRAMEBUFFER,        // target
 	   gl.COLOR_ATTACHMENT0,  // attachment point
 	   gl.TEXTURE_2D,         // texture target
 	   colorTexture,         // texture
 	   0);                    // mip level

  
    	gl.bindTexture(gl.TEXTURE_2D,null);
    	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    	depthFramebuffer.depthTexture = depthTexture;
    	depthFramebuffer.colorTexture = colorTexture;
    	depthFramebuffer.size = depthTextureSize;
    	
    	return depthFramebuffer;
	}

/*
draw the car
*/
Renderer.drawCar = function (gl) {
  
    M = glMatrix.mat4.create();
    rotate_transform = glMatrix.mat4.create();
    translate_matrix = glMatrix.mat4.create();
    scale_matrix = glMatrix.mat4.create();
    wheel_rotate = glMatrix.mat4.create();
    
    //per far girare la ruota applico una rotazione intorno l'asse y di Renderer.car.wheelsAngle 
    glMatrix.mat4.fromRotation(wheel_rotate, Renderer.car.wheelsAngle , [0, 1, 0]);
  
    //draw the box
    glMatrix.mat4.fromTranslation(translate_matrix,[0,1.6,0]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.75,0.3,1.5]);
    glMatrix.mat4.mul(M,scale_matrix,translate_matrix);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniform1i(this.uniformShader.uSamplerLocation,6);
  
    this.drawObject(gl,this.cube,[1.0,0.0,0.0,1.0],[1.0,0.0,0.0,1.0],this.uniformShader);  //funzione che disegna il cubo
    Renderer.stack.pop();
  
    //draw the box   
    M = glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(translate_matrix,[0,3.8,0.0]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.55,0.3,0.9]);
    glMatrix.mat4.mul(M,scale_matrix,translate_matrix);
   
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniform1i(this.uniformShader.uSamplerLocation,6);
  
    this.drawObject(gl,this.cube,[1.0,0.0,0.0,1.0],[1.0,0.0,0.0,1.0],this.uniformShader);  //funzione che disegna il cubo
    Renderer.stack.pop();

    //draw the wheel
    M1 = glMatrix.mat4.create();
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(M1,translate_matrix,rotate_transform);
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.3,0.3]);
    glMatrix.mat4.mul(M1,scale_matrix,M1);

    //decidiamo con quale angolo fare la rotazione
    speedWheelsAngle += Renderer.car.speed;
    if(speedWheelsAngle > 3.14 * 10){ 
      speedWheelsAngle -= 3.14 * 10;
    }else if (speedWheelsAngle < - (3.14 * 10)){
      speedWheelsAngle += 3.14 * 10;
    }
    speedRotationMatrix = glMatrix.mat4.create();
    //per far girare la ruota su se stessa basta applicare una rotazione intorno se stessa/x
    glMatrix.mat4.fromRotation(speedRotationMatrix, speedWheelsAngle, [-1, 0, 0]);
    glMatrix.mat4.mul(M1, speedRotationMatrix, M1);

    glMatrix.mat4.identity(M);
  
    //ruota anteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
   
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,4);
  
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna cilindro 
    Renderer.stack.pop();
    
    //ruota anteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,4);
  
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna cilindro
    Renderer.stack.pop();
    
    //ruota posteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,4);
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);
    Renderer.stack.pop();
    
    //ruota posteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,4);
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);
    Renderer.stack.pop();

    //draw cerchioni
    M2 = glMatrix.mat4.create();
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(M2,translate_matrix,rotate_transform);
    glMatrix.mat4.fromScaling(scale_matrix,[0.15,0.2,0.2]);
    glMatrix.mat4.mul(M2,scale_matrix,M2);
    
    glMatrix.mat4.identity(M);
  
    //cerchione anteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,5);
  
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione anteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,5);
  
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione posteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,5);
  
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione posteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniform1i(this.uniformShader.uSamplerLocation,5);
  
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0],this.uniformShader);//funzione che disegna  cilindro
    Renderer.stack.pop();
};

Renderer.drawScene = function (gl, shader, b) {

	//gl.enable(gl.CULL_FACE);  //abilita il culling,cioè non renderizzo il dentro degli oggetti(non vedo niente dentro i palazzi)
  this.stack = new MatrixStack();
  
  gl.enable(gl.DEPTH_TEST);  //abilita il depth test

  gl.useProgram(shader);
  
  gl.uniformMatrix4fv(shader.uProjectionMatrixLocation,     false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, (gl.canvas.width/gl.canvas.height), 1, 500));

  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);

  var invV = Renderer.cameras[Renderer.currentCamera].matrix();  //matrice di vista
  
  // initialize the stack with the identity
  this.stack.loadIdentity();  //carico lo stack da qui con la matrice identità = non c'è niente
  // multiply by the view matrix
  this.stack.multiply(invV);
  
  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame);  //projection * viewport perchè la macchina avrà le sue coordinate ma io devo portarla nelle coordinate del mio mondo/della pista
  if(b == 1) {
  this.drawCar(gl);
  }
  this.stack.pop();

  gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, this.stack.matrix);

  //Headlights
  var eye = glMatrix.vec3.create();
  var target = glMatrix.vec3.create();
  glMatrix.vec3.transformMat4(eye, [0, 0.5, -1], this.car.frame);
  glMatrix.vec3.transformMat4(target, [0, 0.1, -6], this.car.frame);
  var HeadlightViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
  gl.uniform1i(shader.uHeadlightSamplerLocation, 7);
  gl.uniformMatrix4fv(shader.uHeadlightViewMatrixLocation, false, HeadlightViewMatrix);
  gl.uniformMatrix4fv(shader.uHeadlightProjectionMatrixLocation, false, glMatrix.mat4.perspective(glMatrix.mat4.create(),Math.PI / 10, 1.3, 0.1, 20));

  // drawing the static elements (ground, track and buldings)
	gl.uniform1i(shader.uSamplerLocation,3);
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0],shader);
	
	gl.uniform1i(shader.uSamplerLocation,0);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0],shader);
 	
	gl.uniform1i(shader.uSamplerLocation,1);
	for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0],shader);
	gl.uniform1i(shader.uSamplerLocation,2);
  for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObjTex[i].roof, [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0],shader);

	gl.useProgram(null);
};

Renderer.Display = function () {
  //Shadow pass
  framebuffer = createFramebuffer(Renderer.gl,shadowMapSize);
	Renderer.gl.bindFramebuffer(Renderer.gl.FRAMEBUFFER,framebuffer);	//gli passo il framebuffer
	Renderer.gl.viewport(0, 0, shadowMapSize, shadowMapSize);  //settaggio della vievport
	Renderer.gl.clearColor(1.0,1.0,0.0,1.0);
	Renderer.gl.clearDepth(1.0); 
  Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT|Renderer.gl.DEPTH_BUFFER_BIT);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, framebuffer.depthTexture);
	Renderer.drawScene(Renderer.gl,Renderer.shaderDepth, 0);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, null);
  Renderer.gl.bindFramebuffer(Renderer.gl.FRAMEBUFFER, null);  //scolleghiamo il FrameBuffer
  
  //Light pass
  Renderer.gl.activeTexture(Renderer.gl.TEXTURE8);  //texture dedicata al depth
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, framebuffer.depthTexture);  //binding della texture che ho creato 
  Renderer.gl.viewport(0, 0, Renderer.gl.canvas.width, Renderer.gl.canvas.height);
  Renderer.gl.clearColor(0.34, 0.5, 0.74, 1.0);
  Renderer.gl.clearDepth(1.0);
  Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT | Renderer.gl.DEPTH_BUFFER_BIT);
  //active texture texture_n+1 bind framebuffer.depthTexture e poi passo n+1 allo shader
  Renderer.gl.useProgram(Renderer.uniformShader);
  Renderer.gl.uniform1i(this.uniformShader.uDepthSamplerLocation,8);
  Renderer.gl.useProgram(null);
  Renderer.drawScene(Renderer.gl, Renderer.uniformShader, 1);  //disegno la scena
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, null);
  window.requestAnimationFrame(Renderer.Display) ;
};

Renderer.setupAndStart = function () {
  
 /* create the canvas */
	Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  
 /* get the webgl context */
	Renderer.gl = Renderer.canvas.getContext("webgl");

  /* read the webgl version and log */
	var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
	log("glversion: " + gl_version);
	var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
	log("glsl  version: "+GLSL_version);
  Renderer.gl.getExtension('OES_standard_derivatives');
  var ext = Renderer.gl.getExtension('WEBGL_depth_texture');
	  		if (!ext) {
   		 	return alert('need WEBGL_depth_texture');
  			}
  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);
   
  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);
  Renderer.shaderDepth = new shaderDepth(Renderer.gl);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);
  Renderer.canvas.addEventListener('mouseup',on_mouseup,false);
  Renderer.canvas.addEventListener('mousedown',on_mousedown,false);
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);

  Renderer.Display();
}

dragging = false;  //variabile booleana che viene settata a true quando il mouse viene mosso 
absoluteMouseCoords = [0,0];  //coordinate assolute quando inizi a cliccare il mouse

on_mouseup = function(e) {  //quando il muose non viene premuto
  dragging = false;
  Renderer.cameras[Renderer.currentCamera].mouseCoords = [0,0];  //per evitare che si muova all'infinito
}

on_mousedown = function(e) {  //quando il mouse viene premuto
  dragging = true;
  absoluteMouseCoords = [e.offsetX, e.offsetY];
}
//il movimento del mouse determina la direzione
on_mouseMove = function(e){  //funzione che calcola 
  if(dragging){
    let newCoords = [e.offsetX, e.offsetY];
    Renderer.cameras[Renderer.currentCamera].mouseCoords = [ //differenza tra le coordinate assolute che erano state segnate a dove hai mosso il mouse
      newCoords[0] - absoluteMouseCoords[0],
      newCoords[1] - absoluteMouseCoords[1]
    ];
    absoluteMouseCoords = newCoords;
  }
}

on_keyup = function(e){
	if(Renderer.currentCamera == 2) { //se la camera in uso è la ObserverCamera
    switch(e.key) {
      case 'D':
      case 'd':
      case 'A':
      case 'a': {
        Renderer.cameras[Renderer.currentCamera].xMovement = 0;
        break;
      }
      case 'w':
      case 'W':
      case 'S':
      case 's': {
        Renderer.cameras[Renderer.currentCamera].zMovement = 0;
        break;
      }
      case 'e':
      case 'E':
      case 'C':
      case 'c': {
        Renderer.cameras[Renderer.currentCamera].yMovement = 0;
        break;
      }
    }
  } else {  //ChaseCamera/FollowFromUpCamera
	  Renderer.car.control_keys[e.key] = false;
  }
}
/* creiamo un mapping tra i tasti e le azioni -> q=sopra,z=sotto,w=avanti,s=indietro,a=sinistra,d=destra */
on_keydown = function(e){
	if(Renderer.currentCamera == 2) {  //se la camera in uso è la ObserverCamera
    switch(e.key) {
      case 'D':
      case 'd': {
        Renderer.cameras[Renderer.currentCamera].xMovement = -1;
        break;
      }
      case 'A':
      case 'a': {
        Renderer.cameras[Renderer.currentCamera].xMovement = +1;
        break;
      }
      case 'W':
      case 'w': {
        Renderer.cameras[Renderer.currentCamera].zMovement = +1;
        break;
      }
      case 'S':
      case 's': {
        Renderer.cameras[Renderer.currentCamera].zMovement = -1;
        break;
      }
      case 'E':
      case 'e': {
        Renderer.cameras[Renderer.currentCamera].yMovement = -1;
        break;
      }
      case 'C':
      case 'c': {
        Renderer.cameras[Renderer.currentCamera].yMovement = +1;
        break;
      }
    }
  } else {  //ChaseCamera/FollowFromUpCamera
	  Renderer.car.control_keys[e.key] = true;
  }
}

window.onload = Renderer.setupAndStart;

update_camera = function (value){
  Renderer.currentCamera = value;
}