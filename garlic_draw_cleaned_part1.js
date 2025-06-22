
let garlicData, lengthRawData, greenAreaData, totalAreaData, phaseDataRaw, phaseData;
let lengthByDate = {};
let keys = [];
let dayIndex = 0;
let playing = true;
let baseY;
let maxLai = 0;
let reachedMaxLai = false;

let startInput, endInput, speedSelect, yearSelect, playPauseButton, resetButton;
let startDay = 0, endDay = 0;

function preload() {
    garlicData = loadJSON("garlic_output.json");
    lengthRawData = loadJSON("lengthData.json");
    greenAreaData = loadJSON("green_area.json");
    totalAreaData = loadJSON("area.json");
    phaseDataRaw = loadJSON("development_phase.json");
}

function setup() {
    createCanvas(600, 800);
    baseY = height * 0.5;
    frameRate(10);

    phaseData = {};
    for (let entry of phaseDataRaw) {
        let dateStr = entry.time.split("T")[0];
        phaseData[dateStr] = entry.development_phase;
    }

    for (let key in lengthRawData) {
        const entry = lengthRawData[key];
        const dateStr = entry.time.split("T")[0];
        let leaves = [];
        for (let i = 1; i <= 10; i++) {
            leaves.push(Number(entry[i]) || 0);
        }
        lengthByDate[dateStr] = leaves;
    }

    keys = Object.keys(garlicData);
    endDay = keys.length - 1;

    yearSelect = select('#yearSelect');
    startInput = select('#startDate');
    endInput = select('#endDate');
    playPauseButton = select('#playPauseBtn');
    resetButton = select('#resetBtn');
    speedSelect = select('#speedSelect');

    yearSelect.changed(() => {
        year = yearSelect.value();
        let file = `${jsonPrefix}${year}.json`;
        loadJSON(file, (data) => {
            garlicData = data;
            keys = Object.keys(garlicData);
            startDay = 0;
            endDay = keys.length - 1;
            dayIndex = startDay;
            maxLai = 0;
            reachedMaxLai = false;
            startInput.value(garlicData[keys[0]].date);
            endInput.value(garlicData[keys[keys.length - 1]].date);
        });
    });

    startInput.changed(updateRange);
    endInput.changed(updateRange);
    playPauseButton.mousePressed(togglePlay);
    resetButton.mousePressed(resetAll);
    speedSelect.changed(() => {
        frameRate(Number(speedSelect.value()));
    });
}

function updateRange() {
    const sDate = startInput.value();
    const eDate = endInput.value();
    const sIdx = keys.findIndex(k => garlicData[k].date === sDate);
    const eIdx = keys.findIndex(k => garlicData[k].date === eDate);
    if (sIdx >= 0) startDay = sIdx;
    if (eIdx >= 0) endDay = eIdx;
    dayIndex = startDay;
}

function togglePlay() {
    playing = !playing;
    if (playing) {
        loop();
        playPauseButton.html("⏸ Pause");
    } else {
        noLoop();
        playPauseButton.html("▶ Play");
    }
}

function resetAll() {
    startDay = 0;
    endDay = keys.length - 1;
    dayIndex = 0;
    maxLai = 0;
    reachedMaxLai = false;
    startInput.value(garlicData[keys[0]].date);
    endInput.value(garlicData[keys[keys.length - 1]].date);
}
