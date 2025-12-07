let mic;
let fft;
let isStarted = false;

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('sketch-container');

    mic = new p5.AudioIn();

    // 2048 bins gives good resolution for all modes
    fft = new p5.FFT(0.8, 2048);
    fft.setInput(mic);

    let pauseBtn = select('#pause-btn');
    if (pauseBtn) {
        pauseBtn.mousePressed(toggleLoopState);
    }
}

function draw() {
    background(10, 15, 10, 255);

    // Always draw grid first
    drawGrid();

    // Common Styles
    noFill();
    stroke(0, 255, 136);
    strokeWeight(2);

    // Center the origin for easier math in all modes
    translate(width / 2, height / 2);

    if (!isStarted) return; // Don't draw wave if not started

    let waveform = fft.waveform();

    // Get UI values
    let mode = select('#viz-mode') ? select('#viz-mode').value() : 'linear';
    let sensSlider = select('#sensitivity');
    let phaseSlider = select('#phase');

    let sensitivity = sensSlider ? sensSlider.value() : 5;
    let phaseShift = phaseSlider ? parseInt(phaseSlider.value()) : 50;

    // Switch between modes
    if (mode === 'vector') {
        drawVector(waveform, sensitivity, phaseShift);
    } else if (mode === 'radial') {
        drawRadial(waveform, sensitivity);
    } else {
        drawLinear(waveform, sensitivity);
    }
}

// ---------------------------------------------------------
// MODE 1: LINEAR (Classic Oscilloscope)
// ---------------------------------------------------------
function drawLinear(waveform, sensitivity) {
    beginShape();
    // Start at left (-width/2) and go to right (+width/2)
    for (let i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, -width / 2, width / 2);
        let y = map(waveform[i] * sensitivity, -1, 1, height / 2, -height / 2);
        vertex(x, y);
    }
    endShape();
}

// ---------------------------------------------------------
// MODE 2: RADIAL (Circular Waveform)
// ---------------------------------------------------------
function drawRadial(waveform, sensitivity) {
    beginShape();
    // Connect end to start
    for (let i = 0; i < waveform.length; i++) {
        let angle = map(i, 0, waveform.length, 0, TWO_PI);
        let rad = map(waveform[i] * sensitivity, -1, 1, 150, 450); // Base radius 150

        // Polar to Cartesian
        let x = rad * cos(angle);
        let y = rad * sin(angle);

        vertex(x, y);
    }
    endShape(CLOSE);
}

// ---------------------------------------------------------
// MODE 3: VECTOR (Lissajous / Phase Scope)
// ---------------------------------------------------------
function drawVector(waveform, sensitivity, phaseShift) {
    beginShape();
    for (let i = 0; i < waveform.length - phaseShift; i++) {
        let xVal = waveform[i];
        let yVal = waveform[i + phaseShift];

        // Fixed Mapping: Map -1..1 to -Screen..+Screen
        // This puts 0 at the center (0,0)
        let x = map(xVal * sensitivity, -1, 1, -width / 2, width / 2);
        let y = map(yVal * sensitivity, -1, 1, -height / 2, height / 2); // Inverted Y for standard Cartesian or standard? p5 is y-down.
        // Let's standard y-down for simplicity, centering is key.

        vertex(x, y);
    }
    endShape();
}


function drawGrid() {
    // We are drawing grid BEFORE translation in draw(), so 0,0 is top-left here?
    // Wait, draw() calls translate. 
    // To keep it simple, let's just draw grid relative to top-left (0,0) knowing translate happens visually later?
    // NO, p5 transforms stack.
    // If I put drawGrid() at start of draw(), translate hasn't happened. Perfect.

    stroke(0, 255, 136, 20);
    strokeWeight(1);

    line(0, height / 2, width, height / 2); // Horiz center
    line(width / 2, 0, width / 2, height); // Vert center

    noFill();
    ellipse(width / 2, height / 2, 300, 300); // 150 radius helper
}

function toggleLoopState() {
    if (!isStarted) return;

    if (isLooping()) {
        noLoop();
        let btn = select('#pause-btn');
        if (btn) btn.html('Resume');
    } else {
        loop();
        let btn = select('#pause-btn');
        if (btn) btn.html('Pause');
    }
}

function mousePressed() {
    // Only handle global click if not started
    if (!isStarted) {
        userStartAudio();
        mic.start();
        isStarted = true;

        let overlay = select('.overlay');
        if (overlay) overlay.style('opacity', '0');
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
