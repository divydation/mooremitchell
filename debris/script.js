const canvas = document.getElementById("gameCanvas");
// const ctx = canvas.getContext("2d");


const app = new PIXI.Application({
    view: canvas,
    resizeTo: window, 
    autoDensity: true,
    // resolution: Math.min(window.devicePixelRatio || 1, 2),
    resolution: 2,
    backgroundColor: 0x141414,
    // antialias: true,
});

app.ticker.maxFPS = 60;

// 2. The Master Container (This replaces ctx.translate(500, 500))
const solarSystem = new PIXI.Container();
app.stage.addChild(solarSystem);

const planetScene = new PIXI.Container();
const systemScene = new PIXI.Container();

solarSystem.addChild(planetScene);
solarSystem.addChild(systemScene);

planetScene.visible = true;
systemScene.visible = false;

function resizeGameWorld() {
    // 1. Get the actual physical pixels of the screen right now
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    // 2. Your original internal dimension
    const gameSize = 1000;
    
    let scale;

    if (screenWidth > screenHeight) {
        // --- DESKTOP (Landscape) ---
        // The screen is wider than it is tall. We are limited by height.
        scale = screenHeight / gameSize;
        
        solarSystem.scale.set(scale);
        solarSystem.x = 0; // Pin to left edge
        solarSystem.y = 0; // Pin to top edge
        
    } else {
        // --- MOBILE (Portrait) ---
        // The screen is taller than it is wide. We are limited by width.
        scale = screenWidth / gameSize;
        
        solarSystem.scale.set(scale);
        solarSystem.x = 0; // Pin perfectly to the left edge
        solarSystem.y = 0; // Pin perfectly to the top edge
    }
}

// Run it once immediately to set the initial size
resizeGameWorld();

// Tell PixiJS to run this function every time it detects a window resize
app.renderer.on('resize', resizeGameWorld);


document.body.classList.add("stop-scrolling");

let probeText = null;
let style;
document.fonts.load('10px "Silkscreen"').then(() => {
    
    // 1. Configure the Style
    style = new PIXI.TextStyle({
        fontFamily: 'Silkscreen', // Must match the name from Google Fonts exactly
        fontSize: 30,
        fontWeight: '400',
        fill: '#ffffff', 
        // align: 'center'
    });

    // 2. Create the Text (v7 Syntax: Text string first, style object second)
    probeText = new PIXI.Text('Hello Silkscreen!', style);

    probeText.anchor.set(0, 0.6);

    systemScene.addChild(probeText);

}).catch((err) => {
    console.error("Google Font failed to load: ", err);
});




// Update Notification

const userHasSeenUpdate = localStorage.getItem("updateVerified");
// console.log(userHasSeenUpdate);

if (userHasSeenUpdate == "2.1.3") {
    document.getElementById("changelog").style.display = "none";
} else {
    document.getElementById("changelog").style.display = "flex";
}

// Play button
document.getElementById("playButton").addEventListener('pointerdown', (event) => {
    setTimeout(() => {
        document.getElementById("changelog").style.display = "none";
        localStorage.setItem("updateVerified", "2.1.3");
    }, 200);
});






let flightRadius = 200;
let targetRadius = flightRadius;
let targetBoost = 0;
let boostAmount = 0;
let shipWidth = 25;
let shipHeight = 25;

let shipRotation = 0;
let shipRotationSpeed = 0.01;
shipRotationSpeed = changeShipSpeed(flightRadius);


let energy = 0;
let material = 10;
let crystal = 0;

offset = 0;
maxOffset = 10;

let shipX;
let shipY;
let shipPosition = {
    x: shipX,
    y: shipY
};



// Particles
let fire = [];


// Stats
let materialsCollectedRecently = 0;
let materialsCollectedTimer = 0;

let smoothedMaterialsPerSecond = 0;
let smoothedRatePerDrill = 0;

let maxPerDrill = 0;



view = "planet";



// COSTS
drillCostMaterial = 5;
satelliteCostMaterial = 25;
collectorCostMaterial = 50;
laserSatelliteCostMaterial = 50;
refineryCostMaterial = 250;
smartCollectorCostMaterial = 100000;

const baseCosts = {
    drillCostMaterial: 5,
    satelliteCostMaterial: 25,
    collectorCostMaterial: 50,
    laserSatelliteCostMaterial: 100,
    refinerCostMaterial: 5000,
};

const MAX_MATERIALS = 20000;

const getBaseDevices = () => ({
    drills: [],
    materialsToCollect: [],
    satellites: [],
    collectors: [],
    crystals: [],
    comets: [],
    laserSatellites: [],
    refiners: []
});

drillRateUpgradeCost = 10;
collectionRadiusUpgradeCost = 10;
boostSpeedUpgradeCost = 10;
materialValueUpgradeCost = 10;


// UPGRADES
drillProductionRate = 5000;
drillLevel = 1;
collectionRadius = 50;
collectionRadiusLevel = 1;

boostSpeedAdd = 5;
boostSpeedLevel = 1;

materialValue = 1.005;
materialValueLevel = 1;




// Timing control
let lastTime = Date.now();
const TARGET_FPS = 60;
const MS_PER_FRAME = 1000 / TARGET_FPS; // ~16.66ms
setInterval(saveGame, 2000);

updating = true;


let planets = [];

planets.push({
    name: "bluePlanet",
    radius: 70,
    orbitRadius: 75,
    orbitSpeed: 0.006,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.01,
    currentRotation: 0,
    hasShip: false,
    selected: false,
    color: "#2375ef",
    description: "Closer to the sun - great for solar power.",
    unlocked: false,
    neededProbes: 15,
    landedProbes: 0,
    solarFactor: 2,
    cometFactor: 0.3,
    gravityFactor: 0.05,
    ...getBaseDevices(),
    ...baseCosts
});

planets.push({
    name: "redPlanet",
    radius: 100,
    orbitRadius: 115,
    orbitSpeed: 0.0015,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.002,
    currentRotation: 0,
    hasShip: true,
    selected: false,
    color: "#EF233C",
    description: "Home",
    unlocked: true,
    neededProbes: 0,
    landedProbes: 0,
    solarFactor: 1,
    cometFactor: 1,
    gravityFactor: 0.1,
    ...getBaseDevices(),
    ...baseCosts,
});

planets.push({
    name: "orangePlanet",
    radius: 150,
    orbitRadius: 170,
    orbitSpeed: 0.0003,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.003,
    currentRotation: 0,
    hasShip: false,
    selected: true,
    color: "#ef6a23",
    description: "The large mass attracts more comets.",
    unlocked: false,
    neededProbes: 10,
    landedProbes: 0,
    solarFactor: 0.9,
    cometFactor: 3,
    gravityFactor: 0.2,
    ...getBaseDevices(),
    ...baseCosts
});

planets.push({
    name: "purplePlanet",
    radius: 75,
    orbitRadius: 220,
    orbitSpeed: -0.001,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.006,
    currentRotation: 0,
    hasShip: false,
    selected: false,
    color: "#9b5de5",
    description: "So pretty... is it made of Crystal?",
    unlocked: false,
    neededProbes: 7,
    landedProbes: 0,
    solarFactor: 0.7,
    cometFactor: 0.4,
    gravityFactor: 0.1,
    ...getBaseDevices(),
    ...baseCosts
});

planets.push({
    name: "greenPlanet",
    radius: 110,
    orbitRadius: 265,
    orbitSpeed: 0.0001,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.006,
    currentRotation: 0,
    hasShip: false,
    selected: false,
    color: "#29BF12",
    description: "Little light means no power... what could be found here?",
    unlocked: false,
    neededProbes: 25,
    landedProbes: 0,
    solarFactor: 0,
    cometFactor: 2,
    gravityFactor: 0.3,
    ...getBaseDevices(),
    ...baseCosts
});

let currentPlanet = planets[1];









// -----------------
// PIXIJS
// -----------------
const planetGraphic = new PIXI.Graphics();


const shadowGraphic = new PIXI.Graphics();
shadowGraphic.position.set(500, 500);


