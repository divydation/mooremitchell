const canvas = document.getElementById("gameCanvas");

const app = new PIXI.Application({
    view: canvas,
    resizeTo: window, 
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    // backgroundColor: 0x141414,
    backgroundColor: 0x000000,
    antialias: true,
});

app.ticker.maxFPS = 60;

// Layer for particles so they draw underneath the ship
const particleGroup = new PIXI.Container();
app.stage.addChild(particleGroup);

// Create controllable square (with directional indicator on front)
const playerSquare = new PIXI.Graphics();
playerSquare.beginFill(0xffffff);

playerSquare.moveTo(-12.5, 12.5);
playerSquare.lineTo(15, 0);
playerSquare.lineTo(-12.5,-12.5);
playerSquare.lineTo(-8, 0);
playerSquare.closePath();

playerSquare.endFill();



const planet = new PIXI.Graphics();
planet.beginFill(0xef233c);        // Set fill color first
planet.drawCircle(0, 0, 150);   // drawCircle(centerX, centerY, radius)
planet.endFill(); 

app.stage.addChild(planet);


// BLOOM & GLOW

const bloomFilter = new PIXI.filters.AdvancedBloomFilter({
    bloomScale: 1,
    blur: 1,
    quality: 5,
    threshold: 0.5
});

app.stage.filters = [bloomFilter];

app.stage.filterArea = app.screen;
app.stage.pixelSnap = true;

glowDistance = 5;
glowStrength = 1;

// const blueGlow = new PIXI.filters.GlowFilter({ distance: glowDistance, outerStrength: glowStrength, color: 0x3a94de });
const orangeGlow = new PIXI.filters.GlowFilter({ distance: glowDistance, outerStrength: glowStrength, color: 0xef6a23 });
// const yellowGlow = new PIXI.filters.GlowFilter({ distance: glowDistance, outerStrength: glowStrength, color: 0xef6a23 });
// const greenGlow = new PIXI.filters.GlowFilter({ distance: 5, outerStrength: 1, color: 0x2EBFA5 });

// particleGroup.filters = [orangeGlow];
// powerLineGraphic.filters = [yellowGlow];
// laserLineGraphic.filters = [blueGlow];
// materialContainer.filters = [greenGlow];


// Center initially
playerSquare.x = window.innerWidth / 2;
playerSquare.y = window.innerHeight / 2;

planet.x = window.innerWidth / 2;
planet.y = window.innerHeight / 2;

app.stage.addChild(playerSquare);

// Physics parameters
let vx = 0;
let vy = 0;
const accel = 0.07;        // Much weaker engine = sluggish start from a stop
const friction = 0.988;    // Very little drag = long drifts
const turnSpeed = 0.045;   // Slow rotation = wide curved turns

// Input tracking
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

const particles = [];

// Smooth RGB interpolation helper: Red -> Orange -> Yellow -> Gray
function getFlameColor(progress) {
    const red = { r: 255, g: 30, b: 0 };
    const orange = { r: 255, g: 120, b: 0 };
    const yellow = { r: 255, g: 220, b: 0 };
    const gray = { r: 100, g: 100, b: 100 };

    let c1, c2, localT;

    if (progress < 0.33) {
        c1 = red;
        c2 = orange;
        localT = progress / 0.33;
    } else if (progress < 0.66) {
        c1 = orange;
        c2 = yellow;
        localT = (progress - 0.33) / 0.33;
    } else {
        c1 = yellow;
        c2 = gray;
        localT = (progress - 0.66) / 0.34;
    }

    // Linearly interpolate RGB components smoothly
    const r = Math.round(c1.r + (c2.r - c1.r) * localT);
    const g = Math.round(c1.g + (c2.g - c1.g) * localT);
    const b = Math.round(c1.b + (c2.b - c1.b) * localT);

    return (r << 16) | (g << 8) | b;
}

// Spawn square flame particle at ship's rear thruster notch
function spawnFlame() {
    const p = new PIXI.Graphics();
    p.beginFill(0xffffff); // Drawn white so PixiJS tint can smoothly blend colors
    p.drawRect(-4, -4, 8, 8); // Centered 8x8 square particle
    p.endFill();

    // Align spawn to ship's rear engine cutout (~ -18px back)
    const rearOffset = 8;
    const spread = (Math.random() - 0.5) * 6;
    
    p.x = playerSquare.x - Math.cos(playerSquare.rotation) * rearOffset + Math.sin(playerSquare.rotation) * spread;
    p.y = playerSquare.y - Math.sin(playerSquare.rotation) * rearOffset - Math.cos(playerSquare.rotation) * spread;

    // Direct particle momentum backward with subtle variance
    const driftSpeed = 0.5 + Math.random();
    p.vx = -Math.cos(playerSquare.rotation) * driftSpeed + (Math.random() - 0.5) * 0.4;
    p.vy = -Math.sin(playerSquare.rotation) * driftSpeed + (Math.random() - 0.5) * 0.4;

    // Give particle subtle rotational spin as it drifts
    p.rotation = Math.random() * Math.PI * 2;
    p.spin = (Math.random() - 0.5) * 0.1;

    p.life = 0;
    p.maxLife = 180; // 3 seconds at 60 FPS

    particleGroup.addChild(p);
    particles.push(p);
}




