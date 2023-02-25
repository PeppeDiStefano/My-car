/*
the FollowFromUpCamera always look at the car from a position above right over the car
*/
FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();  //si tiene una copia del frame da aggiornare
  
  /* update the camera with the current car position */
  this.update = function(car_frame){  //quando devo aggiornare,gli passo il frame della macchina
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    let up = glMatrix.vec4.create();
    
    glMatrix.vec3.transformMat4(eye, [0  ,50,0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
    glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
    
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));	//lookAt costruisce la matrice di        trasformazione, cioè l'inverso del frame di vista
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

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();  //punto di vista
    let target = glMatrix.vec3.create();  //dove deve guardare
    glMatrix.vec3.transformMat4(eye, [0,2,6.0], this.frame);  //prendo il punto di vista e lo trasformo per il frame della       macchina
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);  //stessa cosa della riga precedente
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);  //lookAt prende il punto di vista,dove deve guardare e il vettore UP e fa i prodotti vettoriali per fare la matrice	
  }
}

/* the main object to be implemented */
var Renderer = new Object();

/* array of cameras that will be used */
Renderer.cameras = [];
Renderer.cameras.push(new FollowFromUpCamera());  //add a FollowFromUpCamera
Renderer.cameras.push(new ChaseCamera());  //add a ChaseCamera
Renderer.currentCamera = 0;  //set the camera currently in use

/*
create the buffers for an object as specified in common/shapes/triangle.js
*/
Renderer.createObjectBuffers = function (gl, obj) {

  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
Renderer.drawObject = function (gl, obj, fillColor, lineColor) {

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/*
initialize the object in the scene
*/
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
  for (var i = 0; i < Game.scene.buildings.length; ++i) 
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObj[i]);
  
};

/*
draw the car
*/
Renderer.drawCar = function (gl) {

    M = glMatrix.mat4.create();
    rotate_transform = glMatrix.mat4.create();
    translate_matrix = glMatrix.mat4.create();
    scale_matrix = glMatrix.mat4.create();

    //draw the box
    glMatrix.mat4.fromTranslation(translate_matrix,[0,1.6,0]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.75,0.3,1.5]);
    glMatrix.mat4.mul(M,scale_matrix,translate_matrix);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

    this.drawObject(gl,this.cube,[1.0,0.0,0.0,1.0],[1.0,0.0,0.0,1.0]);  //funzione che disegna il cubo
    Renderer.stack.pop();
  
    //draw the box   
    M = glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(translate_matrix,[0,3.8,0.0]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.55,0.3,0.9]);
    glMatrix.mat4.mul(M,scale_matrix,translate_matrix);
   
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
    
    this.drawObject(gl,this.cube,[1.0,0.0,0.0,1.0],[1.0,0.0,0.0,1.0]);  //funzione che disegna il cubo
    Renderer.stack.pop();

    //draw the wheel  
    M1 = glMatrix.mat4.create(); 
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(M1,translate_matrix,rotate_transform);
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.3,0.3]);
    glMatrix.mat4.mul(M1,scale_matrix,M1); 

    glMatrix.mat4.identity(M);
  
    //ruota anteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M1);
   
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
    
    //ruota anteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M1);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
    
    //ruota posteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M1);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
    
    //ruota posteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M1);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();

    //draw cerchioni
    M2 = glMatrix.mat4.create();
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(M2,translate_matrix,rotate_transform);
    glMatrix.mat4.fromScaling(scale_matrix,[0.15,0.2,0.2]);
    glMatrix.mat4.mul(M2,scale_matrix,M2);
    
    glMatrix.mat4.identity(M);
  
    //primo cerchione
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
  
    //secondo cerchione
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
  
    //terzo cerchione
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
  
    //quarto cerchione
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[1.0,1.0,1.0,1.0]);  //funzione che disegna il cilindro
    Renderer.stack.pop();
};

Renderer.drawScene = function (gl) {

  var width = this.canvas.width;  //larghezza viewport
  var height = this.canvas.height;  //altezza viewport
  var ratio = width / height;
  this.stack = new MatrixStack();

  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);  //abilita il depth test

  // Clear the framebuffer,
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(this.uniformShader); 
  
  gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation,     false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));

  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);
  
  var invV = Renderer.cameras[Renderer.currentCamera].matrix();  //matrice di vista
  
  // initialize the stack with the identity
  this.stack.loadIdentity();  //carico lo stack da qui con la matrice identità = non c'è niente
  // multiply by the view matrix
  this.stack.multiply(invV);  

  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame);  //projection * viewport perchè la macchina avrà le sue coordinate ma io devo portarla nelle coordinate del mio mondo/della pista
  this.drawCar(gl);
  this.stack.pop();

  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

  // drawing the static elements (ground, track and buldings)  
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
  
  gl.useProgram(null);
};

Renderer.Display = function () {
  Renderer.drawScene(Renderer.gl);
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

  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);

  Renderer.Display();
}

on_mouseMove = function(e){}

on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;
}
on_keydown = function(e){
	Renderer.car.control_keys[e.key] = true;
}

window.onload = Renderer.setupAndStart;

update_camera = function (value){
  Renderer.currentCamera = value;
}