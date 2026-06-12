const randomBetween = (min, max) => min + Math.random() * (max - min);
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

export function createScene(scene, context) {
  const creators = {
    nightCity: createNightCity,
    starrySky: createStarrySky,
    sunsetBeach: createSunsetBeach,
    forest: createForest,
    robot: createRobot,
  };
  return creators[scene]?.(context) ?? [];
}

function createNightCity({ make, preset }) {
  const operations = [
    make("gradientBackground", "深色渐变夜空", { colors: ["#020617", "#172554"] }),
    make("circle", "月亮", { x: 790, y: 105, radius: 45, color: "#fef3c7", fill: "#fef3c7" }),
  ];
  for (let index = 0; index < 34; index += 1) {
    operations.push(make("star", `星星 ${index + 1}`, {
      x: randomBetween(25, 930), y: randomBetween(20, 250), radius: randomBetween(1, 3),
      color: "#f8fafc", fill: "#f8fafc", opacity: randomBetween(0.35, 1),
    }));
  }
  let x = 35;
  let buildingIndex = 1;
  while (x < 940) {
    const width = randomBetween(65, 125);
    const height = randomBetween(150, 350);
    const centerX = x + width / 2;
    const centerY = 500 - height / 2;
    operations.push(make("rectangle", `高楼 ${buildingIndex}`, {
      x: centerX, y: centerY, width, height, color: "#020617", fill: randomItem(["#0f172a", "#111827", "#1e293b"]),
    }));
    for (let wx = x + 14; wx < x + width - 8; wx += 20) {
      for (let wy = 520 - height; wy < 485; wy += 25) {
        if (Math.random() > 0.48) {
          operations.push(make("rectangle", `亮灯窗户`, {
            x: wx, y: wy, width: 8, height: 12, color: preset.palette[3], fill: preset.palette[3], lineWidth: 1,
            opacity: randomBetween(0.55, 1),
          }));
        }
      }
    }
    x += width + randomBetween(8, 20);
    buildingIndex += 1;
  }
  operations.push(make("rectangle", "城市道路", { x: 480, y: 575, width: 960, height: 90, color: "#020617", fill: "#020617" }));
  operations.push(make("line", "道路中心线", { x1: 40, y1: 568, x2: 920, y2: 568, color: preset.palette[3], dash: [24, 20] }));
  return operations;
}

function createStarrySky({ make, preset }) {
  const operations = [make("gradientBackground", "星空渐变背景", { colors: ["#020617", "#2e1065"] })];
  for (let index = 0; index < 95; index += 1) {
    operations.push(make("star", `星点 ${index + 1}`, {
      x: randomBetween(8, 952), y: randomBetween(8, 500), radius: randomBetween(0.7, 3.2),
      color: randomItem(["#ffffff", "#bae6fd", "#ddd6fe"]), fill: randomItem(["#ffffff", "#bae6fd", "#ddd6fe"]),
      opacity: randomBetween(0.3, 1),
    }));
  }
  operations.push(make("circle", "远方行星", { x: 760, y: 145, radius: 62, color: preset.palette[1], fill: preset.palette[2] }));
  operations.push(make("line", "流星一号", { x1: 130, y1: 150, x2: 250, y2: 220, color: "#ffffff", lineWidth: 3 }));
  operations.push(make("line", "流星二号", { x1: 520, y1: 80, x2: 610, y2: 130, color: "#bae6fd", lineWidth: 2 }));
  operations.push(make("mountain", "远处山丘", { points: [[0, 530], [150, 390], [270, 510], [430, 350], [610, 510], [780, 410], [960, 530]], color: "#0f172a", fill: "#0f172a" }));
  return operations;
}