function drawPlanetAndShadow() {
    shadowGraphic.clear();
    shadowGraphic.beginFill(0x000000, 0.8);
    shadowGraphic.drawRect(0, -currentPlanet.radius, 2000, 2 * currentPlanet.radius);
    shadowGraphic.endFill();

    planetGraphic.clear();
    hexColor = parseInt(currentPlanet.color.replace(/^#/, ''), 16);
    planetGraphic.beginFill(hexColor);
    planetGraphic.drawCircle(500, 500, currentPlanet.radius);
    planetGraphic.endFill();
}



const shipGraphic = new PIXI.Graphics();
shipGraphic.beginFill(0xffffff);
shipGraphic.drawRect(-12.5,-12.5, 25, 25)
shipGraphic.endFill();

shipColours = [0xffffff, 0xffbe0b, 0xfb5607, 0xff006e, 0x8338ec, 0x3a86ff];
currentShipColourIndex = 0;
shipGraphic.tint = shipColours[currentShipColourIndex];

const shipShadowGraphic = new PIXI.Graphics();
shipShadowGraphic.clear();
shipShadowGraphic.beginFill(0x000000, 0.8);
shipShadowGraphic.drawRect(0, -12.5, 2000, 25);
shipShadowGraphic.endFill();

const powerLineGraphic = new PIXI.Graphics();

// Add them to the system in the order you want them layered (bottom to top)
planetScene.addChild(shipShadowGraphic);
planetScene.addChild(shadowGraphic);



// Comet Graphics Sprite
const baseCometGraphic = new PIXI.Graphics();
baseCometGraphic.beginFill(0x646464);
baseCometGraphic.drawRect(-8, -8, 16, 16);
baseCometGraphic.endFill();
const cometTexture = app.renderer.generateTexture(baseCometGraphic);



// Material Graphics

const materialContainer = new PIXI.Container();
planetScene.addChild(materialContainer);

// Planet ABOVE materials
planetScene.addChild(planetGraphic);

// 1. Draw a master material square ONCE and turn it into a texture
const baseMaterialGraphic = new PIXI.Graphics();
baseMaterialGraphic.beginFill(0xFFFFFF);
baseMaterialGraphic.drawRect(-4, -4, 8, 8); 
baseMaterialGraphic.endFill();
baseMaterialGraphic.tint = 0x2EBFA5;
const materialTexture = app.renderer.generateTexture(baseMaterialGraphic);


const bigMaterialGraphic = new PIXI.Graphics();
bigMaterialGraphic.beginFill(0xFFFFFF);
bigMaterialGraphic.drawRect(-4, -4, 8, 8); 
bigMaterialGraphic.endFill();
bigMaterialGraphic.tint = 0xff006e;
const bigMaterialTexture = app.renderer.generateTexture(bigMaterialGraphic);

// Power above materials
planetScene.addChild(powerLineGraphic);



// Fire Graphics

// 1. Create a white square texture for the fire
const fireBaseGraphic = new PIXI.Graphics();
fireBaseGraphic.beginFill(0xFFFFFF);
fireBaseGraphic.drawRect(-5, -5, 10, 10);
fireBaseGraphic.endFill();
const fireTexture = app.renderer.generateTexture(fireBaseGraphic);

// 2. Create the Particle Container
const fireContainer = new PIXI.ParticleContainer(500, {
    scale: true,   // Enabled because fire shrinks
    position: true,
    rotation: true,
    alpha: true,
    tint: true     // Enabled to colorize the white texture
});
planetScene.addChild(fireContainer); // Make sure it's added below the shadow/planet!

// 3. The Object Pool: Pre-allocate 500 sprites
const MAX_FIRE = 500;
const fireSprites = [];

for (let i = 0; i < MAX_FIRE; i++) {
    let sprite = new PIXI.Sprite(fireTexture);
    sprite.anchor.set(0.5);
    // sprite.visible = false;
    sprite.alpha = 0;
    sprite.life = 0; // We will use this custom property to track if it's dead or alive
    
    fireSprites.push(sprite);
    fireContainer.addChild(sprite);
}

// 4. A fast array of Hex colors (Red to Yellow) to replace the HSL math
const fireColors = [0xFF0000, 0xFF4500, 0xFF8C00, 0xFFA500, 0xFFD700];


alienShips = [];

const alienShipsContainer = new PIXI.Container();
alienShipsContainer.position.set(500, 500);

const alienShipTextContainer = new PIXI.Container();


const alienShipGraphicOne = new PIXI.Graphics();
alienShipGraphicOne.beginFill(0x29BF12);
alienShipGraphicOne.drawRect(-12.5,-12.5, 25, 25)
alienShipGraphicOne.endFill();

planetScene.addChild(alienShipsContainer);
planetScene.addChild(alienShipTextContainer);
alienShipsContainer.addChild(alienShipGraphicOne);

let alienShipOneText;
document.fonts.load('20px "Silkscreen"').then(() => {
    
    // 1. Define your base style
    const baseStyle = new PIXI.TextStyle({
        fontFamily: 'Silkscreen',
        fontSize: 30,
        fontWeight: '400',
        fill: '#FFFFFF',
        align: 'center'
    });

    // 2. Clone the base style for each unique text
    alienShipOneText = new PIXI.Text('1000', baseStyle.clone());
    alienShipOneText.anchor.set(0.5, 0.55);
    alienShipOneText.style.fill = '#F5D752'; // This now only affects the clone!
    alienShipTextContainer.addChild(alienShipOneText);

    alienShipOneTextItem = new PIXI.Text('UPGRADE', baseStyle.clone());
    alienShipOneTextItem.anchor.set(0.5, 0.55);
    alienShipOneTextItem.style.fill = '#FFFFFF';
    alienShipTextContainer.addChild(alienShipOneTextItem);

}).catch((err) => {
    console.error("Google Font failed to load: ", err);
});

alienShips.push({
    x: 0,
    y: 0,
    orbitRadius: 265,
    orbitSpeed: 43051*(265**(-2.843)),
    orbitAngle: 0,
    energyLeft: 50,
    status: "waiting",
    graphic: alienShipGraphicOne,
});


const alienItems = [
    {
        itemText: "5M",
        itemCost: 1500,
        textColour: "#2EBFA5",
        resourceType: "material",
        reward: 5000000,
    },
    {
        itemText: "40",
        itemCost: 1000,
        textColour: "#d338f2",
        resourceType: "crystal",
        reward: 30,
    }
];

function getRandomItem() {
    const randomIndex = Math.floor(Math.random() * alienItems.length);
    return alienItems[randomIndex];
}

for (let i = 0; i < alienShips.length; i++) {
    let alienShip = alienShips[i];

    alienShip.item = getRandomItem();
    alienShip.energyLeft = alienShip.item.itemCost;
}


planetScene.addChild(shipGraphic);


// ----------------------
// SOLAR SYSTEM
// ---------------------

const sunGraphic = new PIXI.Graphics();
sunGraphic.position.set(500,500);
sunGraphic.beginFill(0xFFE347);
sunGraphic.drawCircle(0, 0, 100); // scaled down for map
sunGraphic.endFill();
systemScene.addChild(sunGraphic);

const systemShipPivot = new PIXI.Container();
systemScene.addChild(systemShipPivot);

const systemShipGraphic = new PIXI.Graphics();
systemShipGraphic.beginFill(0xFFFFFF);
systemShipGraphic.drawRect(-4, -4, 8, 8);
systemShipGraphic.endFill();
systemShipPivot.addChild(systemShipGraphic);

let probeParticles = [];
const probeParticleLayer = new PIXI.Container();
systemScene.addChild(probeParticleLayer);

let probes = [];

const probeLayer = new PIXI.Container();
systemScene.addChild(probeLayer);

planets.forEach(p => {

    let scaledRadius = p.radius * 0.2;
    p.orbitRadius = 50 + p.orbitRadius*1.5

    // The Pivot
    p.pivot = new PIXI.Container();

    p.pivot.position.set(500,500);

    // Planet Graphic
    p.graphics = new PIXI.Graphics();

    let hexColor = parseInt(p.color.replace(/^#/, ''), 16);
    p.graphics.beginFill(hexColor);
    p.graphics.drawCircle(0, 0, scaledRadius); // scaled down for map
    p.graphics.endFill();

    p.graphics.x = p.orbitRadius;

    // The Planet's Shadow
    p.shadowGraphic = new PIXI.Graphics();

    p.shadowGraphic.beginFill(0x000000, 0.8);
    p.shadowGraphic.drawRect(0, -scaledRadius, 4000, 2 * scaledRadius);
    p.shadowGraphic.endFill();
    p.shadowGraphic.x = p.orbitRadius;

    // Add to Scene
    systemScene.addChild(p.pivot);
    p.pivot.addChild(p.shadowGraphic);

    p.pivot.addChild(p.graphics);

    if (p.hasShip) currentPlanet = p;
});



let lastEnergy = -1;
let lastMaterial = -1;
let lastCrystal = -1;

let frameCounter = 0;

//
//
// THIS IS THE APP
//
//

app.ticker.add((delta) => {
    frameCounter++;
    frameCounter = frameCounter % 60;

    let planet = null;
    powerLineGraphic.clear();

    // document.getElementById("energyText").textContent = formatNumber(energy);
    // document.getElementById("materialText").textContent = formatNumber(material);
    // document.getElementById("crystalText").textContent = formatNumber(crystal);

    if (energy !== lastEnergy) {
        document.getElementById("energyText").textContent = formatNumber(energy);
        lastEnergy = energy;
    }
    if (material !== lastMaterial) {
        document.getElementById("materialText").textContent = formatNumber(material);
        lastMaterial = material;
    }
    if (crystal !== lastCrystal) {
        document.getElementById("crystalText").textContent = formatNumber(crystal);
        lastCrystal = crystal;
    }

    materialsCollectedTimer++;

    // Use >= just in case a frame skip pushes the timer past exactly 60
    if (materialsCollectedTimer >= 60) {
        materialsCollectedTimer = 0;

        // 1. Calculate Drills
        let numberOfDrills = 0;
        for (let i = 0; i < planets.length; i++) {
            numberOfDrills += planets[i].drills.length;
        }

        // 2. Calculate the raw rates for THIS specific second
        let rawMaterialsPerSecond = materialsCollectedRecently;
        
        // Safety check: Prevent dividing by zero if the player has 0 drills!
        let rawRatePerDrill = numberOfDrills > 0 ? (rawMaterialsPerSecond / numberOfDrills) : 0;

        if (rawRatePerDrill > maxPerDrill) {
            maxPerDrill = rawRatePerDrill;
        }

        // 3. Apply the "Shock Absorber" (Exponential Moving Average)
        // Here, 0.2 is our alpha. We keep 80% of the old average and blend in 20% of the new data.
        smoothedMaterialsPerSecond = (smoothedMaterialsPerSecond * 0.8) + (rawMaterialsPerSecond * 0.2);
        smoothedRatePerDrill = (smoothedRatePerDrill * 0.8) + (rawRatePerDrill * 0.2);

        // 4. Update the UI using the SMOOTHED values
        document.getElementById("efficiency").innerHTML = `${formatNumber(smoothedMaterialsPerSecond)}`;
        document.getElementById("stats").innerHTML = `${formatNumber(smoothedRatePerDrill)}`;
        document.getElementById("maxPerDrill").innerHTML = `${formatNumber(maxPerDrill)}`;

        // 5. Empty the bucket for the next second
        materialsCollectedRecently = 0;
    }

    // Timing control
    // let now = Date.now();
    // let dt = now - lastTime;
    // lastTime = now;

    let dt = app.ticker.elapsedMS;

    if (dt > 100) dt = 16.66; // MS_PER_FRAME


    shipX = 500 + (flightRadius + 12.5) * Math.cos(shipRotation);
    shipY = 500 + (flightRadius + 12.5) * Math.sin(shipRotation);

    shipPosition = {
        x: shipX,
        y: shipY
    };

    if (riseButtonHeld) {
        targetRadius += 2;
        playRiserSweep(flightRadius);
    }

    if (dropButtonHeld) {
        targetRadius -= 2;
        playRiserSweep(flightRadius);
    }

    if (boostButtonHeld && targetBoost < boostSpeedAdd) {
        targetBoost += 1;
    }

    if (!boostButtonHeld && targetBoost > 0) {
        targetBoost -= 1;
    }

    targetRadius = Math.round(targetRadius * 100) / 100;

    boostAmount += (targetBoost - boostAmount) * 0.05;

    shipRotation += boostAmount/1000;

    if (riseButtonHeld || dropButtonHeld || boostButtonHeld) {
        // Fire 2 particles per frame for a dense exhaust plume
        spawnFireParticle(flightRadius, shipRotation);
        // spawnFireParticle(flightRadius, shipRotation);
    }


    // --- SYSTEM SCENE PANNING LOGIC ---
    let targetCamX = 0;
    let targetCamY = 0;

    let planetWorldX;
    let planetWorldY;

    let selectedPlanet = planets.find(p => p.selected);
    currentPlanet = planets.find(p => p.hasShip);

    // Only move the camera if we are actually looking at the system scene
    if (selectedPlanet && systemScene.visible) {
        // 1. Calculate the exact local (x,y) of the orbiting planet
        planetWorldX = 500 + Math.cos(selectedPlanet.currentOrbitRotation) * selectedPlanet.orbitRadius;
        planetWorldY = 500 + Math.sin(selectedPlanet.currentOrbitRotation) * selectedPlanet.orbitRadius;
        
        // 2. Shift the entire system scene in the opposite direction
        targetCamX = 500 - planetWorldX;
        targetCamY = 500 - planetWorldY;

        // Also display description
        updateHelp(selectedPlanet.description);
    } else {
        // Default: center on the Sun (0 offset)
        targetCamX = 0;
        targetCamY = 0;
    }

    // 3. Smoothly interpolate the scene container towards the target offset
    systemScene.x += (targetCamX - systemScene.x) * 0.1;
    systemScene.y += (targetCamY - systemScene.y) * 0.1;

    systemShipGraphic.x = currentPlanet.radius*0.2 + 2.5 + flightRadius/30;
    systemShipPivot.rotation = shipRotation - currentPlanet.currentOrbitRotation;


    if (selectedPlanet != null && !selectedPlanet.unlocked) {
        document.getElementById("travelButton").style.display = "none";
        document.getElementById("unlockButton").style.display = "flex";
        // document.getElementById("unlockPlanetCost").innerHTML = selectedPlanet.cost;
    }

    if (selectedPlanet != null && selectedPlanet.unlocked) {
        document.getElementById("travelButton").style.display = "flex";
        document.getElementById("unlockButton").style.display = "none";
    }

    if (selectedPlanet && probeText) {
        probeText.position.set(planetWorldX + 10 + selectedPlanet.radius*0.2, planetWorldY);
        probesLeft = selectedPlanet.neededProbes - selectedPlanet.landedProbes
        if (probesLeft > 0) probeText.text = probesLeft + " LEFT";
        if (probesLeft <= 0) probeText.text = "";
    }

    



    // Traverse the Planets

    for (let i = 0; i < planets.length; i++) {
        let p = planets[i]

        // Rotate and orbit this planet
        p.currentRotation += p.rotationSpeed;
        p.currentOrbitRotation += p.orbitSpeed;
        p.currentRotation = p.currentRotation % toRadians(360);

        // Update the Graphic to Rotate the Planet
        p.pivot.rotation = p.currentOrbitRotation;

        // Unlock if needed
        if (p.landedProbes == p.neededProbes) {
            p.unlocked = true;
        }

        // Set current updates to this planet
        planet = p;

        randomNumber = Math.floor(Math.random() * 2000 / p.cometFactor);
        if (randomNumber == 1) {
            spawnComet(planet);
            // console.log("Spawned a comet on planet " + planet.name)
        }

        // Is this planet going to be drawn or just calculated?
        drawThisPlanet = false;

        if (p.hasShip) {
            drawThisPlanet = true;

             // Contain ship radius
            if (targetRadius < (planet.radius + 15)) targetRadius = (planet.radius + 15);
            if (targetRadius > 450) targetRadius = 450;
            flightRadius += (targetRadius - flightRadius) * 0.05; // Otherwise, keep lerping
            flightRadius = Math.round(flightRadius * 100) / 100;
            shipRotationSpeed = changeShipSpeed(flightRadius);

            // Rotate ship
            shipRotation += shipRotationSpeed;
            shipRotation = shipRotation % toRadians(360);
        }

        if (drawThisPlanet) {
            // Planet Shadow
            shadowGraphic.rotation = planet.currentOrbitRotation;

            // Ship Shadow
            shipShadowGraphic.position.set(shipPosition.x, shipPosition.y);
            shipShadowGraphic.rotation = planet.currentOrbitRotation;
        }

        // Draw Materials

        let planetCollectionRadius = collectionRadius;
        // The purple planet doubles the collection radius level
        if (planet.name == "purplePlanet") planetCollectionRadius = 50 * (1.1**(collectionRadiusLevel*3));

        // console.log("The normal collection is " + collectionRadius + ", the current is " + planetCollectionRadius);

        // Write coordinates once
        for (let r = 0; r < planet.refiners.length; r++) {
            polarToCartesianWrite(planet.refiners[r].radius, planet.refiners[r].angle, planet.refiners[r]);
        }

        for (let c = 0; c < planet.collectors.length; c++) {
            polarToCartesianWrite(planet.collectors[c].radius, planet.collectors[c].angle, planet.collectors[c]);
        }

        // Materials
        for (let m = 0; m < planet.materialsToCollect.length; m++) {

            let mat = planet.materialsToCollect[m];
            
            // 1. Basic Background Math (Always runs)
            mat.radius += mat.radiusChange;
            mat.value *= materialValue;
            mat.value = Math.min(mat.value, 20000); 

            let mRadius = mat.radius;
            let mAngle = mat.angle;
            
            // Update Cartesian coordinates for collisions.
            // Active planets update every frame for smooth ship collection.
            // Background planets update ONLY when their math tick runs (every 10th frame).
            if (drawThisPlanet || (!drawThisPlanet && frameCounter % 10 === i % 10)) {
                polarToCartesianWrite(mRadius, mAngle, mat);
            }
           


            // -----------------------------------------
            // 2. SHIP LOGIC (ONLY runs on active planet)
            // -----------------------------------------
            if (drawThisPlanet) {
                let distanceSq = calculateDistance(mat, shipPosition);

                // Ship Instant Collect
                if (distanceSq <= 225) {
                    material += Math.floor(mat.value);
                    materialsCollectedRecently += Math.floor(mat.value);
                    deleteMaterial(planet, m); 
                    m--; 
                    continue; 
                } 

                // Ship Tractor Beam Pull
                if (distanceSq <= planetCollectionRadius**2) {
                    mat.timeInTractorBeam += 0.05;
                    let beamTime = Math.min(mat.timeInTractorBeam, 1);
                    
                    mat.radius += (flightRadius + 7.5 - mat.radius) * beamTime;

                    let angleDiff = Math.atan2(Math.sin(shipRotation - mat.angle), Math.cos(shipRotation - mat.angle));
                    mat.angle += (angleDiff * beamTime) + toRadians(0.5);
                } 
            }

            if (!drawThisPlanet) {
                mat.graphic.visible = false;
            } else {
                mat.graphic.visible = true;
            }

            // Heavy math logic for background planets only runs every 10th frame
            if (!drawThisPlanet && frameCounter % 10 !== i % 10) {
                continue; // Skip this frame's calculations for this background planet
            }

            

            // -----------------------------------------
            // 3. COLLECTOR LOGIC (Runs for ALL planets)
            // -----------------------------------------
            let materialCollected = false;
            for (let c = 0; c < planet.collectors.length; c++) {

                let collector = planet.collectors[c];

                if (collector.battery < 0.5) continue;

            
                
                // polarToCartesianWrite(collector.radius, collector.angle, collector);

                let dx = Math.abs(mat.x - collector.x);
                let dy = Math.abs(mat.y - collector.y);

                // Only do the expensive circle math if it's within a broad square area
                if (dx < 300 && dy < 300) { 
                    let distanceSq = (dx * dx) + (dy * dy); 

                    // Instant Collection (ALWAYS runs, even in background)
                    if (distanceSq <= 225) {
                        material += Math.floor(mat.value);
                        materialsCollectedRecently += Math.floor(mat.value);
                        deleteMaterial(planet, m); 
                        m--; 
                        materialCollected = true;
                        break; 
                    }

                    // Instant Collection (ONLY runs in background planets)
                    if (!drawThisPlanet && distanceSq <= planetCollectionRadius**2) {
                        material += Math.floor(mat.value);
                        materialsCollectedRecently += Math.floor(mat.value);
                        deleteMaterial(planet, m); 
                        m--; 
                        materialCollected = true;
                        break; 
                    }

                    // Tractor Beam Pull (ONLY runs on active planet!)
                    if (drawThisPlanet && distanceSq <= planetCollectionRadius**2) {
                        mat.timeInTractorBeam += 0.05;
                        let beamTime = Math.min(mat.timeInTractorBeam, 1);
                        
                        mat.radius += (collector.radius + 7.5 - mat.radius) * beamTime;

                        let angleDiff = Math.atan2(Math.sin(collector.angle - mat.angle), Math.cos(collector.angle - mat.angle));
                        mat.angle += (angleDiff * beamTime) + toRadians(0.5);
                    }
                }
            }

            // Refiner Interaction
            if (!mat.refined) {
                for (let c = 0; c < planet.refiners.length; c++) {


                    let refiner = planet.refiners[c];

                    if (refiner.battery < 0.5) continue;
                    
                    // polarToCartesianWrite(refiner.radius, refiner.angle, refiner);

                    let dx = Math.abs(mat.x - refiner.x);
                    let dy = Math.abs(mat.y - refiner.y);

                    if (dx > 300 && dy > 300) continue;

                    let distanceSq = (dx * dx) + (dy * dy); 

                    // Instant Collection (ALWAYS runs, even in background)
                    if (distanceSq <= 225) {
                        // if (refiner.animationScale > -1) continue;
                        refiner.mineralsStored += Math.floor(mat.value);
                        deleteMaterial(planet, m); 
                        m--; 
                        materialCollected = true;
                        break; 
                    }

                    // Instant Collection (ONLY runs in background planets)
                    if (!drawThisPlanet && distanceSq <= planetCollectionRadius**2) {
                        // if (refiner.animationScale > -1) continue;
                        refiner.mineralsStored += Math.floor(mat.value);
                        deleteMaterial(planet, m); 
                        m--; 
                        materialCollected = true;
                        break; 
                    }

                    // Tractor Beam Pull (ONLY runs on active planet!)
                    if (drawThisPlanet && distanceSq <= planetCollectionRadius**2) {
                        // if (refiner.animationScale > -1) continue;
                        mat.timeInTractorBeam += 0.05;
                        let beamTime = Math.min(mat.timeInTractorBeam, 1);
                        
                        mat.radius += (refiner.radius + 7.5 - mat.radius) * beamTime;

                        let angleDiff = Math.atan2(Math.sin(refiner.angle - mat.angle), Math.cos(refiner.angle - mat.angle));
                        mat.angle += (angleDiff * beamTime) + toRadians(0.5);
                    }

                    // Start the refine at 100 material value
                    if (refiner.mineralsStored > refiner.radius && refiner.animationScale == -1) refiner.animationScale = 1;
                }
            }
            
            
            if (materialCollected) continue;

            // -----------------------------------------
            // 4. CLEANUP & PIXIJS RENDERING
            // -----------------------------------------
            if (mat.radius > 600 || mat.radius < (planet.radius - 30)) {
                mat.alpha -= 0.1;
            }

            if (mat.alpha < 0) {
                deleteMaterial(planet, m);
                m--;
                continue;
            }

            // --- THIS IS THE NEW DRAWING LINK! ---
            if (drawThisPlanet) {
                // mat.graphic.visible = true;
                
                if (mat.refined) {
                    mat.rotation += 0.05;
                    mat.graphic.scale.set(1.5);
                }

                // Directly pass the math to the visual object
                mat.graphic.alpha = mat.alpha; 
                mat.graphic.position.set(mat.x, mat.y);
                mat.graphic.rotation = mat.angle + mat.rotation;
                
            
            }
        }

        // Crystals
        for (let i = 0; i < planet.crystals.length; i++) {
            let c = planet.crystals[i];

            if (!c) continue;

            crystalPosition = polarToCartesian(c.radius, c.angle);

            // Don't need to calculate crystals if ship isn't on this planet
            if (drawThisPlanet) {
                distance = calculateDistance(crystalPosition, shipPosition);

                if (distance <= 15**2) {
                    if (c.graphic) {
                        c.graphic.destroy(); 
                    }
                    planet.crystals.splice(i, 1);
                    i--;
                    crystal += Math.floor(c.crystalAmount);
                    continue;
                } 

                // 4. Check if distance is 10 or less
                if (distance <= planetCollectionRadius**2) {
                    
                    c.timeInTractorBeam += 0.05;

                    // start moving towards ship
                    c.radius += (flightRadius + 7.5 - c.radius) * Math.min(c.timeInTractorBeam, 1);

                    // Magically wraps the difference between -PI and PI
                    let angleDiff = Math.atan2(Math.sin(shipRotation - c.angle), Math.cos(shipRotation - c.angle));
                    
                    c.angle += (angleDiff * Math.min(c.timeInTractorBeam, 1)) + toRadians(0.5);
                }
            }

            // Draw crystals
            if (drawThisPlanet) {
                c.graphic.visible = true;

                c.graphic.rotation += c.rotationSpeed;
                newCrystalPosition = polarToCartesian(c.radius, c.angle);
                c.graphic.position.set(newCrystalPosition.x, newCrystalPosition.y)
                
            } else {
                c.graphic.visible = false;
            }
        }



        // Power Lines

        const MAX_DISTANCE_SQ = 100 ** 2; // Maximum range (10,000)

        for (let i = 0; i < planet.satellites.length; i++) {
            let p = planet.satellites[i];

            // powerLineGraphic.alpha = Math.random();

            if (planet.solarFactor == 0) break;

            // 1. Get the satellite's current position
            const satPos = polarToCartesian(p.radius, p.angle);

            let closestDistance = Infinity;
            let targetPos = null;
            let targetType = null; // Will be 'ship' or 'collector'
            let closestCollector = null;

            // 2. Check distance to the ship (only on current planet)
            if (drawThisPlanet) {
                let shipDistance = calculateDistance(satPos, shipPosition);
                if (shipDistance < closestDistance) {
                    closestDistance = shipDistance;
                    targetType = 'ship';
                    targetPos = { x: shipX, y: shipY }; 
                }
            }

            // Heavy math logic for background planets only runs every 5th frame
            if (!drawThisPlanet && frameCounter % 5 !== i % 5) {
                continue; // Skip this frame's calculations for this background planet
            }

            // 3. Check distance to all collectors
            for (let j = 0; j < planet.collectors.length; j++) {
                let c = planet.collectors[j];
                let collectorPos = polarToCartesian(c.radius, c.angle);
                let collectorDistance = calculateDistance(satPos, collectorPos);

                // If this collector is closer than anything we've checked so far
                if (collectorDistance < closestDistance) {
                    closestDistance = collectorDistance;
                    targetType = 'collector';
                    targetPos = collectorPos;
                    closestCollector = c; // Save the reference so we can update its battery later
                }
            }

            // 3. Check distance to all refiners
            for (let j = 0; j < planet.refiners.length; j++) {
                let c = planet.refiners[j];
                let refinerPos = polarToCartesian(c.radius, c.angle);
                let refinerDistance = calculateDistance(satPos, refinerPos);

                // If this collector is closer than anything we've checked so far
                if (refinerDistance < closestDistance) {
                    closestDistance = refinerDistance;
                    targetType = 'collector';
                    targetPos = refinerPos;
                    closestCollector = c; // Save the reference so we can update its battery later
                }
            }

            // 4. If the absolute closest target is within range, draw line and transfer power
            if (closestDistance <= MAX_DISTANCE_SQ && targetPos !== null) {
                
                // Draw the power line to the winning target
                if (drawThisPlanet) {
                    let randomWidth = Math.random() * 5;
                    powerLineGraphic.lineStyle(randomWidth, 0xF5D752, 1);

                    // powerLineGraphic.lineStyle(3, 0xF5D752, 1);
                    powerLineGraphic.moveTo(satPos.x, satPos.y);
                    powerLineGraphic.lineTo(targetPos.x, targetPos.y);
                }

                // Transfer power to the winning target
                if (p.powerStored > 0) {
                    p.powerStored -= 0.1;
                    
                    if (targetType === 'ship') {
                        energy += 0.1;
                    } else if (targetType === 'collector') {
                        closestCollector.battery += 0.1;
                    }
                }
            }
        }







        // Drills
        for (let i = 0; i < planet.drills.length; i++) {
            let p = planet.drills[i];


            if (p.radius > planet.radius && !p.arrived) {
                p.radius -= (planet.gravityFactor * 2 * (300 / p.radius) ** 2);
                p.radius = Math.max(p.radius, planet.radius);
                p.angle = p.angle % toRadians(360);
            } else {
                p.arrived = true;
                p.angle = p.angle + planet.rotationSpeed;
                p.angle = p.angle % toRadians(360);
                p.productionTimer += dt;

                planetDrillRate = drillProductionRate;
                if (planet.name == "purplePlanet") {
                    planetDrillRate = 5000 / (1.25**(drillLevel*1.5));
                    // console.log("The normal drill rate is " + drillProductionRate + ", the current is " + planetDrillRate);
                }

                let targetSpawnTime = Math.max(75, planetDrillRate + p.randomTimeOffset);

                

                if (p.productionTimer >= targetSpawnTime) { 
                // if (true) { 
                    p.productionTimer = 0; // Reset the timer

                    const newMaterialGraphic = new PIXI.Sprite(materialTexture);
                    newMaterialGraphic.anchor.set(0.5);
                    drillPos = polarToCartesian(p.radius + 6, p.angle);
                    newMaterialGraphic.position.set(drillPos.x, drillPos.y);
                    newMaterialGraphic.visible = drawThisPlanet; // Hide if spawning on another planet
                    materialContainer.addChild(newMaterialGraphic);

                    planet.materialsToCollect.push({
                        radius: p.radius+6,
                        angle: p.angle,
                        rotation: 0,
                        radiusChange: 0.6 - planet.gravityFactor,
                        angleChange: 0,
                        alpha: 1,
                        timeInTractorBeam: 0,
                        value: 1,
                        refined: false,
                        x: drillPos.x,
                        y: drillPos.y,

                        graphic: newMaterialGraphic
                    });
                }
            }

            // Draw drills
            if (drawThisPlanet) {
                p.pivot.visible = true;
                
                // Rotate the pivot from the center
                p.pivot.rotation = p.angle; 
                
                // Push the graphic out from the center to match the radius
                p.graphic.x = p.radius; 
            } else {
                p.pivot.visible = false;
            }
        }


        // Solar Satellites
        for (let i = 0; i < planet.satellites.length; i++) {
            let p = planet.satellites[i];

            // 1. Always update your core math variable first (so background logic works!)
            p.angle += p.rotationSpeed; 
            p.angle = p.angle % toRadians(360);

            p.productionTimer += dt;

            if (p.productionTimer >= 300) { 
                p.powerStored += 0.1 * planet.solarFactor;
                p.productionTimer = 0;
            }

            p.powerStored = Math.min(p.powerStored, 500);

            // Draw Satellites
            if (drawThisPlanet) {
                p.pivot.visible = true;
                
                // 2. Sync the pivot to the math
                p.pivot.rotation = p.angle; 
                
                // 3. Push the graphic out from the center to match the radius
                p.graphic.x = p.radius; 
                
                // 4. THE FIX: Target Rotation MINUS Parent Rotation
                p.graphic.rotation = planet.currentOrbitRotation - p.angle; 
                
            } else {
                p.pivot.visible = false;
            }
        }

        // Refiners
        for (let c = 0; c < planet.refiners.length; c++) {
            let p = planet.refiners[c];

            p.battery = Math.max(p.battery, 0);

            p.angle += p.orbitSpeed; 
            p.angle = p.angle % toRadians(360);

            // Only rotate if collector has battery
            if (p.battery > 1) {
                p.rotation += p.rotationSpeed * Math.abs(p.animationScale);
            } else if (p.battery > 0) {
                p.rotation += p.rotationSpeed * (p.battery) * Math.abs(p.animationScale);
            }
            

            p.battery -= 0.005;

            if (p.animationScale > -1) p.animationScale -= 0.05;
            p.animationScale = Math.round(p.animationScale * 100) / 100;

            refiner = p;

            // At the middle of the refine animation, push the new material
            if (refiner.animationScale == -0.95) {
                // Create the graphic
                const newMaterialGraphic = new PIXI.Sprite(bigMaterialTexture);
                newMaterialGraphic.anchor.set(0.5);
                newMaterialGraphic.position.set(refiner.x, refiner.y);
                newMaterialGraphic.visible = drawThisPlanet; // Hide if spawning on another planet
                materialContainer.addChild(newMaterialGraphic);

                // The halfway orbit radius is the average of the max radius and the planet radius
                let halfwayOrbit = (450 + planet.radius + 15)/2;
                let radiusChangeModifier = 1;
            
                if (refiner.radius > halfwayOrbit) radiusChangeModifier = -1;

                // Push the refined material
                planet.materialsToCollect.push({
                    radius: refiner.radius+6,
                    angle: refiner.angle,
                    rotation: 0,
                    radiusChange: (0.6 - planet.gravityFactor)*radiusChangeModifier,
                    angleChange: 0,
                    alpha: 1,
                    timeInTractorBeam: 0,
                    value: refiner.mineralsStored * 2,
                    refined: true,
                    x: refiner.x,
                    y: refiner.y,

                    graphic: newMaterialGraphic
                });

                refiner.mineralsStored = 0;
            }

            // Draw Refiners
            if (drawThisPlanet) {
                p.pivot.visible = true;
                
                // 2. Sync the pivot to the math
                p.pivot.rotation = p.angle; 
                
                // 3. Push the graphic out from the center to match the radius
                p.graphic.x = p.radius; 
                
                // 4. THE FIX: Target Rotation MINUS Parent Rotation
                p.graphic.rotation = p.rotation; 

                p.arms.scale.set(Math.abs(p.animationScale));
                
            } else {
                p.pivot.visible = false;
            }
        }


        // Collectors
        for (let c = 0; c < planet.collectors.length; c++) {
            let p = planet.collectors[c];

            p.battery = Math.max(p.battery, 0);

            p.angle += p.orbitSpeed; 
            p.angle = p.angle % toRadians(360);

            // Only rotate if collector has battery
            if (p.battery > 1) {
                p.rotation += p.rotationSpeed;
            } else if (p.battery > 0) {
                p.rotation += p.rotationSpeed * (p.battery);
            }

            p.battery -= 0.005;

            // Draw Collectors
            if (drawThisPlanet) {
                p.pivot.visible = true;
                
                // 2. Sync the pivot to the math
                p.pivot.rotation = p.angle; 
                
                // 3. Push the graphic out from the center to match the radius
                p.graphic.x = p.radius; 
                
                // 4. THE FIX: Target Rotation MINUS Parent Rotation
                p.graphic.rotation = p.rotation; 
                
            } else {
                p.pivot.visible = false;
            }
        }

        // Lasers
        for (let c = 0; c < planet.laserSatellites.length; c++) {
            let laserSat = planet.laserSatellites[c];

            laserSat.angle += laserSat.rotationSpeed; 
            laserSat.angle = laserSat.angle % toRadians(360);

            laserSatPosition = polarToCartesian(laserSat.radius, laserSat.angle);

            closestComet = null;
            smallestDistance = Infinity;

            // Find closest comet
            for (let j = 0; j < planet.comets.length; j++) {
                let comet = planet.comets[j];

                cometPosition = {
                    x: comet.currentX,
                    y: comet.currentY
                }

                // if (cartesianToPolar(cometPosition.x, cometPosition.y).radius >= (475 + collectionRadius/2)) continue;

                let dxFromCenter = comet.currentX - 500;
                let dyFromCenter = comet.currentY - 500;
                let distFromCenterSq = (dxFromCenter * dxFromCenter) + (dyFromCenter * dyFromCenter);
                let maxRadius = 475 + collectionRadius / 2;

                if (distFromCenterSq >= (maxRadius * maxRadius)) continue;

                distanceToComet = calculateDistance(laserSatPosition, cometPosition);

                if (distanceToComet < smallestDistance && !isLaserBlocked(laserSatPosition, cometPosition, planet)) {
                    smallestDistance = distanceToComet;
                    closestComet = comet;
                }
            }

            // Rotate and Beam the closest comet
            if  (closestComet != null) {
                closestCometPosition = {
                    x: closestComet.currentX,
                    y: closestComet.currentY,
                }

                damagePerFrame = 0.05
                closestComet.material -= damagePerFrame;

                drawLine = isLaserBlocked(laserSatPosition, closestCometPosition, planet);

                let dy = closestCometPosition.y - laserSatPosition.y;
                let dx = closestCometPosition.x - laserSatPosition.x;
                
                // 1. Calculate the angle we WANT to be at
                let targetAngle = Math.atan2(dy, dx);

                // 2. Calculate the difference between current and target
                let angleDiff = targetAngle - laserSat.rotation;

                // 3. Normalize the angle to ensure the satellite takes the shortest path
                // This prevents the "360-degree spin" bug
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                // 4. Smoothly increment the rotation
                let rotationSpeed = 0.2; // Adjust this for "weight"
                if (Math.abs(angleDiff) > 0.01) {
                    laserSat.rotation += angleDiff * rotationSpeed;
                } else {
                    laserSat.rotation = targetAngle; // Snap to target if very close
                }
                
                // Draw the blue laser beam
                if (!drawLine && drawThisPlanet) {
                    powerLineGraphic.lineStyle(Math.random() * damagePerFrame + Math.random() * 5, 0x3083DC, 1);
                    powerLineGraphic.moveTo(laserSatPosition.x, laserSatPosition.y);
                    powerLineGraphic.lineTo(closestCometPosition.x, closestCometPosition.y);
                }
            }

            // Draw Laser Satellites
            if (drawThisPlanet) {
                laserSat.pivot.visible = true;
                
                // 2. Sync the pivot to the math
                laserSat.pivot.rotation = laserSat.angle; 

                laserSat.graphic.x = laserSat.radius;
                
                // 4. THE FIX: Target Rotation MINUS Parent Rotation
                laserSat.graphic.rotation = laserSat.rotation - laserSat.angle; 
                
            } else {
                laserSat.pivot.visible = false;
            }
        }


        // Comets Loop
        for (let i = 0; i < planet.comets.length; i++) {
            let comet = planet.comets[i];

            // Comets don't orbit the planet, they pass by
            comet.progress += comet.speed;
            comet.rotation += comet.rotationSpeed;

            comet.currentX = comet.startX + (comet.finishX - comet.startX) * comet.progress;
            comet.currentY = comet.startY + (comet.finishY - comet.startY) * comet.progress;

            if (comet.progress >= 1.0) {
                if (comet.graphic) comet.graphic.destroy();
                planet.comets.splice(i, 1);
                i--;
                continue;
            }

            // Check if the comet is destroyed
            if (comet.material <= 0) {
                spawnCrystal(comet, planet);
                
                // NEW: Destroy the PixiJS graphic to free up memory
                if (comet.graphic) {
                    comet.graphic.destroy();
                }
                
                planet.comets.splice(i, 1);
                i--; 
                continue; 
            }   

            // --- NEW PIXIJS DRAWING LINK ---
            if (drawThisPlanet && comet.graphic) {
                comet.graphic.visible = true;
                comet.graphic.position.set(comet.currentX, comet.currentY);
                comet.graphic.rotation = comet.rotation;
                
                // 1. Get the 1.0 to 0.0 damage ratio
                let scaleRatio = comet.material / comet.initialMaterial;

                // 2. Calculate the intended visual size (Material / 3) divided by your base texture size (16)
                let visualMultiplier = (comet.initialMaterial / 3) / 16; 

                // 3. Apply both 
                comet.graphic.scale.set(scaleRatio * visualMultiplier);
                
            } else if (comet.graphic) {
                comet.graphic.visible = false;
            }
        }

        // Alien Ships
        if (p.name == "greenPlanet" && drawThisPlanet) {
            alienShipsContainer.visible = true;
            

            alienShipsContainer.rotation += changeShipSpeed(265);

            for (let i = 0; i < alienShips.length; i++) {
                let alienShip = alienShips[i];

                // When energy has been transferred, get new item and hide text
                if (alienShip.energyLeft <= 0 && alienShip.status == "waiting") {
                    if (alienShip.item.resourceType == "material") material += alienShip.item.reward;
                    if (alienShip.item.resourceType == "crystal") crystal += alienShip.item.reward;

                    alienShip.item = getRandomItem();
                    alienShip.energyLeft = alienShip.item.itemCost;

                    alienShipTextContainer.visible = false;

                    alienShip.status = "dropping";
                    continue;
                }

                if (alienShip.status == "dropping") {
                    alienShip.orbitRadius -= 0.5;
                    alienShip.graphic.x = alienShip.orbitRadius;

                    if (alienShip.orbitRadius < 50) alienShip.status = "rising";
                    continue;
                }

                if (alienShip.status == "rising") {
                    alienShip.orbitRadius += 0.5;
                    alienShip.graphic.x = alienShip.orbitRadius;

                    if (alienShip.orbitRadius >= 265) alienShip.status = "waiting";
                    continue;
                }

                alienShipOneText.text = alienShip.energyLeft;
                alienShipOneTextItem.text = alienShip.item.itemText;
                alienShipOneTextItem.style.fill = alienShip.item.textColour;

                alienShip.graphic.x = alienShip.orbitRadius;

                alienShipTextContainer.visible = true;

                
                

                polarToCartesianWrite(alienShip.orbitRadius, alienShipsContainer.rotation, alienShip);
                alienShipOneText.position.set(alienShip.x, alienShip.y + 40);
                alienShipOneTextItem.position.set(alienShip.x, alienShip.y - 45);
                
                if (alienShip.status !== "waiting") {
                    continue;
                }

                let dx = Math.abs(alienShip.x - shipPosition.x);
                let dy = Math.abs(alienShip.y - shipPosition.y);

                if (energy < 1) continue;
                if (dx > 300 && dy > 300) continue;

                let distanceSq = (dx * dx) + (dy * dy); 

                if (distanceSq <= 10000) {
                    let randomWidth = Math.random() * 5;
                    powerLineGraphic.lineStyle(randomWidth, 0xF5D752, 1);

                    // powerLineGraphic.lineStyle(3, 0xF5D752, 1);
                    powerLineGraphic.moveTo(alienShip.x, alienShip.y);
                    powerLineGraphic.lineTo(shipPosition.x, shipPosition.y);

                    alienShip.energyLeft -= 1;
                    energy -= 1;
                    alienShipOneText.text = alienShip.energyLeft;
                }

                
            }

            
        } else {
            alienShipsContainer.visible = false;
            alienShipTextContainer.visible = false;
        }

    }

    // Ship
    shipGraphic.position.set(shipPosition.x, shipPosition.y);
    shipGraphic.rotation = shipRotation;

    
    

    // Fire
    for (let i = 0; i < MAX_FIRE; i++) {
        let sprite = fireSprites[i];
        
        if (sprite.life > 0) {
            sprite.life -= shipRotationSpeed;
            
            sprite.scale.x -= 0.02;
            sprite.scale.y -= 0.02;
            sprite.alpha -= 0.01;
            
            // let coords = polarToCartesian(sprite.flightRadius, sprite.flightAngle);
            // sprite.position.set(coords.x, coords.y);
            let cx = 500 + sprite.flightRadius * Math.cos(sprite.flightAngle);
            let cy = 500 + sprite.flightRadius * Math.sin(sprite.flightAngle);
            sprite.position.set(cx, cy);

            sprite.rotation = sprite.flightAngle;

            if (sprite.alpha <= 0 || sprite.scale.x <= 0 || sprite.life <= 0) {
                sprite.life = 0; 
                sprite.alpha = 0; 
            }
        }
    }

    // Probes
    for (let i = 0; i < probes.length; i++) {
        let p = probes[i];

        if (p.probeProgress < 1.0) {
            // Track the previous progress so we know exactly how much distance is left
            let prevProgress = p.probeProgress;
            
            p.probeProgress += p.probeSpeed;
            if (p.probeProgress > 1.0) p.probeProgress = 1.0; 

            // 1. UPDATE RADIUS
            let r1 = p.originPlanet.orbitRadius;
            let r2 = p.targetPlanet.orbitRadius;
            p.currentRadius = r1 + (r2 - r1) * p.probeProgress;

            // 2. CALCULATE SHORTEST PATH FROM PROBE TO TARGET
            let targetAngle = p.targetPlanet.currentOrbitRotation;
            let diff = targetAngle - p.currentAngle;

            // Force the difference to be between -180 and 180 degrees
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            // 3. APPLY ROTATION
            let remainingProgress = 1.0 - prevProgress;
            if (remainingProgress > 0) {
                // Calculate what fraction of the remaining angle we need to cover this frame
                let stepFraction = p.probeSpeed / remainingProgress;
                
                // Move the probe's angle by that fraction (capped at 1.0 so it snaps perfectly at the end)
                p.currentAngle += diff * Math.min(stepFraction, 1.0); 
            }

            p.productionTimer += dt;

            if (p.productionTimer >= 500) { 
                p.productionTimer = 0; // Reset the timer

                createProbeParticle(p);
            }
        }

        probePosition = polarToCartesian(p.currentRadius, p.currentAngle);
        p.graphic.rotation = p.currentAngle;
        p.graphic.position.set(probePosition.x, probePosition.y);

        if (p.probeProgress >= 1) {
            if (p.graphic) {
                p.graphic.destroy(); 
            }
            probes.splice(i, 1);
            i--;
            p.targetPlanet.landedProbes += 1;
        }
    }

    // Probe Particles
    for (let j = 0; j < probeParticles.length; j++) {
        let p = probeParticles[j];

        // Fade the graphic out directly
        // Note: I increased this from 0.002 to 0.02 so the tail isn't infinitely long
        p.graphic.alpha -= 0.002; 

        // Cleanup when it goes completely transparent
        if (p.graphic.alpha <= 0) {
            p.graphic.destroy(); // Safely removes it from memory
            probeParticles.splice(j, 1);
            j--;
        }
    }
});



// Deploy Devices

function deployDrill() {
    price = currentPlanet.drillCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.drillCostMaterial = Math.floor(price * 1.2);

    // 1. Create the Pivot (Centered at 500,500)
    const drillPivot = new PIXI.Container();
    drillPivot.position.set(500, 500);

    // 2. Create the Graphic (Drawn at local 0, offset by -5 to center it)
    const drillGraphic = new PIXI.Graphics();
    drillGraphic.beginFill(0xFFFFFF);
    drillGraphic.drawRect(0, -5, 10, 10); 
    drillGraphic.endFill();

    // 3. Nest them together and add to the solar system
    drillPivot.addChild(drillGraphic);
    planetScene.addChild(drillPivot);

    currentPlanet.drills.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0,
        inwardsVelocity: currentPlanet.gravityFactor,
        arrived: false,
        materialStored: 0,
        productionTimer: 0,
        randomTimeOffset: Math.random() * 50,
        
        // Save the Pixi references so the loop can update them
        pivot: drillPivot,
        graphic: drillGraphic 
    });
}

function deploySatellite() {
    price = currentPlanet.satelliteCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.satelliteCostMaterial = Math.floor(price * 1.1);

    const satellitePivot = new PIXI.Container();
    satellitePivot.position.set(500, 500);

    const satelliteGraphic = new PIXI.Graphics();

    const satelliteSize = 20;
    const wingWidth = 5;
    const wingLength = 10;

    satelliteGraphic.beginFill(0xFFFFFF);
    satelliteGraphic.drawRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2); 
    satelliteGraphic.endFill();
    satelliteGraphic.beginFill(0xFFFFFF);
    satelliteGraphic.drawCircle(0, 0, satelliteSize/2); 
    satelliteGraphic.endFill();

    satellitePivot.addChild(satelliteGraphic);
    planetScene.addChild(satellitePivot);

    currentPlanet.satellites.push({
        radius: flightRadius + 10,
        angle: shipRotation,
        rotationSpeed: shipRotationSpeed,
        powerStored: 0,
        productionTimer: 0,

        // Save the Pixi references so the loop can update them
        pivot: satellitePivot,
        graphic: satelliteGraphic 
    });
}

function deployCollector() {
    price = currentPlanet.collectorCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.collectorCostMaterial = Math.floor(price * 1.1);

    const collectorPivot = new PIXI.Container();
    collectorPivot.position.set(500, 500);

    const collectorGraphic = new PIXI.Graphics();

    const collectorsize = 20;
    const wingSize = 15;

    collectorGraphic.beginFill(0xFFFFFF);
    collectorGraphic.drawRect(-(collectorsize/2), -(collectorsize/2), collectorsize, collectorsize);
    collectorGraphic.endFill();

    collectorGraphic.lineStyle(5, 0xffffff);
    collectorGraphic.moveTo(wingSize, -(wingSize));
    collectorGraphic.lineTo(-wingSize,wingSize);

    collectorGraphic.moveTo(-wingSize, -wingSize);
    collectorGraphic.lineTo(wingSize,wingSize);
    

    collectorPivot.addChild(collectorGraphic);
    planetScene.addChild(collectorPivot);

    currentPlanet.collectors.push({
        radius: flightRadius + 10,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,

        // Save the Pixi references so the loop can update them
        pivot: collectorPivot,
        graphic: collectorGraphic 
    });
}

// deployRefiner() 

function deployRefiner() {
    price = currentPlanet.refinerCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.refinerCostMaterial = Math.floor(price * 1.1);

    const refinerPivot = new PIXI.Container();
    refinerPivot.position.set(500, 500);

    const refinerGraphic = new PIXI.Graphics();
    const refinerGraphicArms = new PIXI.Graphics();

    // Configuration Parameters
    const circleRadius = 10; // Define the center circle size
    const lineLength = 17.5; // Total length of the main radiating lines (L)
    const crossbarWidth = 12.5; // Total width of the T crossbar (C)
    const lineColor = 0xFFFFFF; // White
    const lineThickness = 4;

    // Define the angles for 120-degree spacing
    const angles = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];

    // 1. Draw the central circle
    refinerGraphic.beginFill(lineColor);
    refinerGraphic.drawCircle(0, 0, circleRadius);
    refinerGraphic.endFill();

    // Set line style for lines and crossbars
    refinerGraphicArms.lineStyle(lineThickness, lineColor);

    angles.forEach((angle) => {
        // 2. Draw the main radiating lines (from center to end of L)
        const endX = Math.cos(angle) * lineLength;
        const endY = Math.sin(angle) * lineLength;
        refinerGraphicArms.moveTo(0, 0);
        refinerGraphicArms.lineTo(endX, endY);

        // 3. Draw the T crossbars
        // To be perpendicular to the line, the crossbar angle is shifted by 90 degrees (PI/2)
        const crossbarAngle = angle + Math.PI / 2;
        const halfC = crossbarWidth / 2;

        const c1X = endX + Math.cos(crossbarAngle) * halfC;
        const c1Y = endY + Math.sin(crossbarAngle) * halfC;
        const c2X = endX - Math.cos(crossbarAngle) * halfC;
        const c2Y = endY - Math.sin(crossbarAngle) * halfC;

        refinerGraphicArms.moveTo(c1X, c1Y);
        refinerGraphicArms.lineTo(c2X, c2Y);
    });
    

    refinerGraphic.addChild(refinerGraphicArms);
    refinerPivot.addChild(refinerGraphic);
    planetScene.addChild(refinerPivot);

    currentPlanet.refiners.push({
        radius: flightRadius + 10,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,
        animationScale: -1,

        // Save the Pixi references so the loop can update them
        pivot: refinerPivot,
        graphic: refinerGraphic, 
        arms: refinerGraphicArms
    });
}

