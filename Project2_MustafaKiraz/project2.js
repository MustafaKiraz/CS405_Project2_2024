/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */

function SetSpecularLight(param) {
    const specularIntensity = (100 - param.value) / 100.0;
    meshDrawer.setSpecularLighting(specularIntensity);
    DrawScene();
}




function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.colorLoc = gl.getUniformLocation(this.prog, 'color');
        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.numTriangles = 0;
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
        this.normalbuffer = gl.createBuffer();
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos'); 
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
        this.defaultShininess = 32.0;
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessLoc, this.defaultShininess);
    }

    setMesh(vertPos, texCoords, normalCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
    }

    draw(trans, viewPos) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);
        
        // Set view position to a better default position for seeing specular highlights
        gl.uniform3fv(this.viewPosLoc, new Float32Array([0, 0, 5]));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        updateLightPos();
        gl.uniform3fv(this.lightPosLoc, new Float32Array([lightX, lightY, 2]));
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }
	


	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);
 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		gl.useProgram(this.prog);
        gl.uniform1i(this.enableLightingLoc, show);
        if (show) {
            gl.uniform1f(this.shininessLoc, this.defaultShininess);
        }
	}
	
	setAmbientLight(ambient) {
		gl.useProgram(this.prog);
        gl.uniform1f(this.ambientLoc, ambient);
	}

	setSpecularLighting(intensity) {
		const shininessValue = intensity * 256.0;
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininessValue);
	}
	
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

const meshFS = `
			precision mediump float;

uniform bool showTex;
uniform bool enableLighting;
uniform sampler2D tex;
uniform vec3 color;
uniform vec3 lightPos;
uniform vec3 viewPos;
uniform float ambient;
uniform float shininess;

varying vec2 v_texCoord;
varying vec3 v_normal;

void main()
{
    if (showTex && enableLighting) {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(lightPos);
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular
        vec3 viewDir = normalize(viewPos);
        vec3 halfwayDir = normalize(lightDir + viewDir);  // Using Blinn-Phong
        float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
        
        // Get texture color
        vec4 texColor = texture2D(tex, v_texCoord);
        
        // Combine all components
        vec3 ambient_component = ambient * texColor.rgb;
        vec3 diffuse_component = diff * texColor.rgb;
        vec3 specular_component = spec * vec3(1.0); // White specular highlights
        
        vec3 result = ambient_component + diffuse_component + specular_component;
        
        gl_FragColor = vec4(result, texColor.a);
    } 
    else if (showTex) {
        gl_FragColor = texture2D(tex, v_texCoord);
    } 
    else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;

	console.log(`Light Position: X=${lightX}, Y=${lightY}, Z=2`)
}
///////////////////////////////////////////////////////////////////////////////////