function createSunsetBeach({ make, preset }) {
  const operations = [
    make("gradientBackground", "暖色日落天空", { colors: ["#7c3aed", "#fb7185", "#fbbf24"] }),
    make("circle", "夕阳", { x: 690, y: 250, radius: 72, color: "#fef3c7", fill: "#fef3c7" }),
    make("rectangle", "海平面", { x: 480, y: 440, width: 960, height: 220, color: "#0ea5e9", fill: "#075985", opacity: 0.82 }),
  ];
  for (let index = 0; index < 12; index += 1) {
    const y = 355 + index * 18 + randomBetween(-5, 5);
    operations.push(make("wave", `海浪 ${index + 1}`, {
      x: randomBetween(20, 100), y, width: randomBetween(720, 920), amplitude: randomBetween(4, 11),
      color: index % 2 ? "#bae6fd" : "#fef3c7", opacity: randomBetween(0.35, 0.8),
    }));
  }
  operations.push(make("polygon", "沙滩", { points: [[0, 510], [280, 475], [520, 520], [960, 470], [960, 620], [0, 620]], color: "#f59e0b", fill: "#fbbf24" }));
  operations.push(make("palm", "椰子树剪影", { x: 145, y: 500, height: 240, color: "#172554", fill: "#172554" }));
  return operations;
}

function createForest({ make, preset }) {
  const operations = [
    make("gradientBackground", "森林天空", { colors: ["#bfdbfe", "#dcfce7"] }),
    make("mountain", "远处山丘", { points: [[0, 430], [180, 260], [320, 410], [520, 220], [720, 420], [850, 300], [960, 430]], color: "#86efac", fill: "#86efac", opacity: 0.7 }),
    make("rectangle", "草地", { x: 480, y: 515, width: 960, height: 210, color: "#166534", fill: "#15803d" }),
  ];
  for (let index = 0; index < 4; index += 1) {
    operations.push(make("cloud", `云朵 ${index + 1}`, { x: 130 + index * 235, y: randomBetween(80, 160), width: randomBetween(90, 150), color: "#ffffff", fill: "#ffffff", opacity: 0.78 }));
  }
  for (let index = 0; index < 24; index += 1) {
    operations.push(make("tree", `树木 ${index + 1}`, {
      x: randomBetween(25, 935), y: randomBetween(390, 565), height: randomBetween(90, 230),
      color: randomItem(["#14532d", "#166534", "#065f46"]), fill: randomItem(["#15803d", "#16a34a", "#047857"]),
    }));
  }
  return operations;
}

function createRobot({ make, preset }) {
  const primary = preset.palette[1];
  const accent = preset.palette[3];
  return [
    make("gradientBackground", "机器人背景", { colors: preset.background }),
    make("roundedRectangle", "机器人身体", { x: 480, y: 355, width: 250, height: 220, radius: 36, color: primary, fill: primary }),
    make("roundedRectangle", "机器人头部", { x: 480, y: 205, width: 220, height: 135, radius: 32, color: primary, fill: preset.palette[2] }),
    make("circle", "左眼", { x: 435, y: 195, radius: 18, color: accent, fill: accent }),
    make("circle", "右眼", { x: 525, y: 195, radius: 18, color: accent, fill: accent }),
    make("arc", "机器人笑容", { x: 480, y: 215, radius: 45, startAngle: 0.25, endAngle: Math.PI - 0.25, color: preset.palette[0] }),
    make("line", "天线杆", { x1: 480, y1: 135, x2: 480, y2: 95, color: primary }),
    make("circle", "天线灯", { x: 480, y: 80, radius: 13, color: accent, fill: accent }),
    make("line", "左手臂", { x1: 350, y1: 320, x2: 265, y2: 390, color: primary, lineWidth: 22 }),
    make("line", "右手臂", { x1: 610, y1: 320, x2: 695, y2: 390, color: primary, lineWidth: 22 }),
    make("roundedRectangle", "左腿", { x: 425, y: 515, width: 65, height: 130, radius: 22, color: primary, fill: primary }),
    make("roundedRectangle", "右腿", { x: 535, y: 515, width: 65, height: 130, radius: 22, color: primary, fill: primary }),
  ];
}