function deployLaser() {
    price = currentPlanet.laserSatelliteCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.laserSatelliteCostMaterial = Math.floor(price * 1.1);

    const laserPivot = new PIXI.Container();
    laserPivot.position.set(500, 500);

    const laserGraphic = new PIXI.Graphics();

    const satelliteSize = 15;
    const wingWidth = 5;
    const wingLength = 10;

    laserGraphic.beginFill(0xFFFFFF);
    laserGraphic.drawRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2);
    laserGraphic.drawRect(-satelliteSize, -satelliteSize/2, satelliteSize, satelliteSize);
    laserGraphic.arc(satelliteSize/2,0,satelliteSize/2, toRadians(90), toRadians(270));
    laserGraphic.endFill();
    

    laserPivot.addChild(laserGraphic);
    planetScene.addChild(laserPivot);

    // 3. Push the graphic out from the center to match the radius
    laserGraphic.x = flightRadius + 6; 

    currentPlanet.laserSatellites.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        rotation: 0,
        rotationSpeed: shipRotationSpeed,
        damageStored: 0,
        productionTimer: 0,
        timeSinceLastShot: 0,

        pivot: laserPivot,
        graphic: laserGraphic
    });
}









function spawnFireParticle(radius, angle) {
    for (let i = 0; i < MAX_FIRE; i++) {
        let sprite = fireSprites[i];
        
        if (sprite.life <= 0) { 
            sprite.life = Math.random() * 40;
            sprite.scale.set(1);
            sprite.alpha = 1; 
            
            sprite.tint = fireColors[Math.floor(Math.random() * fireColors.length)];
            
            sprite.flightRadius = radius + 12.5 + Math.random() * 10 - 5;
            sprite.flightAngle = angle;
            
            break; 
        }
    }
}



