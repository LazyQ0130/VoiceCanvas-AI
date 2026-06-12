export const OBJECT_LIBRARY = {
  sun: { label: "太阳", aliases: ["太阳", "阳光"], layer: "far", count: 1 },
  moon: { label: "月亮", aliases: ["月亮", "月球"], layer: "far", count: 1 },
  stars: { label: "星星", aliases: ["星星", "星空", "星点"], layer: "far", count: 24 },
  cloud: { label: "白云", aliases: ["白云", "云朵", "云"], layer: "far", count: 3 },
  mountain: { label: "山", aliases: ["远山", "山丘", "山"], layer: "far", count: 2 },
  tree: { label: "树", aliases: ["树木", "树林", "树"], layer: "middle", count: 5 },
  grass: { label: "草地", aliases: ["草地", "草坪"], layer: "background", count: 1 },
  flower: { label: "花", aliases: ["花朵", "鲜花", "花"], layer: "front", count: 9 },
  river: { label: "小河", aliases: ["小河", "河流", "河"], layer: "background", count: 1 },
  lake: { label: "湖", aliases: ["湖边", "湖泊", "湖"], layer: "background", count: 1 },
  sea: { label: "海", aliases: ["大海", "海边", "海"], layer: "background", count: 1 },
  rain: { label: "雨滴", aliases: ["雨滴", "下雨", "雨天", "雨"], layer: "front", count: 34 },
  snow: { label: "雪花", aliases: ["雪花", "下雪", "雪天", "雪景", "雪"], layer: "front", count: 32 },
  house: { label: "房子", aliases: ["房屋", "房子"], layer: "middle", count: 1 },
  city: { label: "城市楼群", aliases: ["楼房", "高楼", "城市"], layer: "middle", count: 1 },
  road: { label: "道路", aliases: ["小路", "道路", "马路"], layer: "background", count: 1 },
  bridge: { label: "桥", aliases: ["桥梁", "桥"], layer: "middle", count: 1 },
  campus: { label: "校园标识", aliases: ["校园"], layer: "middle", count: 1 },
  schoolBuilding: { label: "教学楼", aliases: ["教学楼", "学校"], layer: "middle", count: 1 },
  park: { label: "公园标识", aliases: ["公园"], layer: "middle", count: 1 },
  person: { label: "人物", aliases: ["小人", "人物", "人"], layer: "front", count: 2 },
  robot: { label: "机器人", aliases: ["机器人"], layer: "middle", count: 1 },
  car: { label: "汽车", aliases: ["汽车", "小车", "车"], layer: "front", count: 2 },
  boat: { label: "小船", aliases: ["小船", "船"], layer: "middle", count: 1 },
  airplane: { label: "飞机", aliases: ["飞机"], layer: "far", count: 1 },
  spaceship: { label: "飞船", aliases: ["宇宙飞船", "飞船"], layer: "middle", count: 1 },
  planet: { label: "行星", aliases: ["行星"], layer: "far", count: 1 },
  balloon: { label: "气球", aliases: ["气球"], layer: "front", count: 5 },
  heart: { label: "爱心", aliases: ["爱心", "心形"], layer: "front", count: 4 },
  smiley: { label: "笑脸", aliases: ["笑脸", "笑容"], layer: "front", count: 1 },
  bench: { label: "长椅", aliases: ["长椅", "椅子"], layer: "front", count: 1 },
  bird: { label: "海鸥", aliases: ["海鸥", "小鸟", "鸟"], layer: "far", count: 4 },
};

