var gl;
var canvas;
var program;
var bufferId;
var mode; // boolean variable to keep track when 'm' is pressed
var targetPoints; // represents a point of a target (4 points to make 1 target)
var xVal; // holds the x-coordinate of where the mouse clicked
var yVal; // holds the y-coordinate of where the mouse clicked
var hitTargets; // array that holds boolean values representing whether a target was hit or not
var increaseAction; // used to increment a specific point value
var count; // represents the number of targets left
var targetDirection; // array that holds values to determine target direction


window.onload = function init() {
    canvas = document.getElementById("gl-canvas"); // fetching reference to canvas element from html file
    gl = canvas.getContext('webgl2'); // grabbing the WebGL2 context for canvas
    if(!gl) {
        alert("WebGL isn't available");
    }

    // Compiling vertex and fragment shaders from html into a shader program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); // Using that program ^ for rendering

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black for background

    // To set the targets in motion by hitting 'm' key
    window.setInterval(update, 5);
    mode = false;
    window.addEventListener("keydown", function(event) {
       switch(event.key) {
           case "m":
               mode = !mode;
       }
       requestAnimationFrame(render);
    });

    // Array holding targets hit and unhit
    hitTargets = [false, false, false, false, false, false, false];

    // Initialize count to 7, since game starts with 7 targets
    count = 7;

    // Initializing array for targetDirection
    targetDirection = [];

    makeTargetsAndBuffer();

    mouseCrossHair();

    resetB();

    // To respond when user clicks within the canvas area (includes targets and remaining space)
    canvas.addEventListener("mousedown", mouseDownListener);
    xVal = 0; // x-coordinate of where mouse clicked
    yVal = 0; // y-coordinate of where mouse clicked

    render();
}

// Changes mouse cursor to a crosshair
function mouseCrossHair() {
    document.getElementById("gl-canvas").style.cursor = "crosshair";
}

// Reset function - will reset the game when the reset button is clicked
function resetB() {
    document.getElementById("feedback").textContent="You have " + 7 + " targets left.";
    count = 7;
    hitTargets = [false, false, false, false, false, false, false];
    mode = false;
    makeTargetsAndBuffer();
}

// Mouse down function - Finds out where the user clicked,
// populates hitTargets with "true" instead of "false" if a target is hit,
// and provides feedback for how many targets are left
function mouseDownListener(event) {
    // Getting and converting the x and y coordinates
    var rect = canvas.getBoundingClientRect();
    var canvasY = event.clientY - rect.top;
    var flippedY = canvas.height - canvasY;
    yVal = 2 * flippedY / canvas.height - 1;
    xVal = 2 * (event.clientX - rect.left)/canvas.width - 1;

    increaseAction = 0;

    for (var i = 0; i < 8; i++) {
        if (hitTargets[i] == false && xVal >= targetPoints[increaseAction][0] && yVal >= targetPoints[increaseAction][1]
            && xVal <= targetPoints[2+increaseAction][0] && yVal <= targetPoints[2+increaseAction][1]) {
            hitTargets[i] = true;
            count--;
        }
        increaseAction = increaseAction + 4;
    }

    if (count > 1)
        document.getElementById("feedback").textContent = "You have " + count + " targets left.";
    else if (count == 1)
        document.getElementById("feedback").textContent = "You have " + count + " target left.";
    else
        document.getElementById("feedback").textContent = "You have " + count + " targets left. Congrats.";

    render();
}

// Function that makes the targets and populates the targetDirection array
function makeTargetsAndBuffer() {
    targetPoints = [];

    for (var i = 0; i < 8; i++) {
        var random = (1.6 * Math.random() - 0.9);

        // Creating the four corners of a target
        targetPoints.push(vec4(random, random, 0, 1));
        targetPoints.push(vec4(random, 0.1 + random, 0, 1));
        targetPoints.push(vec4(0.1 + random, 0.1 + random, 0, 1));
        targetPoints.push(vec4(0.1 + random, random, 0, 1));

        // Setting the directions for each target
        if (random > 0.2) {
            targetDirection.push(vec2(Math.random()/100 - 0.005, 0));
        } else if (random < -0.5) {
            targetDirection.push(vec2(0, Math.random()/100 - 0.005));
        } else {
            targetDirection.push(vec2(Math.random()/100 - 0.005, Math.random()/100 - 0.005));

        }
    }

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(targetPoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

// Update function - Sets targets into motion when 'm' is pressed
function update() {
    increaseAction = 0;

    if (mode) {
        for (var i = 0; i < 8; i++) {

            // To make sure the targets don't go off the screen
            if (targetPoints[increaseAction][0] <= -1 || targetPoints[2+increaseAction][0] >= 1) {
                targetDirection[increaseAction/4][0] *= -1;
            } else if (targetPoints[increaseAction][1] <= -1 || targetPoints[2+increaseAction][1] >= 1) {
                targetDirection[increaseAction/4][1] *= -1;
            }

            // To make a target move
            targetPoints[0+increaseAction][0] += targetDirection[increaseAction/4][0];
            targetPoints[1+increaseAction][0] += targetDirection[increaseAction/4][0];
            targetPoints[2+increaseAction][0] += targetDirection[increaseAction/4][0];
            targetPoints[3+increaseAction][0] += targetDirection[increaseAction/4][0];
            targetPoints[0+increaseAction][1] += targetDirection[increaseAction/4][1];
            targetPoints[1+increaseAction][1] += targetDirection[increaseAction/4][1];
            targetPoints[2+increaseAction][1] += targetDirection[increaseAction/4][1];
            targetPoints[3+increaseAction][1] += targetDirection[increaseAction/4][1];

            increaseAction = increaseAction + 4;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(targetPoints), gl.STATIC_DRAW);
    }
    requestAnimationFrame(render);
}

// Render function - Drawing a new frame
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    var increase = 0;

    // Draws targets only if they haven't been hit
    for (var i = 0; i < 8; i++) {
        if(hitTargets[i] == false) {
            gl.drawArrays(gl.TRIANGLE_FAN, increase, 4);
        }
        increase = increase + 4;
    }
}