function deleteMaterial(planet, index) {
    const materials = planet.materialsToCollect;
    const lastIndex = materials.length - 1;

    // Turn off the graphic
    materials[index].graphic.destroy();

    // If the item we are deleting is NOT the last item in the array, swap them
    if (index !== lastIndex) {
        materials[index] = materials[lastIndex];
    }
    
    // Remove the last item (which is now either the deleted item, or a duplicate of the swapped item)
    materials.pop();
}

// function olddeleteMaterial(planet, index) {
//     let last = planet.materials.count - 1;

//     // If we aren't deleting the very last rock, copy the last rock's data into this hole
//     if (index !== last) {
//         planet.materials.radius[index] = planet.materials.radius[last];
//         planet.materials.angle[index] = planet.materials.angle[last];
//         planet.materials.rotation[index] = planet.materials.rotation[last];
//         planet.materials.radiusChange[index] = planet.materials.radiusChange[last];
//         planet.materials.timeInTractorBeam[index] = planet.materials.timeInTractorBeam[last];
//         planet.materials.value[index] = planet.materials.value[last];
//         planet.materials.alpha[index] = planet.materials.alpha[last];
//         planet.materials.x[index] = planet.materials.x[last];
//         planet.materials.y[index] = planet.materials.y[last];
//         planet.materials.refined[index] = planet.materials.refined[last];
//         planet.materials.isTargeted[index] = planet.materials.isTargeted[last];
//     }

//     // THE FIX: Hide the sprite at the 'last' index before it gets abandoned!
//     if (materialSprites[last]) {
//         materialSprites[last].alpha = 0;
//     }

//     // Shrink the pool by 1
//     planet.materials.count--;
// }


function spawnComet(planet) {
    const margin = 100; // Spawn 100px off-screen
    
    // Calculate the true world-space bounds by dividing the physical screen
    // by the scale factor you apply in resizeGameWorld()
    width = app.screen.width / solarSystem.scale.x;
    height = app.screen.height / solarSystem.scale.y;

    if (height > width) height = 1000;

    // Define our valid sides (excluding bottom)
    const validSides = ['left', 'right'];
    
    // 1. Pick a random starting side
    const startSide = validSides[Math.floor(Math.random() * validSides.length)];
    
    // 2. Filter out the start side so it doesn't try to exit the same way it entered
    const availableFinishSides = validSides.filter(side => side !== startSide);
    
    // 3. Pick a random finish side from the remaining options
    const finishSide = availableFinishSides[Math.floor(Math.random() * availableFinishSides.length)];

    let startX, startY, finishX, finishY;

    // 4. Set starting coordinates based on startSide
    if (startSide === 'top') {
        startX = Math.random() * width;
        startY = -margin;
    } else if (startSide === 'left') {
        startX = -margin;
        startY = Math.random() * height;
    } else if (startSide === 'right') {
        startX = width + margin;
        startY = Math.random() * height;
    }

    // 5. Set finishing coordinates based on finishSide
    if (finishSide === 'top') {
        finishX = Math.random() * width;
        finishY = -margin;
    } else if (finishSide === 'left') {
        finishX = -margin;
        finishY = Math.random() * height;
    } else if (finishSide === 'right') {
        finishX = width + margin;
        finishY = Math.random() * height;
    }

    let startingMaterial = 50 + (Math.random() * 100);

    // const cometGraphic = new PIXI.Graphics();
    // cometGraphic.position.set(startX, startY);

    const cometGraphic = new PIXI.Sprite(cometTexture);
    cometGraphic.anchor.set(0.5);
    cometGraphic.position.set(startX, startY);

    // Hide if not viewing the planet
    cometGraphic.visible = false;

    planetScene.addChild(cometGraphic);

    

    planet.comets.push({
        startX, startY,
        finishX, finishY,
        currentX: startX,
        currentY: startY,
        progress: 0, // This goes from 0 to 1
        speed: 0.001, // Adjust for how fast they cross (0.01 is very fast)
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        material: startingMaterial,
        initialMaterial: startingMaterial,
        graphic: cometGraphic
    });
}

function spawnCrystal(comet, planetToSpawnOn) {
    const crystalGraphic = new PIXI.Graphics();
    crystalGraphic.beginFill(0xd336f2);
    crystalGraphic.drawRect(-8, -8, 16, 16); 
    crystalGraphic.endFill();

    crystalGraphic.position.set(comet.currentX, comet.currentY);

    crystalGraphic.visible = false;

    planetScene.addChild(crystalGraphic);

    planetToSpawnOn.crystals.push({
        radius: cartesianToPolar(comet.currentX, comet.currentY).radius,
        angle: cartesianToPolar(comet.currentX, comet.currentY).angle,
        rotationSpeed: 0.1,
        crystalAmount: 1,
        timeInTractorBeam: 0,

        graphic: crystalGraphic
    });
}


