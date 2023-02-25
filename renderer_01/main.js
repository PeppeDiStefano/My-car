/*
the FollowFromUpCamera always look at the car from a position above right over the car
*/
FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();  //si tiene una copia del frame da aggiornare
  
  /* update the camera with the current car position */
  this.update = function(car_frame){
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
  
  ComputeNormals(obj);    //calcola le normali di ogni obj
  
  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
Renderer.drawObject = function (gl, obj, fillColor, lineColor) {

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aNormalIndex);
  gl.vertexAttribPointer(this.uniformShader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
  
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
  lamps = Game.scene.lamps;
  Renderer.triangle = new Triangle();
  
  this.cube = new Cube(10);
  this.createObjectBuffers(gl,this.cube);
  
  this.cylinder = new Cylinder(10);
  this.createObjectBuffers(gl,this.cylinder );

  Renderer.createObjectBuffers(gl, this.triangle);

  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i){
    Renderer.createObjectBuffers(gl,Game.scene.buildingsObj[i]);
  }
  speedWheelsAngle = 0;
};

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
    
    //decidiamo con quale angolo fare la rotazione
    speedWheelsAngle += Renderer.car.speed;
   if(speedWheelsAngle > 3.14 * 2){ //una rotazione di K*Pi = rotazione di Pi
      speedWheelsAngle -=  3.14 * 2;
    }else if (speedWheelsAngle < - (3.14 * 2)){
      speedWheelsAngle += 3.14 * 2;
    }
    speedRotationMatrix = glMatrix.mat4.create();
    //per far girare la ruota su se stessa basta applicare una rotazione intorno se stessa/x
    glMatrix.mat4.fromRotation(speedRotationMatrix, speedWheelsAngle, [-1, 0, 0]);
    glMatrix.mat4.mul(M1, speedRotationMatrix, M1);

  
    glMatrix.mat4.identity(M);
  
    //ruota anteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.9,0.25,-1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
   
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna cilindro
    Renderer.stack.pop();
    
    //ruota anteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.9,0.25,-1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna cilindro
    Renderer.stack.pop();
    
    //ruota posteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna cilindro
    Renderer.stack.pop();
    
    //ruota posteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M, wheel_rotate, M1)
    glMatrix.mat4.mul(M,translate_matrix,M);
    
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    
    this.drawObject(gl,this.cylinder,[0.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna cilindro
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
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione anteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,-1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione posteriore dx
    glMatrix.mat4.fromTranslation(translate_matrix,[0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna  cilindro
    Renderer.stack.pop();
  
    //cerchione posteriore sx
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.85,0.25,1.2]);
    glMatrix.mat4.mul(M,translate_matrix,M2);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
   
    this.drawObject(gl,this.cylinder,[1.0,1.0,1.0,1.0],[0.0,0.0,0.0,1.0]);//funzione che disegna  cilindro
    Renderer.stack.pop();
};

/* aggiungiamo un semplice oggetto per rappresentare le sorgenti luminose. Geometry è un punto in coordinate omogenee che rappresenta sia luci direzionali che puntiformi, color è il colore della luce */
function Light(geometry, color) {
	if (!geometry) this.geometry = [0.0, -1.0, 0.0, 0.0];
	else this.geometry = geometry;
	if (!color) this.color = [1.0, 1.0, 1.0, 1.0];
	else this.color = color;
}

function Lamp(position, light) {
	this.position = position;
	this.light = light;
}

Renderer.drawScene = function (gl) {

  gl.enable(gl.CULL_FACE);  //abilita il culling,cioè non renderizzo il dentro degli oggetti(non vedo niente dentro i palazzi)
    
  var width = this.canvas.width;  //larghezza viewport
  var height = this.canvas.height;  //altezza viewport
  var ratio = width / height;
  this.stack = new MatrixStack();

  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);  //abilita il depth test

  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(this.uniformShader);
  
  gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation,     false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));

  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);

  var invV = Renderer.cameras[Renderer.currentCamera].matrix();  //matrice di vista

  //Phong 
  inverseViewMatrix = glMatrix.mat4.create();  //inversa della matrice di vista
  glMatrix.mat4.invert(inverseViewMatrix, invV); //calcolo l'inversa della matrice di vista
  viewSpaceLightDirection = glMatrix.vec4.create(); //direzione della luce in view space, che si ottiene moltiplicando l'inversa della matrice di vista con il vettore tmpDirection
  tmpDirection = Game.scene.weather.sunLightDirection; //serve un vettore a 4 componenti
  tmpDirection[3] = 0; //metto la 4a componente a 0 perchè vettore
  glMatrix.vec4.transformMat4(viewSpaceLightDirection, tmpDirection, invV); //moltiplica la matrice per il vettore
  glMatrix.vec4.normalize(viewSpaceLightDirection, viewSpaceLightDirection);
  gl.uniform3fv(this.uniformShader.uVSLightDirectionLocation, viewSpaceLightDirection.subarray(0,3)); //inserisce il valore nello shader

  //passo i lampioni allo shader
  var spotlights = [];
  //prima creo una matrice per inserire i vettori da passare allo shader e li trasformo in view space
  for (var i = 0; i < Game.scene.lamps.length; i++) {
    var Spotlightvs = glMatrix.vec3.transformMat4(
      glMatrix.vec3.create(),
      [
        Game.scene.lamps[i].position[0],
        Game.scene.lamps[i].height,
        Game.scene.lamps[i].position[2]
      ],
      invV
    );
    spotlights[i * 3 + 0] = Spotlightvs[0];
    spotlights[i * 3 + 1] = Spotlightvs[1];
    spotlights[i * 3 + 2] = Spotlightvs[2];
  }
  gl.uniform3fv(this.uniformShader.uSpotlightsLocation, spotlights); //passo allo shader

  gl.uniformMatrix4fv(this.uniformShader.uViewMatrixLocation, false, invV); //passo allo shader la matrice di vista

  // initialize the stack with the identity
  this.stack.loadIdentity();  //carico lo stack da qui con la matrice identità = non c'è niente
  // multiply by the view matrix
  this.stack.multiply(invV);
  
  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame); //projection * viewport perchè la macchina avrà le sue coordinate ma io devo portarla nelle coordinate del mio mondo/della pista
  this.drawCar(gl);
  this.stack.pop();

  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

  // drawing the static elements (ground, track and buldings)  
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0.3, 0.7, 0.2, 1.0]);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0.9, 0.8, 0.7, 1.0]);
	for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.8, 0.8, 0.8, 1.0]);

  //draw the lamps
  var lamps = Game.scene.lamps;
  this.streetLamps = [];
	for (var i = 0; i < 12; ++i) {    // take only the first 12 lights for memory constraints
		var g = lamps[i].position;
		var lightPos = [lamps[i].position[0], lamps[i].position[1], lamps[i].position[2], 1.0];
		lightPos[1] = lightPos[1] + lamps[i].height[i];
		this.streetLamps[i] = new Lamp(g, new Light(lightPos, [0.3, 0.3, 0.2, 1]));
	}
  for (var t in this.streetLamps) {
    var stack_lamp = this.stack;
		stack_lamp.push();
    
    M3 = glMatrix.mat4.create();
		glMatrix.mat4.fromTranslation(M3, this.streetLamps[t].position);
		stack_lamp.multiply(M3);
		stack_lamp.push();

    //disegno il sopra del lampione
	  var M4 =  glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(M4, [0, 3, 0]);
	  stack_lamp.multiply(M4);

	  var M5 = glMatrix.mat4.create();
    glMatrix.mat4.fromScaling(M5, [0.4, 0.2, 0.4]);
	  stack_lamp.multiply(M5);

	  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack_lamp.matrix);
	  this.drawObject(gl, this.cube, [1, 1, 1, 1.0],[1, 1, 1, 1.0]);   //funzione che disegna il cubo
 	  stack_lamp.pop();

    //disegno il sotto del lampione
	  stack_lamp.push();
	  var M6 = glMatrix.mat4.create();
    glMatrix.mat4.fromScaling(M6,[0.05, 1.5, 0.05]);  
	  stack_lamp.multiply(M6);

	  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack_lamp.matrix);
    this.drawObject(gl, this.cylinder, [0, 0, 0, 1.0],[0, 0, 0, 1.0]);  //funzione che disegna il cilindro
	  stack_lamp.pop();
	stack_lamp.pop();
	}

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