export const SCENE_PRESETS = {
  spring: { label: "春天", objects: ["sun", "cloud", "grass", "flower", "tree"], time: "day", weather: "clear" },
  summer: { label: "夏天", objects: ["sun", "cloud", "grass", "tree"], time: "day", weather: "clear" },
  autumn: { label: "秋天", objects: ["cloud", "grass", "tree", "mountain"], time: "day", weather: "clear" },
  winter: { label: "冬天", objects: ["snow", "house", "tree"], time: "day", weather: "snow" },
  campus: { label: "校园", objects: ["schoolBuilding", "tree", "road"], time: "day", weather: "clear" },
  park: { label: "公园", objects: ["grass", "tree", "flower", "bench", "road"], time: "day", weather: "clear" },
  beach: { label: "海边", objects: ["sea", "sun", "boat", "bird"], time: "day", weather: "clear" },
  city: { label: "城市", objects: ["city", "road", "car"], time: "day", weather: "clear" },
  forest: { label: "森林", objects: ["grass", "mountain", "tree"], time: "day", weather: "clear" },
  space: { label: "太空", objects: ["stars", "moon", "planet", "spaceship"], time: "night", weather: "clear" },
  lakeside: { label: "湖边", objects: ["lake", "mountain", "tree", "boat"], time: "day", weather: "clear" },
  birthday: { label: "生日", objects: ["balloon", "smiley", "heart", "flower"], time: "day", weather: "clear" },
};

export const SCENE_ALIASES = {
  spring: ["春天", "春日"],
  summer: ["夏天", "夏日"],
  autumn: ["秋天", "秋日"],
  winter: ["冬天", "冬日", "雪景"],
  campus: ["校园", "学校"],
  park: ["公园"],
  beach: ["海边", "海滩"],
  city: ["城市"],
  forest: ["森林", "树林"],
  space: ["太空", "宇宙"],
  lakeside: ["湖边", "湖畔"],
  birthday: ["生日"],
};

export function extractObjectKeywords(text) {
  const keywords = Object.entries(OBJECT_LIBRARY)
    .filter(([, definition]) => definition.aliases.some((alias) => text.includes(alias)))
    .map(([key]) => key);
  return text.includes("机器人") ? keywords.filter((key) => key !== "person") : keywords;
}

export function objectLabels(keys) {
  return keys.map((key) => OBJECT_LIBRARY[key]?.label ?? key);
}

export function drawLibraryObject(ctx, object) {
  const drawers = {
    sun: drawSun,
    moon: drawMoon,
    stars: drawStar,
    cloud: drawCloud,
    mountain: drawMountain,
    tree: drawTree,
    grass: drawGround,
    flower: drawFlower,
    river: drawWater,
    lake: drawWater,
    sea: drawSea,
    rain: drawRain,
    snow: drawSnow,
    house: drawHouse,
    city: drawCity,
    road: drawRoad,
    bridge: drawBridge,
    campus: drawCampusSign,
    schoolBuilding: drawSchool,
    park: drawParkSign,
    person: drawPerson,
    robot: drawRobot,
    car: drawCar,
    boat: drawBoat,
    airplane: drawAirplane,
    spaceship: drawSpaceship,
    planet: drawPlanet,
    balloon: drawBalloon,
    heart: drawHeart,
    smiley: drawSmiley,
    bench: drawBench,
    bird: drawBird,
  };
  drawers[object.objectType]?.(ctx, object);
}

const fillStroke = (ctx) => { ctx.fill(); ctx.stroke(); };
const circle = (ctx, x, y, radius, fill) => {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; fillStroke(ctx);
};
const rect = (ctx, x, y, width, height, fill, radius = 0) => {
  ctx.beginPath();
  if (radius && ctx.roundRect) ctx.roundRect(x - width / 2, y - height / 2, width, height, radius);
  else ctx.rect(x - width / 2, y - height / 2, width, height);
  ctx.fillStyle = fill; fillStroke(ctx);
};