function deployProbe() {
    price = 100;
    if (energy < price) return;
    energy -= price;

    // 1. Identify the origin and target
    let origin = planets.find(p => p.hasShip);
    let target = planets.find(p => p.selected);

    if (origin && target) {
        // 2. Calculate the shortest angle difference (Delta Theta)
        let startAngle = origin.currentOrbitRotation % (Math.PI * 2);
        let endAngle = target.currentOrbitRotation % (Math.PI * 2);

        if (startAngle < 0) startAngle += Math.PI * 2;
        if (endAngle < 0) endAngle += Math.PI * 2;

        let diff = endAngle - startAngle;
        if (diff > Math.PI) diff -= Math.PI * 2;
        else if (diff < -Math.PI) diff += Math.PI * 2;

        // 3. Approximate the physical distance of the spiral path
        let dr = target.orbitRadius - origin.orbitRadius;
        let avgRadius = (origin.orbitRadius + target.orbitRadius) / 2;
        
        let pathDistance = Math.sqrt((dr * dr) + Math.pow(avgRadius * diff, 2));

        // 4. Define your desired constant speed (pixels per frame)
        let constantSpeed = 0.3; 
        
        // 5. Calculate the fractional speed for 't'
        // Avoid division by zero if planets are perfectly aligned
        let calculatedSpeed = pathDistance > 0 ? (constantSpeed / pathDistance) : 0.001;


        const probe = new PIXI.Graphics();

        probe.beginFill(0xFFFFFF);
        probe.drawRect(-4, -4, 8, 8);
        probe.endFill();

        probeLayer.addChild(probe);

        probes.push({
            probeProgress: 0,
            probeSpeed: calculatedSpeed, 
            originPlanet: origin,       
            targetPlanet: target,       
            currentAngle: origin.currentOrbitRotation, 
            currentRadius: origin.orbitRadius,  
            productionTimer: 0, 
            particles: [],  
            graphic: probe,
        });
    
    }
}

function createProbeParticle(probe) {
    const particle = new PIXI.Graphics();

    // Your original Canvas green: rgb(50, 210, 150) -> Hex: 0x32D296
    particle.beginFill(0x32D296);
    
    // Draw the small square (centered)
    particle.drawRect(-1.5, -1.5, 3, 3); 
    particle.endFill();

    // THE FIX: Calculate the exact position and move the graphic there
    let pos = polarToCartesian(probe.currentRadius, probe.currentAngle);
    particle.position.set(pos.x, pos.y);
    
    // Rotate the particle to match the flight path
    particle.rotation = probe.currentAngle;

    probeParticleLayer.addChild(particle);

    // Push it to your array. We no longer need to store radius/angle/alpha 
    // in the array object because the PIXI graphic holds that data natively now!
    probeParticles.push({
        graphic: particle
    });
}



// ------ //
// MUSIC //
// ----- //


const bgMusic = new Howl({
  // 1. Order matters: Browser tries OGG first, falls back to MP3 for iOS
  src: ['background.mp3'], 
  sprite: {
    mainLoop: [32000, 32000, true] 
  },
  volume: 0.5,
  preload: true
});

// 2. Listen for both mouse clicks and mobile screen taps
const unlockEvents = ['click', 'touchstart'];

function startAudio() {
  if (!bgMusic.playing()) {
    bgMusic.play('mainLoop');
  }
  
  // Clean up: remove the listeners once the audio starts so it doesn't re-trigger
  unlockEvents.forEach(event => {
    document.removeEventListener(event, startAudio);
  });
}

// Attach the listeners to the document
unlockEvents.forEach(event => {
  document.addEventListener(event, startAudio, { once: true });
});


// 1. Load your single note
const sweepNote = new Howl({
  src: ['effect.mp3'],
  volume: 0.2 // Keep volume lower since notes will overlap rapidly
});

// 2. Define your orbital boundaries and rate limits
const MIN_RADIUS = 100; // Closest orbit
const MAX_RADIUS = 450; // Furthest orbit
const MAX_RATE = 2.5;   // High pitch/fast (closest to planet)
const MIN_RATE = 0.25;   // Low pitch/slow (furthest from planet)

// 3. Helper function: Map radius to rate (Linear Interpolation)
function getRateFromRadius(currentRadius) {
  // Clamp the radius just in case the ship overshoots
  const clampedRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, currentRadius));
  
  // Calculate how far along the radius the ship is (0.0 to 1.0)
  const progress = (clampedRadius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS);
  
  // Invert the mapping: closer radius = higher rate
  return MAX_RATE - (progress * (MAX_RATE - MIN_RATE));
}

// 4. Game loop execution variables
let lastNoteTime = 0;
const NOTE_INTERVAL = 125; // Trigger a note every 80ms while moving

// Call this inside your main update/movement function when the radius changes
function playRiserSweep(currentRadius) {
  const now = performance.now();
  
  // Only play the next note if enough time has passed (throttle)
  if (now - lastNoteTime > NOTE_INTERVAL) {
    const currentRate = getRateFromRadius(currentRadius);
    
    // Play the sound and capture its unique ID
    const soundId = sweepNote.play();
    
    // Apply the dynamically calculated rate specifically to this instance
    sweepNote.rate(currentRate, soundId);
    
    lastNoteTime = now;
  }
}


// -----------
// MAIN THREAD
// -----------


// function mainThread() {
    

//     for (let i = 0; i < probes.length; i++) {
//         let p = probes[i];

//         if (p.probeProgress < 1.0) {
//             // Track the previous progress so we know exactly how much distance is left
//             let prevProgress = p.probeProgress;
            
//             p.probeProgress += p.probeSpeed;
//             if (p.probeProgress > 1.0) p.probeProgress = 1.0; 

//             // 1. UPDATE RADIUS
//             let r1 = p.originPlanet.orbitRadius;
//             let r2 = p.targetPlanet.orbitRadius;
//             p.currentRadius = r1 + (r2 - r1) * p.probeProgress;

//             // 2. CALCULATE SHORTEST PATH FROM PROBE TO TARGET
//             let targetAngle = p.targetPlanet.currentOrbitRotation;
//             let diff = targetAngle - p.currentAngle;

//             // Force the difference to be between -180 and 180 degrees
//             while (diff > Math.PI) diff -= Math.PI * 2;
//             while (diff < -Math.PI) diff += Math.PI * 2;

//             // 3. APPLY ROTATION
//             let remainingProgress = 1.0 - prevProgress;
//             if (remainingProgress > 0) {
//                 // Calculate what fraction of the remaining angle we need to cover this frame
//                 let stepFraction = p.probeSpeed / remainingProgress;
                
//                 // Move the probe's angle by that fraction (capped at 1.0 so it snaps perfectly at the end)
//                 p.currentAngle += diff * Math.min(stepFraction, 1.0); 
//             }

//             p.productionTimer += dt;

//             if (p.productionTimer >= 500) { 
//                 p.productionTimer = 0; // Reset the timer

//                 probeParticles.push({
//                     radius: p.currentRadius,
//                     angle: p.currentAngle,
//                     // life: Math.random() * 40,
//                     // size: 10,
//                     // color: Math.floor(Math.random() * 60),
//                     alpha: 1,
//                 });
//             }
//         }

//         if (p.probeProgress >= 1) {
//             probes.splice(i, 1);
//             i--;
//             p.targetPlanet.landedProbes += 1;
//             // console.log(planets[2]);
//         }
//     }

//     for (let j = 0; j < probeParticles.length; j++) {
//         let g = probeParticles[j];

//         g.alpha -= 0.002;

//         if (g.alpha <= 0) {
//             probeParticles.splice(j, 1);
//             j--;
//         }
//     }
    

    

//     // --------------------------------------------------
//     // GO THROUGH EACH PLANET AND CALCULATE AND/OR RENDER
//     // --------------------------------------------------
//     for (let i = 0; i < planets.length; i++) {
//         let p = planets[i]




//         // Unlock if needed
//         if (p.landedProbes == p.neededProbes) {
//             p.unlocked = true;
//         }
        
        


//         // Draw smart collectors
//         // CRYSTAL COLLECTORS
//         for (let i = 0; i < planet.smartCollectors.length; i++) {
//             let sc = planet.smartCollectors[i];  

//             let closestMaterial = null;
//             let closestDistance = 10000000000000;

//             smartCollectorPosition = polarToCartesian(sc.radius, sc.angle);

//             // Go through the crystals
//             // Check which are in range
//             // Check which is closest
//             // Move towards it
//             if (sc.battery > 0) {
//                 for (let j = 0; j < planet.crystals.length; j++) {
//                     let m = planet.crystals[j];


//                     // if (m.value < 3) continue;
//                     // if (m.radius > 450) continue;
                

//                     materialPosition = polarToCartesian(m.radius, m.angle);
                    

//                     distance = calculateDistance(smartCollectorPosition, materialPosition);

//                     if (distance < closestDistance) {
//                         closestDistance = distance;
//                         closestMaterial = m;
//                     }
//                 }

//                 if (closestMaterial) {
//                     // 1. Calculate raw differences
//                     let rDiff = closestMaterial.radius - sc.radius;
//                     let angleDiff = Math.atan2(
//                         Math.sin(closestMaterial.angle - sc.angle), 
//                         Math.cos(closestMaterial.angle - sc.angle)
//                     );

//                     // 2. Convert Angle difference to "Arc Distance" (actual pixels)
//                     // Distance = Radius * Angle
//                     let arcDiff = angleDiff * sc.radius;

//                     // 3. Calculate Total Pixel Distance (Pythagoras)
//                     let totalDist = Math.sqrt(rDiff * rDiff + arcDiff * arcDiff);

//                     if (totalDist > 0.1) {
//                         // --- TWEAK THESE TWO ---
//                         const maxSpeed = Math.min(0.3, sc.battery);  // Constant travel speed in pixels
//                         const easing = 0.1;    // How soon it starts slowing down (0.1 = 10% of distance)
                        
//                         // 4. Determine Step Size (Constant Speed + Easing)
//                         // This ensures the collector moves at 'maxSpeed' until it's close.
//                         let stepSize = Math.min(maxSpeed, totalDist * easing);

//                         // 5. Calculate the Movement Ratio
//                         let ratio = stepSize / totalDist;

//                         // 6. Apply Movement proportionally
//                         sc.radius += rDiff * ratio;
//                         sc.radius = Math.min(sc.radius, 450);
//                         sc.angle += angleDiff * ratio;
//                         sc.angle = sc.angle % toRadians(360);
//                     }

//                     // Angle cleanup
//                     if (sc.angle > Math.PI) sc.angle -= Math.PI * 2;
//                     if (sc.angle < -Math.PI) sc.angle += Math.PI * 2;

//                     // ctx.save();
//                     // ctx.strokeStyle = `rgba(255,255,255, ${Math.min(sc.battery, 0.3)})`;
//                     // ctx.beginPath();
//                     // ctx.moveTo(polarToCartesian(sc.radius, sc.angle).x, polarToCartesian(sc.radius, sc.angle).y);
//                     // ctx.lineTo(polarToCartesian(closestMaterial.radius, closestMaterial.angle).x, polarToCartesian(closestMaterial.radius, closestMaterial.angle).y);
//                     // ctx.lineWidth = 2;
//                     // ctx.setLineDash([]);
//                     // ctx.stroke();
//                     // ctx.fillStyle = "rgb(255 255 255)";
//                     // ctx.restore();
//                 }
//             }
        
//             if (drawThisPlanet) canvasDrawSmartCollector(sc);
//         }

//         // Draw bundles
//         for (let i = 0; i < planet.bundles.length; i++) {
//             let p = planet.bundles[i];


//             p.rotation += p.rotationSpeed;

//             const bundlePosition = polarToCartesian(p.radius, p.angle);

//             // Don't need to calculate bundles if ship isn't there
//             if (drawThisPlanet) {
//                 distance = calculateDistance(bundlePosition, shipPosition);

//                 if (distance <= 15**2) {

//                     planet.bundles.splice(i, 1);
//                     i--;
//                     material += Math.floor(p.mineralsAmount);

//                 } 

//                 // 4. Check if distance is 10 or less
//                 if (distance <= collectionRadius**2) {
                    
//                     p.timeInTractorBeam += 0.05;

//                     // start moving towards ship
//                     p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

//                     // Magically wraps the difference between -PI and PI
//                     let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
                    
//                     p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                    
//                 }

                
//                 canvasDrawBundle(p);
//             }            
//         }

//     }

//     if (view == "system") {
//         drawSolarSystem();
//     }
    
//     window.requestAnimationFrame(mainThread);
// }


count = 0;



// Calculations

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(objectOne, objectTwo) {

        // Calculate the difference in X and Y
        dx = objectOne.x - objectTwo.x;
        dy = objectOne.y - objectTwo.y;

        distanceSquared = (dx * dx) + (dy * dy);
        return(distanceSquared);
}

function toRadians(degrees) {
    return(degrees * Math.PI / 180);
}

function polarToCartesian(radius, angle, centerX = 500, centerY = 500) {
    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    };
}

const precision = 1000; // Multiplier for decimal precision
const sinLUT = new Float32Array(360 * precision);
const cosLUT = new Float32Array(360 * precision);

// Pre-calculate 360,000 values
for (let i = 0; i < 360 * precision; i++) {
    let radians = (i / precision) * (Math.PI / 180);
    sinLUT[i] = Math.sin(radians);
    cosLUT[i] = Math.cos(radians);
}

function fastSin(radians) {
    // Keep angle positive and within 0 to 2*PI
    let normalized = radians % (Math.PI * 2);
    if (normalized < 0) normalized += (Math.PI * 2);
    
    // Convert radians back to our array index
    let degrees = normalized * (180 / Math.PI);
    let index = Math.floor(degrees * precision);
    
    return sinLUT[index];
}

function fastCos(radians) {
    let normalized = radians % (Math.PI * 2);
    if (normalized < 0) normalized += (Math.PI * 2);
    let degrees = normalized * (180 / Math.PI);
    let index = Math.floor(degrees * precision);
    
    return cosLUT[index];
}

function polarToCartesianWrite(radius, angle, object, centerX = 500, centerY = 500) {
    object.x = centerX + radius * fastCos(angle),
    object.y = centerY + radius * fastSin(angle)
}

function cartesianToPolar(objectX, objectY) {
    // 1. Get relative distance from the center (500, 500)
    const dx = objectX - 500;
    const dy = objectY - 500;

    // 2. Calculate the radius (distance from center)
    const radius = Math.sqrt(dx * dx + dy * dy);

    // 3. Calculate the angle in radians
    const angle = Math.atan2(dy, dx);

    polarCoordinates = {
        radius: radius,
        angle: angle,
    }

    return polarCoordinates;
}

function isLaserBlocked(sat, comet, planet) {
    // 1. Get the vector from Satellite to Comet
    const dx = comet.x - sat.x;
    const dy = comet.y - sat.y;
    
    // 2. Find the "t" parameter of the projection
    // This tells us how far along the segment the closest point is
    const l2 = dx * dx + dy * dy; // Squared length of the laser segment
    if (l2 === 0) return false;    // Satellite and comet are on the same spot
    
    let t = ((500 - sat.x) * dx + (500 - sat.y) * dy) / l2;
    
    // 3. Clamp 't' to the range [0, 1] 
    // This ensures we only care about the segment between the two points
    t = Math.max(0, Math.min(1, t));
    
    // 4. Find the coordinates of that closest point on the segment
    const closestX = sat.x + t * dx;
    const closestY = sat.y + t * dy;
    
    // 5. Calculate distance from planet center to this closest point
    const distDX = 500 - closestX;
    const distDY = 500 - closestY;
    const distanceSquared = distDX * distDX + distDY * distDY;
    
    // 6. If distance is less than radius, it's blocked!
    return distanceSquared < (planet.radius**2);
}







function canvasDrawSmartCollector(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    // ctx.rotate(p.angle);

    p.battery -= 0.005;
    p.battery = Math.max(p.battery, 0);

    // Only rotate or move if smart collector has battery
    if (p.battery > 1) {
        p.rotation += p.rotationSpeed;
    } else if (p.battery > 0.1) {
        p.rotation += p.rotationSpeed * (p.battery);
    } else if (p.battery < 0.1) {
        p.rotation += p.rotationSpeed * 0.1;
    }
    

    
    ctx.rotate(p.rotation);

    const collectorsize = 13;
    const wingSize = 7.5;
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.strokeStyle = "rgb(255 255 255)";
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.fillRect(-(collectorsize/2), -(collectorsize/2), collectorsize, collectorsize);

    // Arm 1
    ctx.beginPath();
    ctx.moveTo(wingSize, -(wingSize));
    ctx.lineTo(-wingSize,wingSize);
    ctx.stroke();

    // Arm 2
    ctx.beginPath();
    ctx.moveTo(-(wingSize), -(wingSize));
    ctx.lineTo(wingSize,wingSize);
    ctx.stroke();

    ctx.restore();
}

