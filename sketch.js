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
let timelineSlider, currentDateLabel;


function preload() {
    garlicData = loadJSON("garlic_output.json");
    lengthRawData = loadJSON("lengthData.json");
    greenAreaData = loadJSON("green_area.json");
    totalAreaData = loadJSON("area.json");
    phaseDataRaw = loadJSON("development_phase.json");
}

// 날짜 키 유효성 검사 및 정리
function cleanDateKeys(data, label = "데이터") {
    const cleaned = {};
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    for (let key in data) {
        if (dateRegex.test(key)) {
            cleaned[key] = data[key];
        } else {
            // console.warn(`⚠️ 잘못된 키 제거 (${label}):`, key);
        }
    }
    return cleaned;
}

// garlicData 기준 날짜만 남기기
function syncDateKeysToGarlicFormat(rawData, referenceDates, label = "데이터") {
    const synced = {};
    for (let key in rawData) {
        if (!referenceDates.includes(key)) {
            // console.warn(`⚠️ garlicData에 없는 날짜 (${label}):`, key);
            continue;
        }
        synced[key] = rawData[key];
    }
    return synced;
}

function setup() {
    createCanvas(600, 800);
    baseY = height * 0.5;
    frameRate(10);

    greenAreaData = cleanDateKeys(greenAreaData, "green_area");
    totalAreaData = cleanDateKeys(totalAreaData, "area");

    const referenceDates = Object.keys(garlicData);
    greenAreaData = syncDateKeysToGarlicFormat(greenAreaData, referenceDates);
    totalAreaData = syncDateKeysToGarlicFormat(totalAreaData, referenceDates);

    phaseData = {};
    let rawArray = Object.values(phaseDataRaw);
    for (let entry of rawArray) {
        let dateStr = entry.time.split("T")[0];
        phaseData[dateStr] = entry["pheno.development_phase"];
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

    timelineSlider = select('#timelineSlider');
    timelineSlider.attribute('max', keys.length - 1);
    timelineSlider.input(() => {
        dayIndex = int(timelineSlider.value());
    });



    // 나머지 UI 요소
    startInput = select('#startDate');
    endInput = select('#endDate');
    playPauseButton = select('#playPauseBtn');
    resetButton = select('#resetBtn');
    speedSelect = select('#speedSelect');

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

function draw() {
    const data = garlicData[keys[dayIndex]];
    const lai = Number(data["LAI"]) || 0;
    const bulb = parseFloat(data["bulb_mass"]) || 0;
    const rootMass = parseFloat(data["root_mass"]) || 0;
    const rootCarbon = parseFloat(data["root_carbon"]) || 0;
    const rawDate = data["date"] || "Unknown";
    const date = rawDate.split("T")[0];

    // 생육 단계 색상
    let stage = phaseData[date] || "Unknown";
    if (stage === "seed") background(250, 245, 230);
    else if (stage === "vegetative") background(220, 250, 220);
    else if (stage === "bulb_growth_before_scape_appearance") background(255, 248, 200);
    else if (stage === "bulb_growth_after_scape_appearance") background(255, 228, 210);
    else background(250);

    stroke(139, 69, 19);
    strokeWeight(2);
    line(0, baseY, width, baseY);

    const bulbSize = bulb > 0 ? sqrt(bulb) * 10 : 0;
    const bulbRadius = bulbSize / 2;
    const bulbCenterY = baseY + bulbRadius;
    const stalkY = bulbCenterY - bulbRadius;
    const rootY = bulbCenterY + bulbRadius;

    if (lai > maxLai) {
        maxLai = lai;
        reachedMaxLai = false;
    }

    if (lai > 0) {
        const laiHeight = map(lai, 0, 6, 0, 250);
        const laiOpacity = map(lai, 0, 6, 80, 50);

        // 🌱 점진적 노화 표현 (그라데이션)
        let green = color(50, 180, 60);
        let yellow = color(255, 230, 0);
        let fadeRatio = constrain((maxLai - lai) / maxLai, 0, 1);  // 0~1 사이 비율
        let laiFill = lerpColor(green, yellow, fadeRatio);
        laiFill.setAlpha(laiOpacity);

        noStroke();
        fill(laiFill);
        rect(width / 2 - 5, stalkY - laiHeight, 10, laiHeight);

        fill(0, 150);
        textAlign(CENTER);
        text(`LAI: ${lai.toFixed(2)}`, width / 2, stalkY - laiHeight - 10);
    }


    let visibleLeaves = 0;

    if (lengthByDate[date]) {
        const leaves = lengthByDate[date].slice();

        for (let i = 0; i < leaves.length; i++) {
            let rawLen = leaves[i];
            if (rawLen <= 0) continue;
            visibleLeaves++;

            let lenScale = map(i, 0, leaves.length - 1, 0.6, 1.2);
            let len = rawLen * lenScale * 4;

            let baseAngle = 75;
            let maxAngle = 85;
            let t = i / (leaves.length - 1);
            let angleDeg = baseAngle + (maxAngle - baseAngle) * pow(t, 1.5);
            let angle = radians(angleDeg);

            let dir = i % 2 === 0 ? 1 : -1;

            let baseX = width / 2;
            let baseY = stalkY - i * 6;
            let endX = baseX + cos(angle) * len * dir;
            let endY = baseY - sin(angle) * len;

            // ✅ 마우스 거리 계산 후 isHovered 설정
            let d = dist(mouseX, mouseY, endX, endY);
            let isHovered = d < 30;

            // ✅ 색상 조건 적용
            let leafFill = isHovered ? color(0, 120, 0) : color(0, 160, 0);
            leafFill.setAlpha(isHovered ? 255 : 200);

            fill(leafFill);
            noStroke();
            beginShape();
            curveVertex(baseX, baseY);
            curveVertex(baseX, baseY);
            curveVertex((baseX + endX) / 2, (baseY + endY) / 2 - 10);
            curveVertex(endX, endY);
            curveVertex(endX, endY);
            endShape();

            if (isHovered) {
                textSize(12);
                fill(0);
                textAlign(CENTER);
                text(`No.${i + 1}\n${rawLen.toFixed(1)}cm`, endX, endY - 5);
            }
        }


    }


    // if (visibleLeaves === 0) {
    //     fill(150);
    //     textAlign(CENTER);
    //     text("🌱 아직 잎이 없습니다", width / 2, height - 30);
    // }

    if (bulb > 0) {
        noStroke();
        fill(160, 100, 200);
        ellipse(width / 2, bulbCenterY, bulbSize);

        // ✅ 구 무게 텍스트
        let labelSize = map(bulb, 0, 5, 8, 16); // 💡 5g일 때까지 점진적으로 키움
        labelSize = constrain(labelSize, 4, 13); // 너무 작아지지 않도록 최소 6


        fill(255);
        textSize(labelSize);
        textAlign(CENTER, CENTER);
        text(`${bulb.toFixed(1)} g`, width / 2, bulbCenterY);
    }


    if (rootMass > 0) {
        const rootCount = 15;
        const maxRootLen = 80;
        const centerX = width / 2;
        const centerY = rootY;
        const spacing = bulbRadius * 0.35;

        stroke(139, 69, 19, constrain(rootCarbon * 20, 50, 255));
        strokeWeight(2);
        noFill();

        // 🌀 중심부터 퍼져나가는 순서 만들기
        let drawOrder = [];
        let mid = floor(rootCount / 2);
        for (let i = 0; i < rootCount; i++) {
            if (i % 2 === 0) drawOrder.unshift(mid - floor(i / 2));
            else drawOrder.push(mid + ceil(i / 2));
        }

        const rootGrowthSpan = 1.5;
        const rootStartThreshold = 0.1;

        for (let i = 0; i < rootCount; i++) {
            const index = drawOrder[i];

            // 각 뿌리의 등장 시점 계산
            const rootThreshold = rootStartThreshold + (i / rootCount) * rootGrowthSpan;

            // 아직 등장 시점이 안 된 뿌리는 skip
            if (rootMass < rootThreshold) continue;

            // 등장 후 성장 진행률 계산
            let progress = map(rootMass, rootThreshold, rootThreshold + 0.75, 0, 1);
            progress = constrain(progress, 0, 1);
            progress = pow(progress, 0.7);  // 곡선형 성장

            // 길이 다양성 부여
            const noiseFactor = 0.9 + 0.2 * sin(index);
            const rootLen = maxRootLen * progress * noiseFactor;

            // 위치 계산
            const offsetIndex = index - floor(rootCount / 2);
            const offset = offsetIndex * spacing;
            const ctrlX = centerX + offset * 0.5;
            const endX = centerX + offset;
            const tipY = centerY + rootLen;

            bezier(centerX, centerY, ctrlX, centerY + rootLen * 0.3, endX, centerY + rootLen * 0.6, endX, tipY);
        }
    }


    let stageKorMap = {
        "seed": "파종기",
        "vegetative": "생장기",
        "bulb_growth_before_scape_appearance": "비대기(대 생기 전)",
        "bulb_growth_after_scape_appearance": "비대기(대 생긴 후)",
    };
    let stageKor = stageKorMap[stage] || "정보 없음";

    fill(0);
    noStroke();
    textSize(16);
    textAlign(CENTER);
    text(`📅 ${date}`, width / 2, 30);
    textAlign(LEFT);
    text(`🌿 잎 개수: ${visibleLeaves}`, 20, 50);
    text(`📘 생육단계: ${stageKor}`, 20, 70);


    timelineSlider.value(dayIndex);
    // currentDateLabel.html(date);


    dayIndex++;
    if (dayIndex > endDay) {
        dayIndex = startDay;
        maxLai = 0;
        reachedMaxLai = false;
    }
}