function drawSun(ctx, o) {
  circle(ctx, o.x, o.y, o.width * 0.28, o.palette[2]);
  for (let i = 0; i < 12; i += 1) {
    const angle = i * Math.PI / 6;
    ctx.beginPath(); ctx.moveTo(o.x + Math.cos(angle) * o.width * 0.36, o.y + Math.sin(angle) * o.width * 0.36);
    ctx.lineTo(o.x + Math.cos(angle) * o.width * 0.5, o.y + Math.sin(angle) * o.width * 0.5); ctx.stroke();
  }
}
function drawMoon(ctx, o) {
  circle(ctx, o.x, o.y, o.width * 0.34, "#fef3c7");
  ctx.globalCompositeOperation = "destination-out"; circle(ctx, o.x + o.width * 0.16, o.y - 5, o.width * 0.32, "#000");
  ctx.globalCompositeOperation = "source-over";
}
function drawStar(ctx, o) { circle(ctx, o.x, o.y, Math.max(1.5, o.width * 0.14), o.palette[5]); }
function drawCloud(ctx, o) {
  const r = o.width / 6; [[-1.4, .2], [-.55, -.25], [.35, -.35], [1.2, .2]].forEach(([dx, dy]) => circle(ctx, o.x + dx * r, o.y + dy * r, r, "#fff"));
}
function drawMountain(ctx, o) {
  ctx.beginPath(); ctx.moveTo(o.x - o.width / 2, o.y + o.height / 2); ctx.lineTo(o.x, o.y - o.height / 2); ctx.lineTo(o.x + o.width / 2, o.y + o.height / 2); ctx.closePath(); ctx.fillStyle = o.palette[4]; fillStroke(ctx);
  ctx.beginPath(); ctx.moveTo(o.x - o.width * .12, o.y - o.height * .25); ctx.lineTo(o.x, o.y - o.height / 2); ctx.lineTo(o.x + o.width * .13, o.y - o.height * .22); ctx.fillStyle = "#fff"; ctx.fill();
}
function drawTree(ctx, o) {
  rect(ctx, o.x, o.y - o.height * .14, o.width * .16, o.height * .55, "#854d0e");
  circle(ctx, o.x, o.y - o.height * .55, o.width * .42, o.palette[3]);
  circle(ctx, o.x - o.width * .25, o.y - o.height * .42, o.width * .3, o.palette[4]);
  circle(ctx, o.x + o.width * .25, o.y - o.height * .42, o.width * .3, o.palette[3]);
}
function drawGround(ctx, o) { rect(ctx, o.x, o.y, o.width, o.height, o.palette[3]); }
function drawFlower(ctx, o) {
  ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - o.height * .6); ctx.strokeStyle = "#16a34a"; ctx.stroke();
  for (let i = 0; i < 5; i += 1) { const a = i * Math.PI * .4; circle(ctx, o.x + Math.cos(a) * o.width * .25, o.y - o.height * .68 + Math.sin(a) * o.width * .25, o.width * .18, o.palette[(i + 2) % o.palette.length]); }
  circle(ctx, o.x, o.y - o.height * .68, o.width * .14, "#facc15");
}
function drawWater(ctx, o) {
  ctx.fillStyle = o.palette[1]; ctx.globalAlpha *= .72;
  ctx.beginPath(); ctx.moveTo(0, o.y - o.height / 2); ctx.quadraticCurveTo(240, o.y + 40, 480, o.y); ctx.quadraticCurveTo(720, o.y - 40, 960, o.y + o.height / 2); ctx.lineTo(960, 620); ctx.lineTo(0, 620); ctx.closePath(); ctx.fill();
}
function drawSea(ctx, o) {
  rect(ctx, o.x, o.y, o.width, o.height, o.palette[1]);
  for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(60, o.y - 60 + i * 30); ctx.quadraticCurveTo(300, o.y - 80 + i * 30, 520, o.y - 60 + i * 30); ctx.quadraticCurveTo(720, o.y - 40 + i * 30, 920, o.y - 60 + i * 30); ctx.strokeStyle = "#bae6fd"; ctx.stroke(); }
}
function drawRain(ctx, o) { ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - 8, o.y + o.height); ctx.strokeStyle = "#60a5fa"; ctx.stroke(); }
function drawSnow(ctx, o) {
  ctx.strokeStyle = "#fff"; for (let i = 0; i < 3; i += 1) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(o.x - Math.cos(a) * 7, o.y - Math.sin(a) * 7); ctx.lineTo(o.x + Math.cos(a) * 7, o.y + Math.sin(a) * 7); ctx.stroke(); }
}
function drawHouse(ctx, o) {
  rect(ctx, o.x, o.y, o.width, o.height * .65, o.palette[2]);
  ctx.beginPath(); ctx.moveTo(o.x - o.width * .6, o.y - o.height * .32); ctx.lineTo(o.x, o.y - o.height * .72); ctx.lineTo(o.x + o.width * .6, o.y - o.height * .32); ctx.closePath(); ctx.fillStyle = o.palette[0]; fillStroke(ctx);
  rect(ctx, o.x, o.y + o.height * .12, o.width * .22, o.height * .38, o.palette[3]);
}
function drawCity(ctx, o) {
  for (let i = 0; i < 7; i += 1) { const w = o.width / 9; const h = o.height * (.45 + (i % 3) * .22); rect(ctx, o.x - o.width * .42 + i * w * 1.25, o.y + o.height / 2 - h / 2, w, h, o.palette[i % o.palette.length]); }
}
function drawRoad(ctx, o) {
  rect(ctx, o.x, o.y, o.width, o.height, "#334155"); ctx.setLineDash([28, 22]); ctx.beginPath(); ctx.moveTo(20, o.y); ctx.lineTo(940, o.y); ctx.strokeStyle = "#facc15"; ctx.stroke(); ctx.setLineDash([]);
}
function drawBridge(ctx, o) {
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(o.x - o.width / 2, o.y); ctx.quadraticCurveTo(o.x, o.y - o.height, o.x + o.width / 2, o.y); ctx.strokeStyle = o.palette[0]; ctx.stroke(); rect(ctx, o.x, o.y, o.width, 20, o.palette[2]);
}
function drawCampusSign(ctx, o) { drawSchool(ctx, o); rect(ctx, o.x, o.y + o.height * .35, o.width * .32, o.height * .18, o.palette[3], 8); }
function drawSchool(ctx, o) {
  rect(ctx, o.x, o.y, o.width, o.height, o.palette[2], 8); rect(ctx, o.x, o.y + o.height * .28, o.width * .18, o.height * .4, o.palette[0]);
  for (let row = 0; row < 2; row += 1) for (let col = 0; col < 4; col += 1) rect(ctx, o.x - o.width * .35 + col * o.width * .23, o.y - o.height * .25 + row * o.height * .25, o.width * .1, o.height * .13, "#bfdbfe");
}
function drawParkSign(ctx, o) { rect(ctx, o.x, o.y, o.width * .42, o.height * .38, o.palette[3], 16); drawTree(ctx, { ...o, x: o.x, y: o.y - o.height * .05, width: o.width * .32, height: o.height * .7 }); }
function drawPerson(ctx, o) { circle(ctx, o.x, o.y - o.height * .72, o.width * .2, o.palette[2]); ctx.beginPath(); ctx.moveTo(o.x, o.y - o.height * .52); ctx.lineTo(o.x, o.y - o.height * .12); ctx.moveTo(o.x, o.y - o.height * .42); ctx.lineTo(o.x - o.width * .35, o.y - o.height * .25); ctx.moveTo(o.x, o.y - o.height * .42); ctx.lineTo(o.x + o.width * .35, o.y - o.height * .25); ctx.moveTo(o.x, o.y - o.height * .12); ctx.lineTo(o.x - o.width * .28, o.y); ctx.moveTo(o.x, o.y - o.height * .12); ctx.lineTo(o.x + o.width * .28, o.y); ctx.stroke(); }
function drawRobot(ctx, o) { rect(ctx, o.x, o.y, o.width * .65, o.height * .48, o.palette[1], 20); rect(ctx, o.x, o.y - o.height * .35, o.width * .58, o.height * .3, o.palette[2], 18); circle(ctx, o.x - o.width * .14, o.y - o.height * .38, o.width * .06, o.palette[3]); circle(ctx, o.x + o.width * .14, o.y - o.height * .38, o.width * .06, o.palette[3]); }
function drawCar(ctx, o) { rect(ctx, o.x, o.y, o.width, o.height * .45, o.palette[2], 16); ctx.beginPath(); ctx.moveTo(o.x - o.width * .28, o.y - o.height * .22); ctx.lineTo(o.x - o.width * .12, o.y - o.height * .55); ctx.lineTo(o.x + o.width * .24, o.y - o.height * .55); ctx.lineTo(o.x + o.width * .38, o.y - o.height * .22); ctx.closePath(); ctx.fillStyle = o.palette[1]; fillStroke(ctx); circle(ctx, o.x - o.width * .28, o.y + o.height * .22, o.height * .16, "#111827"); circle(ctx, o.x + o.width * .28, o.y + o.height * .22, o.height * .16, "#111827"); }
function drawBoat(ctx, o) { ctx.beginPath(); ctx.moveTo(o.x - o.width / 2, o.y); ctx.lineTo(o.x + o.width / 2, o.y); ctx.lineTo(o.x + o.width * .3, o.y + o.height * .3); ctx.lineTo(o.x - o.width * .3, o.y + o.height * .3); ctx.closePath(); ctx.fillStyle = o.palette[2]; fillStroke(ctx); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - o.height * .7); ctx.lineTo(o.x + o.width * .35, o.y - o.height * .1); ctx.closePath(); ctx.fillStyle = "#fff"; fillStroke(ctx); }
function drawAirplane(ctx, o) { ctx.beginPath(); ctx.moveTo(o.x - o.width / 2, o.y); ctx.lineTo(o.x + o.width / 2, o.y); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.width * .2, o.y - o.height / 2); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.width * .2, o.y + o.height / 2); ctx.stroke(); }
function drawSpaceship(ctx, o) { ctx.beginPath(); ctx.moveTo(o.x, o.y - o.height / 2); ctx.quadraticCurveTo(o.x + o.width / 2, o.y, o.x, o.y + o.height / 2); ctx.quadraticCurveTo(o.x - o.width / 2, o.y, o.x, o.y - o.height / 2); ctx.fillStyle = o.palette[1]; fillStroke(ctx); circle(ctx, o.x, o.y - o.height * .08, o.width * .12, o.palette[3]); }
function drawPlanet(ctx, o) { circle(ctx, o.x, o.y, o.width * .3, o.palette[4]); ctx.beginPath(); ctx.ellipse(o.x, o.y, o.width * .52, o.height * .14, -.2, 0, Math.PI * 2); ctx.stroke(); }
function drawBalloon(ctx, o) { circle(ctx, o.x, o.y - o.height * .35, o.width * .35, o.palette[(Math.round(o.x) + 2) % o.palette.length]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.quadraticCurveTo(o.x + 12, o.y + o.height * .4, o.x, o.y + o.height * .7); ctx.stroke(); }
function drawHeart(ctx, o) { ctx.beginPath(); ctx.moveTo(o.x, o.y + o.height * .35); ctx.bezierCurveTo(o.x - o.width * .6, o.y, o.x - o.width * .4, o.y - o.height * .45, o.x, o.y - o.height * .12); ctx.bezierCurveTo(o.x + o.width * .4, o.y - o.height * .45, o.x + o.width * .6, o.y, o.x, o.y + o.height * .35); ctx.fillStyle = o.palette[2]; fillStroke(ctx); }
function drawSmiley(ctx, o) { circle(ctx, o.x, o.y, o.width * .4, "#facc15"); circle(ctx, o.x - o.width * .13, o.y - o.height * .08, o.width * .04, "#111827"); circle(ctx, o.x + o.width * .13, o.y - o.height * .08, o.width * .04, "#111827"); ctx.beginPath(); ctx.arc(o.x, o.y, o.width * .2, .2, Math.PI - .2); ctx.stroke(); }
function drawBench(ctx, o) { rect(ctx, o.x, o.y - o.height * .18, o.width, o.height * .18, "#92400e"); rect(ctx, o.x, o.y + o.height * .08, o.width, o.height * .14, "#92400e"); ctx.beginPath(); ctx.moveTo(o.x - o.width * .35, o.y); ctx.lineTo(o.x - o.width * .35, o.y + o.height * .45); ctx.moveTo(o.x + o.width * .35, o.y); ctx.lineTo(o.x + o.width * .35, o.y + o.height * .45); ctx.stroke(); }
function drawBird(ctx, o) { ctx.beginPath(); ctx.arc(o.x - o.width * .15, o.y, o.width * .18, Math.PI, Math.PI * 2); ctx.arc(o.x + o.width * .15, o.y, o.width * .18, Math.PI, Math.PI * 2); ctx.stroke(); }