function canvasDrawBundle(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgba(46, 191, 165, 1)`;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
}




let ringOffset = 0;

function getProbePosition(planetA, planetB, t) {
    let sunX = 500;
    let sunY = 500;

    let r1 = planetA.orbitRadius;
    let r2 = planetB.orbitRadius;

    let startAngle = planetA.currentOrbitRotation % (Math.PI * 2);
    let endAngle = planetB.currentOrbitRotation % (Math.PI * 2);

    if (startAngle < 0) startAngle += Math.PI * 2;
    if (endAngle < 0) endAngle += Math.PI * 2;

    let diff = endAngle - startAngle;
    if (diff > Math.PI) {
        diff -= Math.PI * 2;
    } else if (diff < -Math.PI) {
        diff += Math.PI * 2;
    }
    
    let drawEnd = startAngle + diff;

    // Calculate exact coordinates based on progress 't'
    let currentAngle = startAngle + (drawEnd - startAngle) * t;
    let currentRadius = r1 + (r2 - r1) * t;

    return {
        x: sunX + Math.cos(currentAngle) * currentRadius,
        y: sunY + Math.sin(currentAngle) * currentRadius
    };
}




// function drawSolarSystem() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height); 

//     const scale = 0.15;
//     let activePlanet = null;
//     selectedPlanet = null;

//     ctx.save();

//     zoomLevel = 1.7;
//     ctx.translate(500, 500);
//     ctx.scale(zoomLevel, zoomLevel);
//     ctx.translate(-500, -500);
    

//     // Draw shadows so no overlap
//     for (let i = 0; i < planets.length; i++) {
//         let p = planets[i];

//         // Shadow
//         ctx.save();
//         ctx.translate(500,500);
//         ctx.rotate(p.currentOrbitRotation);
//         ctx.fillStyle = "rgb(0 0 0)";
//         ctx.fillRect(p.orbitRadius, -p.radius*scale, 3000, 2*p.radius*scale);
//         ctx.restore();
//     }

//     // Draw pathway from current planet to selected planet
//     for (let i = 0; i < planets.length; i++) {
//         let p = planets[i];

//         // Pathway from current planet to selected planet

//         if (p.hasShip) activePlanet = p;
//         if (p.selected) selectedPlanet = p;

//     }

//     ctx.strokeStyle = "rgba(255,255,255,0.5";
//     ctx.lineWidth = 3;
//     ctx.lineDashOffset = ringOffset;
//     ctx.setLineDash([3,3]);

//     if (selectedPlanet != null && !selectedPlanet.unlocked) {
//         document.getElementById("travelButton").style.display = "none";
//         document.getElementById("unlockButton").style.display = "flex";
//         // document.getElementById("unlockPlanetCost").innerHTML = selectedPlanet.cost;
//     }

//     if (selectedPlanet != null && selectedPlanet.unlocked) {
//         document.getElementById("travelButton").style.display = "flex";
//         document.getElementById("unlockButton").style.display = "none";
//     }


//     if (activePlanet != null && selectedPlanet != null) {
//         // 1. Setup Sun and Planet data
//         let sunX = 500;
//         let sunY = 500;

//         let planetA = activePlanet;
//         let planetB = selectedPlanet;

//         updateHelp(selectedPlanet.description);

//         // Use variables directly to ensure we know which is Start and which is End
//         let r1 = planetA.orbitRadius;
//         let r2 = planetB.orbitRadius;

//         // 2. NORMALIZE ANGLES
//         let startAngle = planetA.currentOrbitRotation % (Math.PI * 2);
//         let endAngle = planetB.currentOrbitRotation % (Math.PI * 2);

//         if (startAngle < 0) startAngle += Math.PI * 2;
//         if (endAngle < 0) endAngle += Math.PI * 2;

//         // 3. CALCULATE THE SHORTEST DISTANCE (The "Flip" Logic)
//         let diff = endAngle - startAngle;

//         // Force the difference to be between -PI and PI (-180 to 180 degrees).
//         // This guarantees the spiral never travels more than halfway around the sun.
//         if (diff > Math.PI) {
//             diff -= Math.PI * 2;
//         } else if (diff < -Math.PI) {
//             diff += Math.PI * 2;
//         }

//         let drawEnd = startAngle + diff;

//         // 4. DRAWING
//         ctx.save();
//         ctx.beginPath();


//         const segments = 40; 
//         for (let i = 0; i <= segments; i++) {
//             let t = i / segments;
            
//             // Smoothly transition the angle and the radius using our new shortest path
//             let currentAngle = startAngle + (drawEnd - startAngle) * t;
//             let currentRadius = r1 + (r2 - r1) * t;
            
//             let x = sunX + Math.cos(currentAngle) * currentRadius;
//             let y = sunY + Math.sin(currentAngle) * currentRadius;
            
//             if (i === 0) {
//                 ctx.moveTo(x, y);
//             } else {
//                 ctx.lineTo(x, y);
//             }
//         }

//         // ctx.stroke();

//         // Draw green particles
//         for (let j = 0; j < probeParticles.length; j++) {
//             let g = probeParticles[j];
//             particleX = polarToCartesian(g.radius, g.angle).x;
//             particleY = polarToCartesian(g.radius, g.angle).y;

//             ctx.save();
//             ctx.translate(particleX, particleY);
//             ctx.rotate(g.angle);
//             ctx.fillStyle = `rgba(50, 210, 150, ${g.alpha})`;
//             ctx.fillRect(-1.5*g.alpha, -1.5*g.alpha, 3*g.alpha, 3*g.alpha); 
//             ctx.restore();
//         }

//         for (let i = 0; i < probes.length; i++) {
//             let p = probes[i];

//             if (!p.originPlanet || !p.targetPlanet) continue;

//             let x = 500 + Math.cos(p.currentAngle) * p.currentRadius;
//             let y = 500 + Math.sin(p.currentAngle) * p.currentRadius;

//             ctx.save();
//             ctx.translate(x, y);

//             ctx.save();

//             let radarLength = 10;
//             let sweepAngle = (p.radarAngle || (Date.now() / 600)) % (Math.PI * 2); 
//             let trailAngle = Math.PI / 2; 

//             // Rotate the canvas to the current sweep position
//             ctx.rotate(sweepAngle);

//             // Draw fading trail behind the line
//             ctx.beginPath();
//             ctx.moveTo(0, 0);
//             ctx.arc(0, 0, radarLength, -trailAngle, 0);
//             ctx.closePath();

//             let gradient = ctx.createConicGradient(-trailAngle, 0, 0);
//             let solidStop = trailAngle / (Math.PI * 2);
//             // gradient.addColorStop(0, "rgba(50, 210, 150, 0)"); 
//             // gradient.addColorStop(trailAngle / (Math.PI * 2), "rgba(50, 210, 150, 0.5)"); 

//             gradient.addColorStop(0, "rgba(50, 210, 150, 0)"); 
//             gradient.addColorStop(solidStop, "rgba(50, 210, 150, 0.75)"); 
//             gradient.addColorStop(solidStop + 0.001, "rgba(50, 210, 150, 0)"); 
//             gradient.addColorStop(1, "rgba(50, 210, 150, 0)");
            
//             ctx.fillStyle = gradient;
//             ctx.fill();

//             // Draw the solid leading edge
//             ctx.beginPath();
//             ctx.moveTo(0, 0);
//             ctx.lineTo(radarLength, 0); 
//             ctx.setLineDash([]);
//             ctx.strokeStyle = "rgba(50, 210, 150, 1)";
//             ctx.lineWidth = 2;
//             ctx.stroke();

//             ctx.restore();

//             ctx.rotate(p.currentAngle);
//             ctx.fillStyle = "rgba(255, 255, 255, 1)";
//             ctx.fillRect(-2.5, -2.5, 5, 5); 
//             ctx.restore();
//         }

        
//         ctx.restore();
//     }


//     // Draw planets
//     for (let i = 0; i < planets.length; i++) {
//         let p = planets[i];

//         // Pathway from current planet to selected planet

//         if (p.hasShip) currentPlanet = p;
//         if (p.selected) selectedPlanet = p;

//         // Planet
//         ctx.save();
//         ctx.translate(500,500);
//         ctx.rotate(p.currentOrbitRotation);
//         ctx.fillStyle = p.color;
//         ctx.beginPath();
//         ctx.arc(p.orbitRadius, 0, p.radius*scale, 0, Math.PI*2, 1);
//         ctx.fill();

//         ringOffset = ringOffset - 0.2;

//         if (ringOffset < -6) {
//             ringOffset = 0;
//         }

//         if (p.selected) {
//             ctx.beginPath();
//             ctx.arc(p.orbitRadius, 0, p.radius*scale+3, 0, Math.PI*2, 1);
//             ctx.strokeStyle = "rgba(255,255,255,0.5";
//             ctx.lineWidth = 3;
//             ctx.lineDashOffset = ringOffset;
//             ctx.setLineDash([3,3]);
//             ctx.stroke();
//         }

//         // Ship
//         if (p.hasShip) {
//             ctx.translate(p.orbitRadius,0);
//             ctx.rotate(shipRotation - p.currentOrbitRotation);
//             ctx.fillStyle = "#FFFFFF";
//             ctx.fillRect(p.radius*scale+3, -2.5, 5, 5);
//         }

//         ctx.restore();

        
//     }

//     // Draw sun
//     ctx.fillStyle = "#FFE347";
//     ctx.beginPath();
//     ctx.arc(500, 500, 50, 0, Math.PI*2, 1);
//     ctx.fill();

//     for (let i = 0; i < planets.length; i++) {
//         let p = planets[i];

//         if (!p.unlocked && p.selected) {
//             ctx.save();
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             planetX = polarToCartesian(p.orbitRadius, p.currentOrbitRotation).x;
//             planetY = polarToCartesian(p.orbitRadius, p.currentOrbitRotation).y;
//             ctx.fillStyle = "rgba(255,255,255,0.5";
//             ctx.font = '400 20px "Silkscreen", sans-serif';
//             let text = p.landedProbes + "/" + p.neededProbes;
//             ctx.fillText(text, planetX, planetY + p.radius*scale+15);
//             ctx.restore();
//         }
//     }

//     ctx.restore();
// }


// Deploy probe
function deployProbeOLD() {

    price = 100;
    if (energy < price) return;
    energy -= price;
    // currentPlanet.drillCostMaterial = Math.floor(price * 1.2);
    // console.log(price)

    // 1. Identify the origin and target
    let origin = currentPlanet; 
    let target = planets.find(p => p.selected);

    console.log(target);

    if (origin && target) {
        // 2. Calculate the shortest angle difference (Delta Theta)
        let startAngle = origin.currentOrbitRotation % (Math.PI * 2);
        let endAngle = target.currentOrbitRotation % (Math.PI * 2);

        if (startAngle < 0) startAngle += Math.PI * 2;
        if (endAngle < 0) endAngle += Math.PI * 2;

        let diff = endAngle - startAngle;
        if (diff > Math.PI) diff -= Math.PI * 2;
        else if (diff < -Math.PI) diff += Math.PI * 2;

        // 3. Approximate the physical distance of the spiral path
        let dr = target.orbitRadius - origin.orbitRadius;
        let avgRadius = (origin.orbitRadius + target.orbitRadius) / 2;
        
        let pathDistance = Math.sqrt((dr * dr) + Math.pow(avgRadius * diff, 2));

        // 4. Define your desired constant speed (pixels per frame)
        let constantSpeed = 0.3; 
        
        // 5. Calculate the fractional speed for 't'
        // Avoid division by zero if planets are perfectly aligned
        let calculatedSpeed = pathDistance > 0 ? (constantSpeed / pathDistance) : 0.001;

        probes.push({
            probeProgress: 0,
            probeSpeed: calculatedSpeed, 
            originPlanet: origin,       
            targetPlanet: target,       
            currentAngle: origin.currentOrbitRotation, 
            currentRadius: origin.orbitRadius,  
            productionTimer: 0, 
            particles: [],  
        });
    }
}



// Deploying

function deploy() {
    price = currentPlanet.drillCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.drillCostMaterial = Math.floor(price * 1.2);

    currentPlanet.drills.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0,
        inwardsVelocity: currentPlanet.gravityFactor,
        arrived: false,
        materialStored: 0,
        productionTimer: 0,
        randomTimeOffset: Math.random() * 1000 - 500,
    });
}

function deployRefinery() {
    price = currentPlanet.refineryCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.refineryCostMaterial = Math.floor(price * 1.2);

    currentPlanet.refineries.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0,
        inwardsVelocity: 0.2,
        arrived: false,
        materialStored: 0,
        productionTimer: 0,
    });
}


function deployBundler() {
    price = currentPlanet.collectorCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.collectorCostMaterial = Math.floor(price * 1.1);

    currentPlanet.collectors.push({
        radius: flightRadius + 10,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,
    });
}

function deploySmartCollector() {
    price = currentPlanet.smartCollectorCostMaterial;
    if (material < price) return;
    material -= price;
    currentPlanet.smartCollectorCostMaterial = Math.floor(price * 1.1);

    currentPlanet.smartCollectors.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,
    });
}





function upgradeDrillRate() {
    if (crystal < drillRateUpgradeCost) return;
    crystal -= drillRateUpgradeCost;
    drillRateUpgradeCost = Math.floor(drillRateUpgradeCost * 1.5);

    drillProductionRate = drillProductionRate / 1.25;
    drillLevel++;
}

function upgradeCollectionLevel() {
    if (crystal < collectionRadiusUpgradeCost) return;
    crystal -= collectionRadiusUpgradeCost;
    collectionRadiusUpgradeCost = Math.floor(collectionRadiusUpgradeCost * 1.5);

    collectionRadius = collectionRadius * 1.1;
    collectionRadiusLevel++;
}

function upgradeBoostSpeedLevel() {
    if (crystal < boostSpeedUpgradeCost) return;
    crystal -= boostSpeedUpgradeCost;
    boostSpeedUpgradeCost = Math.floor(boostSpeedUpgradeCost * 1.5);

    boostSpeedAdd += 1;

    boostSpeedLevel++;
}

function upgradeMaterialValueLevel() {
    if (crystal < materialValueUpgradeCost) return;
    crystal -= materialValueUpgradeCost;
    materialValueUpgradeCost = Math.floor(materialValueUpgradeCost * 1.5);

    materialValue += 0.0025;

    materialValue = Math.round(materialValue * 10000) / 10000;

    materialValueLevel++;
}

function upgradeRefineChainLevel() {
    if (crystal < refineChainUpgradeCost) return;
    crystal -= refineChainUpgradeCost;
    refineChainUpgradeCost = Math.floor(refineChainUpgradeCost * 1.5);

    refineChainCount += 1;
    refineChainLevel++;
}

// Ship speed calculations

function changeShipSpeed(shipRadius) {
    // shipRotationSpeed = 43051*(flightRadius**(-2.843));
    return 43051*(shipRadius**(-2.843));
}








// --------- //
//  BUTTONS  //
// --------- //


function reset(element) {
    element.target.style.scale = "1";
    element.target.style.backgroundColor = "rgba(100,100,100,0.5)";
    element.target.style.boxShadow = "";
    element.target.style.textShadow = "";
}

function setRedGlow(element) {
    element.target.style.scale = "0.9";
    element.target.style.backgroundColor = "#EF233C";
    element.target.style.boxShadow = "0 0 6vw 0.1vw #EF233C";
    element.target.style.textShadow = "0 0 3vw #fff";
}

const riseButton = document.getElementById("riseButton");

riseButtonHeld = false;
riseButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  riseButtonHeld = true;
  setRedGlow(e);
});

riseButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  riseButtonHeld = false;
  reset(e);
});

riseButton.addEventListener('pointerleave', (e) => {
    if (riseButtonHeld) {
        riseButtonHeld = false;
        reset(e);
    }
});

riseButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

document.addEventListener('keydown', (e) => {
  if ((e.key === 'r' || e.key === 'R') && !e.repeat) {
    e.preventDefault();
    // Fires your existing 'pointerdown' listener directly on the element
    riseButton.dispatchEvent(new PointerEvent('pointerdown'));
  }

  if ((e.key === 'd' || e.key === 'D') && !e.repeat) {
    e.preventDefault();
    // Fires your existing 'pointerdown' listener directly on the element
    dropButton.dispatchEvent(new PointerEvent('pointerdown'));
  }

  if ((e.key === 'b' || e.key === 'B') && !e.repeat) {
    e.preventDefault();
    // Fires your existing 'pointerdown' listener directly on the element
    boostButton.dispatchEvent(new PointerEvent('pointerdown'));
  }

  if ((e.key === 'p' || e.key === 'P') && !e.repeat) {
    e.preventDefault();
    deployProbe(); 
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    // Fires your existing 'pointerup' listener directly on the element
    riseButton.dispatchEvent(new PointerEvent('pointerup'));
  }

  if ((e.key === 'd' || e.key === 'D') && !e.repeat) {
    e.preventDefault();
    // Fires your existing 'pointerdown' listener directly on the element
    dropButton.dispatchEvent(new PointerEvent('pointerup'));
  }

  if ((e.key === 'b' || e.key === 'B') && !e.repeat) {
    e.preventDefault();
    // Fires your existing 'pointerdown' listener directly on the element
    boostButton.dispatchEvent(new PointerEvent('pointerup'));
  }
});


const dropButton = document.getElementById("dropButton");

dropButtonHeld = false;
dropButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  dropButtonHeld = true;
  setRedGlow(e);
});

dropButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  dropButtonHeld = false;
  reset(e);
});

dropButton.addEventListener('pointerleave', (e) => {
    if (dropButtonHeld) {
        dropButtonHeld = false;
        reset(e);
    }
});



dropButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

// Boost Button
const boostButton = document.getElementById("boostButton");

boostButtonHeld = false;
boostButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  boostButtonHeld = true;
  setRedGlow(e);
});

boostButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  boostButtonHeld = false;
  reset(e);
});

boostButton.addEventListener('pointerleave', (e) => {
    if (boostButtonHeld) {
        boostButtonHeld = false;
        reset(e);
    }
});

boostButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


// Peek button
const peekButton = document.getElementById("planetSelectButton");
peeking = false;

peekButton.addEventListener('pointerdown', (event) => {

    setTimeout(() => {
        planetScene.visible = false;
        systemScene.visible = true;
    }, 200);
        
});

// Cancel Peek button
const cancelPeekButton = document.getElementById("cancelPeekButton");

cancelPeekButton.addEventListener('pointerdown', (event) => {
        setTimeout(() => {
            planetScene.visible = true;
            systemScene.visible = false;
            clearHelp();
        }, 200);
});

// Next planet button
document.getElementById("nextPlanetButton").addEventListener('pointerdown', (event) => {
    setTimeout(() => {
        for (let i = 0; i < planets.length; i++) {
            if (planets[i].selected) {
                planets[i].selected = false;

                let nextIndex = i;

                // keep moving forward until we find a valid planet
                do {
                    nextIndex = (nextIndex + 1) % planets.length;
                } while (planets[nextIndex].hasShip);

                planets[nextIndex].selected = true;
                // updateHelp(planets[nextIndex].description);
                break;
            }
        }
    }, 100);
});

// Previous planet button
document.getElementById("previousPlanetButton").addEventListener('pointerdown', (event) => {
    setTimeout(() => {
        for (let i = 0; i < planets.length; i++) {
            if (planets[i].selected) {
                planets[i].selected = false;

                let prevIndex = i;

                // keep moving backward until we find a valid planet
                do {
                    prevIndex = (prevIndex - 1 + planets.length) % planets.length;
                } while (planets[prevIndex].hasShip);

                planets[prevIndex].selected = true;
                // updateHelp(planets[prevIndex].description);
                break;
            }
        }
    }, 100);
});

function travelToSelectedPlanet() {

    // for (let s = 0; s < MAX_MATERIALS; s++) {
    //     materialSprites[s].alpha = 0;
    // }


    // Get rid of the ship where it currently is
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        // Get rid of the ship where it currently is
        if (p.hasShip) {
            p.hasShip = false;
            break;
        }
    }

    // Find selected planet and give it the ship
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];
        
        if (p.selected) {
            p.hasShip = true;
            p.selected = false;

            // Change the selected planet to the NEXT planet
            planets[i].selected = false;

            let nextIndex = i;

            // keep moving forward until we find a valid planet
            do {
                nextIndex = (nextIndex + 1) % planets.length;
            } while (planets[nextIndex].hasShip);

            planets[nextIndex].selected = true;

            // Put view back to planet view (for new planet)
            view = "planet";
            peeking = false;

            planetScene.visible = true;
            systemScene.visible = false;



            // Set the current global planet
            currentPlanet = planets[i];

            // Put menu back to normal
            oldActiveMenuID = activeMenu;
            activeMenu = "mainMenu";
            switchMenu(oldActiveMenuID, activeMenu);

            // setTimeout(() => {
            //     switchMenu(oldActiveMenuID, activeMenu);
            // }, 200);


            // Update graphics
            shadowGraphic.clear();
            shadowGraphic.beginFill(0x000000, 0.8);
            shadowGraphic.drawRect(0, -currentPlanet.radius, 4000, 2 * currentPlanet.radius);
            shadowGraphic.endFill();

            let hexColor = parseInt(currentPlanet.color.replace(/^#/, ''), 16);
            planetGraphic.clear();
            planetGraphic.beginFill(hexColor);
            planetGraphic.drawCircle(500, 500, currentPlanet.radius);
            planetGraphic.endFill();

            currentPlanet.graphics.addChild(systemShipPivot);

            break;
        }
    }
}


// Resource Labels

function flashMaterialLabel() {
    label = document.getElementById("materialLabel");
    label.style.setProperty(
        '--label-bg', 
        'linear-gradient(to right, rgba(46, 191, 165, 0.2), rgba(46, 191, 165, 0.1) 50%)'
    );

    // 2. Revert the variable back to transparent after 300 milliseconds
    setTimeout(() => {
        label.style.setProperty('--label-bg', 'linear-gradient(to right, rgba(46, 191, 165, 0.1), rgba(46, 191, 165, 0.1) 50%)');
    }, 300);
}



// All buttons
const buttons = document.querySelectorAll('button');

buttons.forEach(button => {

  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    });
});

// Red buttons
const redButtons = document.querySelectorAll('.redButton');

redButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    setRedGlow(event);

    setTimeout(() => {
        reset(event)
    }, 150);
    
  });

  button.addEventListener('pointerup', (event) => {
    
    
    
  });
});

// Blue buttons
const blueButtons = document.querySelectorAll('.blueButton');

blueButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    event.target.style.scale = "0.9";
    event.target.style.backgroundColor = "rgba(30,30,200,0.2)";
    
  });

  button.addEventListener('pointerup', (event) => {
    
    button.style.scale = "1";
    button.style.backgroundColor = "rgba(100,100,100,0.5)";
    
  });
});

// Tip button
const tipButtons = document.querySelectorAll('.tipButton');

tipButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    updateHelp();
    
  });

  button.addEventListener('pointerup', (event) => {
    
    clearHelp();
    
  });
});




// Toggle buttons
const toggleButtons = document.querySelectorAll('.toggleButton');

toggleButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    button.style.scale = "0.9";

    if (button.style.backgroundColor == "rgb(20, 204, 146)") {
        button.style.backgroundColor = "rgba(100,100,100,0.5)";
    } else {
        button.style.backgroundColor = "rgb(20, 204, 146)";
    }

  });

  button.addEventListener('pointerup', (event) => {
    
    button.style.scale = "1";
    
  });
});


// Reset current planet
function resetCurrentPlanet() {

    for (let c = 0; c < currentPlanet.drills.length; c++) {
        let p = currentPlanet.drills[c];
        p.graphic.destroy();
        p.pivot.destroy();
    }
    currentPlanet.drills = [];

    for (let c = 0; c < currentPlanet.materialsToCollect.length; c++) {
        let p = currentPlanet.materialsToCollect[c];
        p.graphic.destroy();
    }
    currentPlanet.materialsToCollect = [];

    for (let c = 0; c < currentPlanet.satellites.length; c++) {
        let p = currentPlanet.satellites[c];
        p.graphic.destroy();
        p.pivot.destroy();
    }
    currentPlanet.satellites = [];

    for (let c = 0; c < currentPlanet.collectors.length; c++) {
        let p = currentPlanet.collectors[c];
        p.graphic.destroy();
        p.pivot.destroy();
    }
    currentPlanet.collectors = [];

    for (let c = 0; c < currentPlanet.crystals.length; c++) {
        let p = currentPlanet.crystals[c];
        p.graphic.destroy();
    }
    currentPlanet.crystals = [];

    for (let c = 0; c < currentPlanet.comets.length; c++) {
        let p = currentPlanet.comets[c];
        p.graphic.destroy();
    }
    currentPlanet.comets = [];

    for (let c = 0; c < currentPlanet.laserSatellites.length; c++) {
        let p = currentPlanet.laserSatellites[c];
        p.graphic.destroy();
        p.pivot.destroy();
    }
    currentPlanet.laserSatellites = [];

    for (let c = 0; c < currentPlanet.refiners.length; c++) {
        let p = currentPlanet.refiners[c];
        p.graphic.destroy();
        p.pivot.destroy();
        p.arms.destroy();
    }
    currentPlanet.refiners = [];

    currentPlanet.drillCostMaterial = 5;
    currentPlanet.satelliteCostMaterial = 25;
    currentPlanet.collectorCostMaterial = 50;
    currentPlanet.laserSatelliteCostMaterial = 50;
    currentPlanet.refinerCostMaterial = 5000;
}


// Ship Colour
function changeShipColour() {
    currentShipColourIndex++;
    currentShipColourIndex = currentShipColourIndex % (shipColours.length);
    // console.log(currentShipColourIndex);
    shipGraphic.tint = shipColours[currentShipColourIndex];
}

resolutions = [0.25, 0.5, 1, 2];
resolutionNames = ["RETRO", "LOW", "NORMAL", "SHARP"]
antialiasOn = [false, true, true, true]
currentResolutionIndex = 3;
// Resolution
function changeResolution() {
    currentResolutionIndex++;
    currentResolutionIndex = currentResolutionIndex % resolutions.length
    app.renderer.resolution = resolutions[currentResolutionIndex];
    app.renderer.resize(app.screen.width, app.screen.height);
    document.getElementById("resolutionButton").innerHTML = `RESOLUTION<br>${resolutionNames[currentResolutionIndex]}`;
    app.renderer.antialias = antialiasOn[currentResolutionIndex];
}





// Menu switching
activeMenu = "mainMenu";
document.getElementById("deviceMenu").style.display = "none";
document.getElementById("deviceMenuTwo").style.display = "none";
document.getElementById("upgradeMenu").style.display = "none";
document.getElementById("planetSelectMenu").style.display = "none";
document.getElementById("settingsMenu").style.display = "none";
document.getElementById("statsMenu").style.display = "none";

function switchMenu(oldActiveMenuID, newActiveMenuID) {
    document.getElementById(oldActiveMenuID).style.display = "none";
    document.getElementById(newActiveMenuID).style.display = "flex";
}

const menuButtons = document.querySelectorAll('.menuButton');

menuButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    extractedId = button.id.toString().slice(0, -6) + "Menu";
    oldActiveMenuID = activeMenu;
    activeMenu = extractedId;

    menuFade();

    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);

    
    
  });
});


function menuFade() {
    setTimeout(() => {
        // buttons.forEach(currentbutton => {
        // currentbutton.style.opacity = "0";
        document.getElementById("disapearingDiv").style.opacity = "0";
    // });
    }, 100);
    

    setTimeout(() => {
        // buttons.forEach(currentbutton => {
        // currentbutton.style.opacity = "1";
        // });
        document.getElementById("disapearingDiv").style.opacity = "1";
    }, 250);
}

const returnButtons = document.querySelectorAll('.returnButton');

returnButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "mainMenu";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});

acceptingInput = true;
const deviceMenuTwoButton = document.querySelectorAll('.deviceMenuTwoButton');

deviceMenuTwoButton.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "deviceMenuTwo";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});

const deviceMenuOneButton = document.querySelectorAll('.deviceMenuOneButton');

deviceMenuOneButton.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "deviceMenu";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});



function updateLabels() {
    // DEPLOY
    document.getElementById("drillCostMaterial").textContent = formatNumber(currentPlanet.drillCostMaterial);
    document.getElementById("satelliteCostMaterial").textContent = formatNumber(currentPlanet.satelliteCostMaterial);
    document.getElementById("collectorCostMaterial").textContent = formatNumber(currentPlanet.collectorCostMaterial);
    document.getElementById("laserSatelliteCostMaterial").textContent = formatNumber(currentPlanet.laserSatelliteCostMaterial);
    document.getElementById("refinerCostMaterial").innerHTML = formatNumber(currentPlanet.refinerCostMaterial);
    // document.getElementById("smartCollectorCostMaterial").innerHTML = formatNumber(currentPlanet.smartCollectorCostMaterial);
    

    // UPGRADES
    document.getElementById("drillRateUpgradeCost").textContent = formatNumber(drillRateUpgradeCost);
    document.getElementById("drillLevel").textContent = "" + formatNumber(drillLevel).toString();

    document.getElementById("collectionRadiusUpgradeCost").textContent = formatNumber(collectionRadiusUpgradeCost);
    document.getElementById("collectionRadiusLevel").textContent = "" + formatNumber(collectionRadiusLevel).toString();

    document.getElementById("boostSpeedUpgradeCost").textContent = formatNumber(boostSpeedUpgradeCost);
    document.getElementById("boostSpeedLevel").textContent = "" + formatNumber(boostSpeedLevel).toString();

    document.getElementById("materialValueUpgradeCost").textContent = formatNumber(materialValueUpgradeCost);
    document.getElementById("materialValueLevel").textContent = "" + formatNumber(materialValueLevel).toString();
}




const holdButtons = document.querySelectorAll('.holdButton');
const HOLD_DURATION = 750;

holdButtons.forEach(button => {
    let animationFrameId;
    let startTime;
    // let defaultText = button.innerHTML;

    // Function to completely reset the button state and stop the loop
    const resetBar = () => {
        cancelAnimationFrame(animationFrameId);
        button.style.background = ""; // Resets to the default CSS background
        button.style.scale = "1";
        button.style.boxShadow = "";
        button.style.textShadow = "";
        button.style.zIndex = "";
        svg = button.querySelector("svg");
        if (svg) svg.style.filter = "";
        // button.innerHTML = defaultText;
        
        // updating = true;
        updateLabels();
    };

    // The animation loop that runs every frame while held
    const updateBar = (timestamp) => {
        // Set the start time on the very first frame
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        let holdPercentage = (elapsed / HOLD_DURATION) * 100;


        // If the user has held for the full 3 seconds (100%+)
        if (holdPercentage >= 100) {
            

            if (button.id == "drill") {
                deployDrill();
            } else if (button.id == "satellite") {
                deploySatellite();
            } else if (button.id == "collector") {
                deployCollector();
            } else if (button.id == "laserSatellite") {
                deployLaser();
            } else if (button.id == "refiner") {
                deployRefiner();
            } else if (button.id == "smartCollector") {
                deploySmartCollector();
            } else if (button.id == "drillRate") {
                upgradeDrillRate();
            } else if (button.id == "collectionRadiusUpgrade") {
                upgradeCollectionLevel();
            } else if (button.id == "boostSpeedUpgrade") {
                upgradeBoostSpeedLevel();
            } else if (button.id == "materialValue") {
                upgradeMaterialValueLevel();
            } else if (button.id == "resetButton") {
                localStorage.removeItem("space_game_save");
                window.location.reload();
                return;
            } else if (button.id == "resetPlanetButton") {
                resetCurrentPlanet();
            } else if (button.id == "resetMaterialButton") {
                material = 0;
            }else if (button.id == "shipColourButton") {
                changeShipColour();
            } else if (button.id == "resolutionButton") {
                changeResolution();
            } else if (button.id == "travelButton") {
                clearHelp();
                travelToSelectedPlanet();
            } else if (button.id == "unlockButton") {
                deployProbe();
            }

            resetBar();
            return; // Exit the loop so it doesn't keep running
        }

        updating = false;

        button.style.scale = "0.9";
        button.style.zIndex = "1000";
        // button.target.style.backgroundColor = "#EF233C";
        button.style.boxShadow = "0 0 8vw 0.1vw #3083DC";
        button.style.textShadow = "0 0 3vw #fff";

        svg = button.querySelector("svg");
        if (svg) svg.style.filter = "drop-shadow(0 0 2.5vw #fff)";


        // Apply the gradient visually using template literals for cleaner syntax
        button.style.backgroundImage = `linear-gradient(to right, #96c4f6 0%, #96c4f6 ${holdPercentage}%, #3083DC ${holdPercentage}%, #3083DC 100%)`;
        // button.style.backgroundImage = `linear-gradient(to right, #3083DC 0%, #3083DC ${holdPercentage}%, #222222 ${holdPercentage}%, #222222 100%)`;


        // Loop the function for the next frame
        animationFrameId = requestAnimationFrame(updateBar);
    };

    // When the user presses down
    button.addEventListener('pointerdown', (event) => {
        startTime = null; // Reset the timer
        animationFrameId = requestAnimationFrame(updateBar);
    });

    // When the user lets go
    button.addEventListener('pointerup', resetBar);

    // Cancel if the cursor drags off the button or the system interrupts the touch
    button.addEventListener('pointerleave', resetBar);
    button.addEventListener('pointercancel', resetBar);
});


