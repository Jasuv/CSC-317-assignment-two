/*
 * Boid simulation
 *  
 * Created by: jasuv
 * 
 * Reference: https://www.red3d.com/cwr/boids/
 * 
 */

// create canvas
const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const l = canvas.getContext('2d');

// boid class
function Boid(x, y, dx, dy) {
    this.pos = new Array(x, y);
    this.vel = new Array(dx, dy);
}

// load fish image
const fish = new Image();
const fish_left = new Image();
fish.src = '../resources/fish.svg';
fish_left.src = '../resources/fish_left.svg';


// settings
const count = 500;
const vision = 50;
const speed = 10;
const avoidDist = 30;
const size = 100;

// force weights
const cohesionWeight = 0.005;
const separationWeight = 0.05;
const alignmentWeight = 0.03;
const boundaryWeight = 0.0001;

// gets mous position
let cursorX = 0;
let cursorY = 0;
window.addEventListener('mousemove', e => {
    cursorX = e.clientX;
    cursorY = e.clientY;
});


// spawn boids
let boids = new Array();
for (let i = 0; i < count; i++) {
    boids[i] = new Boid(Math.random() * canvas.width * 2 - canvas.width,
                        Math.random() * canvas.height * 2 - canvas.height,
                        Math.random() * canvas.width - centerX,
                        Math.random() * canvas.height - centerY);
}

/* 
 * cheers to markE/Dean Radcliffe for coming up with this fps limiter (:
 * https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
 * 
 */
// set fps
var stop = false;
var frameCount = 0;
var fpsInterval = 1000/60;
var then = window.performance.now();
var startTime = then;
var now, then, elapsed;


main();
function main(newTime) {
    // limiter
    if (stop) return;

    // get next frame
    requestAnimationFrame(main);

    // calc elapsed time since last loop
    now = newTime;
    elapsed = now - then;

    // after enough time has passed draw the next frame
    if (elapsed > fpsInterval) {
        // prepare for next frame
        then = now - (elapsed%fpsInterval);

        // updates each boids pos and vel
        for (let i = 0; i < count; i++) {
            KeepInBounds(boids[i]);
            Cohesion(boids[i]);
            Separation(boids[i]);
            Alignment(boids[i]);
            AvoidCursor(boids[i]);
            limitSpeed(boids[i]);
            boids[i].pos[0] += boids[i].vel[0];
            boids[i].pos[1] += boids[i].vel[1];
        }

        // draw the frame
        draw();
    }
}

// attracts boids to one another
function Cohesion(boid) {
    let x = 0, y = 0, near = 1;
    x = boid.pos[0];
    y = boid.pos[1];

    // finds which boids are in sight
    for (let i = 0; i < count; i++) {
        if (distance(boid, boids[i]) < vision) {
            x += boids[i].pos[0];
            y += boids[i].pos[1];
            near++;
        }
    }

    // force them together
    boid.vel[0] += (x / near - boid.pos[0]) * cohesionWeight;
    boid.vel[1] += (y / near - boid.pos[1]) * cohesionWeight;
}

// boids too close will repel eachother to avoid crashing
function Separation(boid) {
    let x = 0, y = 0;

    // finds which boids are too close
    for (let i = 0; i < count; i++) {
        if ((boids[i] != boid) && (distance(boid, boids[i]) < avoidDist)) {
            x += boid.pos[0] - boids[i].pos[0];
            y += boid.pos[1] - boids[i].pos[1];
        }
    }

    // force them away
    boid.vel[0] += x * separationWeight;
    boid.vel[1] += y * separationWeight;
}

// boids will avoid the mouse cursor
function AvoidCursor(boid) {
    let x = 0, y = 0, d_x = 0, d_y = 0, dist = 0;

    d_x = boid.pos[0] - cursorX;
    d_y = boid.pos[1] - cursorY;
    dist = Math.sqrt(d_x * d_x + d_y * d_y);

    if (dist < avoidDist * 2) {
        boid.vel[0] += (d_x / dist) * 2;
        boid.vel[1] += (d_y / dist) * 2;
    }
}


// boids will naturally try to match velocity
function Alignment(boid) {
    let x = 0, y = 0, near = 1;

    // finds which boids are in vision
    for (let i = 0; i < count; i++) {
        if ((boids[i] != boid) && (distance(boid, boids[i]) < vision)) {
            x += boids[i].vel[0];
            y += boids[i].vel[1];
            near++;
        }
    }

    // slightly adjust to other's velocity
    boid.vel[0] += (x / near) * alignmentWeight;
    boid.vel[1] += (y / near) * alignmentWeight;
}

// brings boids back to the center
function KeepInBounds(boid) {
    let d_x = 0, d_y = 0, dist = 0, force = 0;

    // distance from center
    d_x = boid.pos[0] - centerX;
    d_y = boid.pos[1] - centerY;
    dist = Math.sqrt(d_x * d_x + d_y * d_y);

    // negative force that brings them back
    force = dist * boundaryWeight;
    boid.vel[0] -= (d_x / dist) * force;
    boid.vel[1] -= (d_y / dist) * force;
}

// calcualtes the distance between two boids
function distance(boid, otherBoid) {
    let d_x = 0, d_y = 0, dist = 0;

    d_x = otherBoid.pos[0] - boid.pos[0];
    d_y = otherBoid.pos[1] - boid.pos[1];
    dist = Math.sqrt(d_x * d_x + d_y * d_y);

    return dist;
}

// caps the speed of the boids
function limitSpeed(boid) {
    let dx = 0, dy = 0, boidSpeed = 0;

    // magnitude of velocity
    dx = boid.vel[0];
    dy = boid.vel[1];
    boidSpeed = Math.sqrt(dx * dx + dy * dy);

    // caps the speed
    if (boidSpeed > speed) {
        boid.vel[0] = (boid.vel[0] / boidSpeed) * speed;
        boid.vel[1] = (boid.vel[1] / boidSpeed) * speed;
    }
}

// draw function
function draw() {
    // clears canvas
    l.clearRect(0, 0, innerWidth, innerHeight);

    // draws each boid
    let x = 0, y = 0, dx = 0;
    for (let i = 0; i < count; i++) {
        x = boids[i].pos[0];
        y = boids[i].pos[1];
        dx = boids[i].vel[0];

        // having two images for the fish is better for performance than rotating the canvas to draw the direction
        if (dx > 0)
            l.drawImage(fish, x - size / 2, y - size / 2, size, size);
        else
            l.drawImage(fish_left, x - size / 2, y - size / 2, size, size);
    }
}