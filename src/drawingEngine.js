export class DrawingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.render([]);
  }

  render(groups) {
    const ctx = this.context;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    groups.flatMap((group) => group.operations).forEach((operation) => {
      this.draw(operation);
    });
  }

  draw(operation) {
    const ctx = this.context;
    ctx.save();
    ctx.strokeStyle = operation.color;
    ctx.fillStyle = operation.fill ?? "transparent";
    ctx.lineWidth = operation.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (operation.type) {
      case "line":
        this.drawLine(operation);
        break;
      case "circle":
        this.drawCircle(operation);
        break;
      case "rectangle":
        this.drawRectangle(operation);
        break;
      case "triangle":
        this.drawTriangle(operation);
        break;
      case "arc":
        this.drawArc(operation);
        break;
      default:
        console.warn("未知绘图操作：", operation.type);
    }

    ctx.restore();
  }

  drawLine({ x1, y1, x2, y2 }) {
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }

  drawCircle({ x, y, radius, fill }) {
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) this.context.fill();
    this.context.stroke();
  }

  drawRectangle({ x, y, width, height, fill }) {
    if (fill) this.context.fillRect(x - width / 2, y - height / 2, width, height);
    this.context.strokeRect(x - width / 2, y - height / 2, width, height);
  }

  drawTriangle({ x, y, size, fill }) {
    const height = size * 0.86;
    this.context.beginPath();
    this.context.moveTo(x, y - height / 2);
    this.context.lineTo(x - size / 2, y + height / 2);
    this.context.lineTo(x + size / 2, y + height / 2);
    this.context.closePath();
    if (fill) this.context.fill();
    this.context.stroke();
  }

  drawArc({ x, y, radius, startAngle, endAngle }) {
    this.context.beginPath();
    this.context.arc(x, y, radius, startAngle, endAngle);
    this.context.stroke();
  }

  save(filename = "voice-canvas-ai.png") {
    const link = document.createElement("a");
    link.download = filename;
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }
}