// Text formatting
function formatNumber(num) {
  const suffixes = ['', 'k', 'm', 'b', 't'];
  let suffixIndex = 0;

  // Scale the number down by 1000s until it's under 1000
  // or we run out of suffixes
  while (num >= 1000 && suffixIndex < suffixes.length - 1) {
    num /= 1000;
    suffixIndex++;
  }

  // Handle formatting based on the size of the resulting number
  if (num >= 100 || suffixIndex === 0) {
    // No decimals needed if it's already 3 digits or under 1000
    return Math.floor(num) + suffixes[suffixIndex];
  } else if (num >= 10) {
    // e.g., 28.1m (3 total digits)
    return num.toFixed(1).replace(/\.0$/, '') + suffixes[suffixIndex];
  } else {
    // e.g., 1.56k (3 total digits)
    return num.toFixed(2).replace(/\.?0+$/, '') + suffixes[suffixIndex];
  }
}


// Info help
let helpNumber = 0;
document.getElementById("tipsContainer").style.visibility = "hidden";

let help = [
    "Welcome to DEBRIS!",
    "Drills mine minerals from the planet and shoot them to space.",
    "Use the RISE and DROP controls to fly around and collect minerals.",
    "The closer your orbit, the faster you circle the planet.",
    "Materials increase in value as they oxidise in space.",
    "Satellites use solar panels to harvest energy.",
    "Fly near a satellite to collect its energy."
]

