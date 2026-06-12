import { getStylePreset } from "./styleSystem.js";

export class DrawingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.render([]);
  }

  render(groups) {
    const ctx = this.context;
    const objects = groups.flatMap((group) => group.operations);
    const activeStyle = objects.at(-1)?.style ?? "default";
    const background = getStylePreset(activeStyle).background;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, background[0]);
    gradient.addColorStop(1, background.at(-1));
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    objects.forEach((operation) => this.draw(operation));
  }

  draw(operation) {
    const ctx = this.context;
    ctx.save();
    ctx.globalAlpha = operation.opacity ?? 1;
    ctx.strokeStyle = operation.color ?? "#0f172a";
    ctx.fillStyle = operation.fill ?? "transparent";
    ctx.lineWidth = operation.lineWidth ?? 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = operation.shadowBlur ?? 0;
    ctx.shadowColor = operation.color ?? "transparent";
    if (operation.dash) ctx.setLineDash(operation.dash);
    const jitter = operation.jitter ?? 0;
    if (jitter) ctx.translate(this.stableOffset(operation.id, jitter), this.stableOffset(`${operation.id}-y`, jitter));

    const drawers = {
      gradientBackground: () => this.drawGradient(operation),
      line: () => this.drawLine(operation),
      circle: () => this.drawCircle(operation),
      star: () => this.drawCircle(operation),
      rectangle: () => this.drawRectangle(operation),
      roundedRectangle: () => this.drawRoundedRectangle(operation),
      triangle: () => this.drawTriangle(operation),
      arc: () => this.drawArc(operation),
      polygon: () => this.drawPolygon(operation),
      mountain: () => this.drawPolygon(operation),
      wave: () => this.drawWave(operation),
      cloud: () => this.drawCloud(operation),
      tree: () => this.drawTree(operation),
      palm: () => this.drawPalm(operation),
    };
    drawers[operation.type]?.();
    ctx.restore();
  }

  drawGradient({ colors = ["#ffffff", "#e2e8f0"] }) {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
    colors.forEach((color, index) => gradient.addColorStop(index / Math.max(colors.length - 1, 1), color));
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLine({ x1, y1, x2, y2 }) {
    this.context.beginPath(); this.context.moveTo(x1, y1); this.context.lineTo(x2, y2); this.context.stroke();
  }

  drawCircle({ x, y, radius, fill }) {
    this.context.beginPath(); this.context.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) this.context.fill(); this.context.stroke();
  }

  drawRectangle({ x, y, width, height, fill }) {
    if (fill) this.context.fillRect(x - width / 2, y - height / 2, width, height);
    this.context.strokeRect(x - width / 2, y - height / 2, width, height);
  }

  drawRoundedRectangle({ x, y, width, height, radius = 20, fill }) {
    this.context.beginPath();
    this.context.roundRect(x - width / 2, y - height / 2, width, height, radius);
    if (fill) this.context.fill();
    this.context.stroke();
  }

  drawTriangle({ x, y, size, fill }) {
    const height = size * 0.86;
    this.context.beginPath(); this.context.moveTo(x, y - height / 2);
    this.context.lineTo(x - size / 2, y + height / 2); this.context.lineTo(x + size / 2, y + height / 2);
    this.context.closePath(); if (fill) this.context.fill(); this.context.stroke();
  }

  drawArc({ x, y, radius, startAngle, endAngle }) {
    this.context.beginPath(); this.context.arc(x, y, radius, startAngle, endAngle); this.context.stroke();
  }

  drawPolygon({ points, fill }) {
    if (!points?.length) return;
    this.context.beginPath(); this.context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => this.context.lineTo(x, y));
    this.context.closePath(); if (fill) this.context.fill(); this.context.stroke();
  }

  drawWave({ x, y, width, amplitude = 8 }) {
    this.context.beginPath(); this.context.moveTo(x, y);
    for (let offset = 0; offset <= width; offset += 18) {
      this.context.lineTo(x + offset, y + Math.sin(offset / 20) * amplitude);
    }
    this.context.stroke();
  }

  drawCloud({ x, y, width, fill }) {
    const radius = width / 5;
    this.context.beginPath();
    [[-1.5, 0.2], [-0.6, -0.35], [0.3, -0.5], [1.2, 0.1]].forEach(([dx, dy]) => {
      this.context.moveTo(x + dx * radius + radius, y + dy * radius);
      this.context.arc(x + dx * radius, y + dy * radius, radius, 0, Math.PI * 2);
    });
    if (fill) this.context.fill(); this.context.stroke();
  }

  drawTree({ x, y, height, fill }) {
    this.context.fillStyle = "#713f12";
    this.context.fillRect(x - height * 0.05, y - height * 0.35, height * 0.1, height * 0.35);
    this.context.fillStyle = fill;
    [0, 0.18, 0.36].forEach((level) => {
      const width = height * (0.48 - level * 0.5);
      const top = y - height + height * level;
      this.context.beginPath(); this.context.moveTo(x, top);
      this.context.lineTo(x - width, top + height * 0.48); this.context.lineTo(x + width, top + height * 0.48);
      this.context.closePath(); this.context.fill(); this.context.stroke();
    });
  }

  drawPalm({ x, y, height, fill }) {
    this.context.strokeStyle = fill; this.context.lineWidth = 14;
    this.context.beginPath(); this.context.moveTo(x, y); this.context.quadraticCurveTo(x - 25, y - height * 0.55, x + 15, y - height); this.context.stroke();
    this.context.lineWidth = 8;
    [-2.5, -1.3, 0, 1.3, 2.5].forEach((angle) => {
      this.context.beginPath(); this.context.moveTo(x + 15, y - height);
      this.context.quadraticCurveTo(x + Math.sin(angle) * 80, y - height - 35, x + Math.sin(angle) * 120, y - height + 15); this.context.stroke();
    });
  }

  stableOffset(value, range) {
    let hash = 0;
    for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return ((Math.abs(hash) % 1000) / 1000 - 0.5) * range;
  }

  save(filename = "voice-canvas-ai.png") {
    const link = document.createElement("a"); link.download = filename; link.href = this.canvas.toDataURL("image/png"); link.click();
  }
}