// Bullets
const bulletGroup = new PIXI.Container();
app.stage.addChild(bulletGroup);

const bullets = [];
const bulletSpeed = 5;      // px per frame
const fireDelay = 50;         // frames between shots (60 FPS: ~7.5 shots/sec)
const bulletColor = 0x3a94de;
const planetRadius = 150;
let fireTimer = 0;

// Arrow key tracking
const arrows = { arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (arrows.hasOwnProperty(key)) {
        arrows[key] = true;
        e.preventDefault(); // stop the page from scrolling
    }
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (arrows.hasOwnProperty(key)) arrows[key] = false;
});

function spawnBullet(dirX, dirY) {
    const b = new PIXI.Graphics();
    b.beginFill(bulletColor);
    b.drawRect(-3, -3, 6, 6);   // small square
    b.endFill();

    b.x = playerSquare.x;
    b.y = playerSquare.y;
    b.vx = dirX * bulletSpeed;
    b.vy = dirY * bulletSpeed;

    bulletGroup.addChild(b);
    bullets.push(b);
}








// Main App Ticker
app.ticker.add((delta) => {
    // 1. Read directional input from WASD
let inputX = 0;
let inputY = 0;

if (keys.a) inputX -= 1;
if (keys.d) inputX += 1;
if (keys.w) inputY -= 1;
if (keys.s) inputY += 1;

const isMoving = inputX !== 0 || inputY !== 0;

if (isMoving) {
    // 2. Rotate slowly toward the desired heading
    const targetAngle = Math.atan2(inputY, inputX);
    let angleDiff = targetAngle - playerSquare.rotation;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    playerSquare.rotation += angleDiff * turnSpeed * delta;

    // 3. Thrust only along the ship's nose, scaled by how well it's aligned
    //    with where you want to go (no thrust while facing the wrong way)
    const alignment = Math.max(0, Math.cos(angleDiff));
    const thrust = accel * alignment;

    vx += Math.cos(playerSquare.rotation) * thrust * delta;
    vy += Math.sin(playerSquare.rotation) * thrust * delta;

    // Flames only while the engine is actually firing
    if (alignment > 0.1) {
        spawnFlame();
        if (Math.random() > 0.6) spawnFlame();
    }
}

    // 4. Apply friction drag and update position
    vx *= Math.pow(friction, delta);
    vy *= Math.pow(friction, delta);

    playerSquare.x += vx * delta;
    playerSquare.y += vy * delta;

    // Restrain the ship from going off the left and right sides
    playerSquare.x = Math.max(0,playerSquare.x);
    playerSquare.x = Math.min(window.innerWidth,playerSquare.x);

    // Restrain the ship from going off the top and bottom sides
    playerSquare.y = Math.max(0,playerSquare.y);
    playerSquare.y = Math.min(window.innerHeight,playerSquare.y);

    // 5. Update and render active flame particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += delta * 5;

        const progress = Math.min(p.life / p.maxLife, 1.0);

        if (progress >= 1.0) {
            particleGroup.removeChild(p);
            p.destroy();
            particles.splice(i, 1);
            continue;
        }

        // Smooth color transition across lifespan
        p.tint = getFlameColor(progress);

        // Fade alpha & shrink square scale
        p.alpha = 1 - progress;
        p.scale.set(1 - progress * 0.85);

        // Apply drift & rotation
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.rotation += p.spin * delta;
    }

    // 6. Shooting with arrow keys
    let shootX = 0;
    let shootY = 0;
    if (arrows.arrowleft) shootX -= 1;
    if (arrows.arrowright) shootX += 1;
    if (arrows.arrowup) shootY -= 1;
    if (arrows.arrowdown) shootY += 1;

    fireTimer -= delta;
    if ((shootX !== 0 || shootY !== 0) && fireTimer <= 0) {
        const len = Math.hypot(shootX, shootY);   // normalize diagonals
        spawnBullet(shootX / len, shootY / len);
        fireTimer = fireDelay;
    }

    // 7. Move bullets, remove if off screen or inside the planet
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * delta;
        b.y += b.vy * delta;

        const offScreen = b.x < 0 || b.x > app.screen.width ||
                        b.y < 0 || b.y > app.screen.height;
        const hitPlanet = Math.hypot(b.x - planet.x, b.y - planet.y) < planetRadius;

        if (offScreen || hitPlanet) {
            bulletGroup.removeChild(b);
            b.destroy();
            bullets.splice(i, 1);
        }
    }
});