function updateHelp(text) {
    document.getElementById("tipsContainer").style.visibility = "visible";
    document.getElementById("tips").textContent = text;
    helpNumber++;
    if (helpNumber == 7) helpNumber = 0;
}

function clearHelp() {
    document.getElementById("tipsContainer").style.visibility = "hidden";
}


function updateLevel(parent) {
//   const parent = document.getElementById(parentId);


  const immediateChildren = parent.querySelectorAll(':scope #level');

  immediateChildren.forEach(child => {
    oldLevel = child.textContent;
    oldLevel = parseInt(oldLevel.at(-1));
    newLevel = oldLevel + 1;
    child.textContent = "LVL " + newLevel.toString();
  });
}



function saveGame() {
    // 1. Explicitly map ONLY the primitive data to avoid the 5MB LocalStorage limit
    const planetsToSave = planets.map(p => {
        
        let cleanMaterials = (p.materialsToCollect || []).map(c => { let clone = {...c}; delete clone.graphic; return clone; });
        let cleanComets = (p.comets || []).map(c => { let clone = {...c}; delete clone.graphic; return clone; });
        let cleanDrills = (p.drills || []).map(d => { let clone = {...d}; delete clone.pivot; delete clone.graphic; return clone; });
        let cleanSatellites = (p.satellites || []).map(s => { let clone = {...s}; delete clone.pivot; delete clone.graphic; return clone; });
        let cleanCollectors = (p.collectors || []).map(c => { let clone = {...c}; delete clone.pivot; delete clone.graphic; return clone; });
        let cleanRefiners = (p.refiners || []).map(c => { let clone = {...c}; delete clone.pivot; delete clone.graphic; delete clone.arms; return clone; });
        let cleanLasers = (p.laserSatellites || []).map(ls => { let clone = {...ls}; delete clone.pivot; delete clone.graphic; return clone; });
        let cleanCrystals = (p.crystals || []).map(c => { let clone = {...c}; delete clone.graphic; return clone; });

        // --- OPTIMIZED SLICE FOR ACTIVE MATERIALS ---
        // Slices the typed arrays perfectly up to the active count pointer
        // const count = p.materials.count;
        // const materialsSnapshot = {
        //     count: count,
        //     radius: Array.from(p.materials.radius.subarray(0, count)),
        //     angle: Array.from(p.materials.angle.subarray(0, count)),
        //     rotation: Array.from(p.materials.rotation.subarray(0, count)),
        //     radiusChange: Array.from(p.materials.radiusChange.subarray(0, count)),
        //     timeInTractorBeam: Array.from(p.materials.timeInTractorBeam.subarray(0, count)),
        //     value: Array.from(p.materials.value.subarray(0, count)),
        //     alpha: Array.from(p.materials.alpha.subarray(0, count)),
        //     refined: Array.from(p.materials.refined.subarray(0, count)),
        //     isTargeted: Array.from(p.materials.isTargeted.subarray(0, count))
        // };

        return {
            name: p.name,
            orbitRadius: p.orbitRadius,
            currentOrbitRotation: p.currentOrbitRotation,
            orbitSpeed: p.orbitSpeed,
            radius: p.radius,
            hasShip: p.hasShip,
            selected: p.selected,
            unlocked: p.unlocked,
            landedProbes: p.landedProbes,

            drillCostMaterial: p.drillCostMaterial,
            satelliteCostMaterial: p.satelliteCostMaterial,
            collectorCostMaterial: p.collectorCostMaterial,
            laserSatelliteCostMaterial: p.laserSatelliteCostMaterial,
            refinerCostMaterial: p.refinerCostMaterial,
            smartCollectorCostMaterial: p.smartCollectorCostMaterial,

            materialsToCollect: cleanMaterials,
            comets: cleanComets,
            drills: cleanDrills,
            satellites: cleanSatellites,
            collectors: cleanCollectors,
            refiners: cleanRefiners,
            smartCollectors: p.smartCollectors || [], 
            laserSatellites: cleanLasers,
            crystals: cleanCrystals,
            bundles: p.bundles || [],
        };
    });

    // 2. Clean Probes
    const cleanProbes = probes.map(p => {
        return {
            probeProgress: p.probeProgress,
            probeSpeed: p.probeSpeed,
            currentAngle: p.currentAngle,
            currentRadius: p.currentRadius,
            productionTimer: p.productionTimer,
            originPlanetName: p.originPlanet ? p.originPlanet.name : null,
            targetPlanetName: p.targetPlanet ? p.targetPlanet.name : null
        };
    });

    // 3. Assemble State
    const gameState = {
        energy, material, crystal, flightRadius, targetRadius, shipRotation,
        drillRateUpgradeCost, collectionRadiusUpgradeCost, drillProductionRate,
        drillLevel, collectionRadius, collectionRadiusLevel, currentShipColourIndex,
        boostSpeedLevel, boostSpeedAdd, boostSpeedUpgradeCost, 
        materialValue, materialValueLevel, materialValueUpgradeCost,
        planets: planetsToSave,
        probes: cleanProbes
    };

    // 4. Save with Error Catching
    try {
        localStorage.setItem("space_game_save", JSON.stringify(gameState));
    } catch (error) {
        console.error("DEBRIS SAVE ERROR: Failed to save game to localStorage.", error);
    }
}

function loadGame() {
    const savedData = localStorage.getItem("space_game_save");
    if (!savedData) return;

    const state = JSON.parse(savedData);

    // 1. Restore global variables
    energy = state.energy;
    material = state.material;
    crystal = state.crystal;
    flightRadius = state.flightRadius;
    targetRadius = state.targetRadius;
    shipRotation = state.shipRotation;
    drillRateUpgradeCost = state.drillRateUpgradeCost;
    collectionRadiusUpgradeCost = state.collectionRadiusUpgradeCost;

    drillProductionRate = state.drillProductionRate;
    drillLevel = state.drillLevel;
    collectionRadius = state.collectionRadius;
    collectionRadiusLevel = state.collectionRadiusLevel;
    boostSpeedLevel = state.boostSpeedLevel !== undefined ? state.boostSpeedLevel : 1;
    boostSpeedAdd = state.boostSpeedAdd !== undefined ? state.boostSpeedAdd : 5;
    boostSpeedUpgradeCost = state.boostSpeedUpgradeCost !== undefined ? state.boostSpeedUpgradeCost : 10;

    materialValue = state.materialValue !== undefined ? state.materialValue : 1.005;
    materialValueLevel = state.materialValueLevel !== undefined ? state.materialValueLevel : 1;
    materialValueUpgradeCost = state.materialValueUpgradeCost !== undefined ? state.materialValueUpgradeCost : 10;

    currentShipColourIndex = state.currentShipColourIndex;

    probeParticles = []; // Clear visual trails on load


    // 2. Reconstruct Planets
    state.planets.forEach(savedPlanet => {
        let p = planets.find(pl => pl.name === savedPlanet.name);
        if (!p) return; 

        p.orbitRadius = savedPlanet.orbitRadius;
        p.currentOrbitRotation = savedPlanet.currentOrbitRotation;
        p.orbitSpeed = savedPlanet.orbitSpeed;
        p.radius = savedPlanet.radius;
        p.hasShip = savedPlanet.hasShip;
        p.selected = savedPlanet.selected;
        p.unlocked = savedPlanet.unlocked;
        p.landedProbes = savedPlanet.landedProbes;

        if (savedPlanet.drillCostMaterial !== undefined) p.drillCostMaterial = savedPlanet.drillCostMaterial;
        if (savedPlanet.satelliteCostMaterial !== undefined) p.satelliteCostMaterial = savedPlanet.satelliteCostMaterial;
        if (savedPlanet.collectorCostMaterial !== undefined) p.collectorCostMaterial = savedPlanet.collectorCostMaterial;
        if (savedPlanet.laserSatelliteCostMaterial !== undefined) p.laserSatelliteCostMaterial = savedPlanet.laserSatelliteCostMaterial;
        if (savedPlanet.refinerCostMaterial !== undefined) p.refinerCostMaterial = savedPlanet.refinerCostMaterial;
        if (savedPlanet.smartCollectorCostMaterial !== undefined) p.smartCollectorCostMaterial = savedPlanet.smartCollectorCostMaterial;

        // Materials
        p.materialsToCollect = (savedPlanet.materialsToCollect || []).map(d => {
            if (d.refined) newMaterialGraphic = new PIXI.Sprite(bigMaterialTexture);
            if (!d.refined) newMaterialGraphic = new PIXI.Sprite(materialTexture);
            newMaterialGraphic.anchor.set(0.5);
            newMaterialGraphic.position.set(d.x, d.y);
            materialContainer.addChild(newMaterialGraphic);

            d.graphic = newMaterialGraphic;
            return d;
        });

        // Drills
        p.drills = (savedPlanet.drills || []).map(d => {
            const drillPivot = new PIXI.Container();
            drillPivot.position.set(500, 500);
            const drillGraphic = new PIXI.Graphics();
            drillGraphic.beginFill(0xFFFFFF);
            drillGraphic.drawRect(0, -5, 10, 10);
            drillGraphic.endFill();
            drillPivot.addChild(drillGraphic);
            planetScene.addChild(drillPivot);

            d.pivot = drillPivot;
            d.graphic = drillGraphic;
            return d;
        });

        // Satellites
        p.satellites = (savedPlanet.satellites || []).map(s => {
            const satellitePivot = new PIXI.Container();
            satellitePivot.position.set(500, 500);
            const satelliteGraphic = new PIXI.Graphics();
            const satelliteSize = 20;
            satelliteGraphic.beginFill(0xFFFFFF);
            satelliteGraphic.drawRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2);
            satelliteGraphic.endFill();
            satelliteGraphic.beginFill(0xFFFFFF);
            satelliteGraphic.drawCircle(0, 0, satelliteSize/2);
            satelliteGraphic.endFill();
            satellitePivot.addChild(satelliteGraphic);
            planetScene.addChild(satellitePivot);

            s.pivot = satellitePivot;
            s.graphic = satelliteGraphic;
            return s;
        });

        // Collectors
        p.collectors = (savedPlanet.collectors || []).map(c => {
            const collectorPivot = new PIXI.Container();
            collectorPivot.position.set(500, 500);
            const collectorGraphic = new PIXI.Graphics();
            const collectorsize = 20;
            const wingSize = 15;
            collectorGraphic.beginFill(0xFFFFFF);
            collectorGraphic.drawRect(-(collectorsize/2), -(collectorsize/2), collectorsize, collectorsize);
            collectorGraphic.endFill();
            collectorGraphic.lineStyle(5, 0xffffff);
            collectorGraphic.moveTo(wingSize, -(wingSize));
            collectorGraphic.lineTo(-wingSize,wingSize);
            collectorGraphic.moveTo(-wingSize, -wingSize);
            collectorGraphic.lineTo(wingSize,wingSize);
            collectorPivot.addChild(collectorGraphic);
            planetScene.addChild(collectorPivot);

            c.pivot = collectorPivot;
            c.graphic = collectorGraphic;
            return c;
        });

        // Refiners
        p.refiners = (savedPlanet.refiners || []).map(c => {
            const refinerPivot = new PIXI.Container();
            refinerPivot.position.set(500, 500);

            const refinerGraphic = new PIXI.Graphics();
            const refinerGraphicArms = new PIXI.Graphics();

            // Configuration Parameters
            const circleRadius = 10; // Define the center circle size
            const lineLength = 17.5; // Total length of the main radiating lines (L)
            const crossbarWidth = 12.5; // Total width of the T crossbar (C)
            const lineColor = 0xFFFFFF; // White
            const lineThickness = 4;

            // Define the angles for 120-degree spacing
            const angles = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];

            // 1. Draw the central circle
            refinerGraphic.beginFill(lineColor);
            refinerGraphic.drawCircle(0, 0, circleRadius);
            refinerGraphic.endFill();

            // Set line style for lines and crossbars
            refinerGraphicArms.lineStyle(lineThickness, lineColor);

            angles.forEach((angle) => {
                // 2. Draw the main radiating lines (from center to end of L)
                const endX = Math.cos(angle) * lineLength;
                const endY = Math.sin(angle) * lineLength;
                refinerGraphicArms.moveTo(0, 0);
                refinerGraphicArms.lineTo(endX, endY);

                // 3. Draw the T crossbars
                // To be perpendicular to the line, the crossbar angle is shifted by 90 degrees (PI/2)
                const crossbarAngle = angle + Math.PI / 2;
                const halfC = crossbarWidth / 2;

                const c1X = endX + Math.cos(crossbarAngle) * halfC;
                const c1Y = endY + Math.sin(crossbarAngle) * halfC;
                const c2X = endX - Math.cos(crossbarAngle) * halfC;
                const c2Y = endY - Math.sin(crossbarAngle) * halfC;

                refinerGraphicArms.moveTo(c1X, c1Y);
                refinerGraphicArms.lineTo(c2X, c2Y);
            });
            

            refinerGraphic.addChild(refinerGraphicArms);
            refinerPivot.addChild(refinerGraphic);
            planetScene.addChild(refinerPivot);

            c.pivot = refinerPivot;
            c.graphic = refinerGraphic;
            c.arms = refinerGraphicArms;
            return c;
        });
        

        // Lasers
        p.laserSatellites = (savedPlanet.laserSatellites || []).map(ls => {
            const laserPivot = new PIXI.Container();
            laserPivot.position.set(500, 500);
            const laserGraphic = new PIXI.Graphics();
            const satelliteSize = 15;
            laserGraphic.beginFill(0xFFFFFF);
            laserGraphic.drawRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2);
            laserGraphic.drawRect(-satelliteSize, -satelliteSize/2, satelliteSize, satelliteSize);
            laserGraphic.arc(satelliteSize/2,0,satelliteSize/2, toRadians(90), toRadians(270));
            laserGraphic.endFill();
            laserPivot.addChild(laserGraphic);
            planetScene.addChild(laserPivot);

            ls.pivot = laserPivot;
            ls.graphic = laserGraphic;
            return ls;
        });

        // Comets
        p.comets = (savedPlanet.comets || []).map(c => {
            // 1. Create a Sprite matching the spawnComet logic
            const cometGraphic = new PIXI.Sprite(cometTexture);
            cometGraphic.anchor.set(0.5);
            cometGraphic.position.set(c.currentX, c.currentY);
            
            // 2. Restore saved rotation state
            if (c.rotation !== undefined) {
                cometGraphic.rotation = c.rotation;
            }

            // 3. Match the visibility behavior from spawnComet
            cometGraphic.visible = false; // Hide if not currently viewing the planet

            planetScene.addChild(cometGraphic);

            // 4. Reattach the new sprite to the loaded comet object
            c.graphic = cometGraphic;
            return c;
        });

        // Crystals
        p.crystals = (savedPlanet.crystals || []).map(c => {
            const crystalGraphic = new PIXI.Graphics();
            crystalGraphic.beginFill(0xd336f2);
            crystalGraphic.drawRect(-8, -8, 16, 16);
            crystalGraphic.endFill();
            let pos = polarToCartesian(c.radius, c.angle);
            crystalGraphic.position.set(pos.x, pos.y);
            planetScene.addChild(crystalGraphic);

            c.graphic = crystalGraphic;
            return c;
        });

        p.smartCollectors = savedPlanet.smartCollectors || [];
        p.bundles = savedPlanet.bundles || [];
    });


    // 3. Reconstruct Probes
    probes = (state.probes || []).map(savedProbe => {
        const origin = planets.find(pl => pl.name === savedProbe.originPlanetName);
        const target = planets.find(pl => pl.name === savedProbe.targetPlanetName);

        const probeGraphic = new PIXI.Graphics();
        probeGraphic.beginFill(0xFFFFFF);
        probeGraphic.drawRect(-4, -4, 8, 8);
        probeGraphic.endFill();
        
        probeLayer.addChild(probeGraphic);

        return {
            probeProgress: savedProbe.probeProgress,
            probeSpeed: savedProbe.probeSpeed,
            currentAngle: savedProbe.currentAngle,
            currentRadius: savedProbe.currentRadius,
            productionTimer: savedProbe.productionTimer,
            originPlanet: origin,
            targetPlanet: target,
            particles: [],
            graphic: probeGraphic
        };
    });

    currentPlanet = planets.find(p => p.hasShip) || planets[1];
}

loadGame();
drawPlanetAndShadow();
updateLabels();

currentPlanet.graphics.addChild(systemShipPivot);
shipGraphic.tint = shipColours[currentShipColourIndex];