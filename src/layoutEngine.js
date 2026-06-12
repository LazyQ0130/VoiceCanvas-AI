import { OBJECT_LIBRARY } from "./objectLibrary.js";

const LAYER_ORDER = { background: 0, far: 1, middle: 2, front: 3 };
const randomBetween = (min, max) => min + Math.random() * (max - min);

export function layoutObjects(objectKeys, context = {}) {
  const entries = objectKeys.flatMap((key) => {
    const definition = OBJECT_LIBRARY[key];
    if (!definition) return [];
    const requestedCount = context.counts?.[key] ?? definition.count;
    return Array.from({ length: requestedCount }, (_, index) => ({
      key,
      label: requestedCount > 1 ? `${definition.label} ${index + 1}` : definition.label,
      layer: definition.layer,
      index,
      count: requestedCount,
    }));
  });
  return entries
    .sort((a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer])
    .map((entry) => ({ ...entry, ...positionFor(entry, context) }));
}

function positionFor(entry, context) {
  const { key, layer, index, count } = entry;
  if (key === "sun" || key === "moon" || key === "planet") return { x: key === "sun" ? 760 : 190, y: 105, width: 105, height: 105 };
  if (key === "stars" || key === "rain" || key === "snow") return { x: randomBetween(15, 945), y: randomBetween(15, key === "stars" ? 350 : 590), width: 12, height: 24, opacity: randomBetween(0.35, 1) };
  if (key === "cloud" || key === "bird" || key === "airplane") return { x: 130 + (index % 5) * 175 + randomBetween(-30, 30), y: 90 + (index % 2) * 75, width: key === "cloud" ? 130 : 70, height: 55 };
  if (["grass", "road", "river", "lake", "sea"].includes(key)) return { x: 480, y: key === "road" ? 555 : 500, width: 960, height: key === "grass" ? 230 : 180 };
  if (key === "mountain") return { x: index ? 690 : 280, y: 390, width: 500, height: 230 };
  if (key === "city" || key === "schoolBuilding" || key === "house" || key === "campus" || key === "park") return { x: 480, y: key === "city" ? 390 : 385, width: key === "city" ? 780 : 320, height: key === "city" ? 300 : 230 };
  if (key === "bridge") return { x: 500, y: 440, width: 330, height: 120 };
  if (key === "boat" || key === "spaceship") return { x: 520, y: key === "boat" ? 440 : 270, width: 170, height: 100 };
  if (key === "tree") return { x: 80 + (index % 7) * 135 + randomBetween(-22, 22), y: 490 + randomBetween(-18, 25), width: 95, height: randomBetween(125, 210) };
  if (key === "flower") return { x: 60 + (index % 10) * 90 + randomBetween(-15, 15), y: 545 + randomBetween(-20, 18), width: 28, height: randomBetween(42, 70) };
  if (key === "balloon" || key === "heart") return { x: 210 + (index % 5) * 135, y: 180 + (index % 2) * 95, width: 55, height: 80 };
  if (key === "car") return { x: 300 + index * 330, y: 535, width: 145, height: 75 };
  if (key === "person") return { x: 365 + index * 230, y: 500, width: 60, height: 130 };
  if (key === "bench") return { x: 650, y: 500, width: 150, height: 80 };
  if (key === "robot" || key === "smiley") return { x: 480, y: 350, width: 210, height: 260 };
  return {
    x: layer === "far" ? 480 : randomBetween(150, 810),
    y: layer === "front" ? 510 : 350,
    width: 120,
    height: 120,
    context,
    count,
  };
}
