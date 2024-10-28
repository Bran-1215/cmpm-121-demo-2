import "./style.css";

const APP_NAME = "Splonchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
const ctx = canvas.getContext("2d")!;
app.append(canvas);

let isDrawing = false;
let currentThickness = 3;
let mouseX: number | null = null;
let mouseY: number | null = null;
let toolPreview: ToolPreview | null = null;
let currentSticker: Sticker | null = null;
let currentColor: string = getRandomColor();
const stickers: Sticker[] = [];

const stickerData: { emoji: string }[] = [
  { emoji: "🦗" },
  { emoji: "💚" },
  { emoji: "🌱" },
];

class Line {
  private points: Array<{ x: number; y: number }> = [];
  private thickness: number;
  private color: string;

  constructor(initialX: number, initialY: number, thickness: number, color: string) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(context: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    context.lineWidth = this.thickness;
    context.strokeStyle = this.color;

    for (let i = 1; i < this.points.length; i++) {
      const prevPoint = this.points[i - 1];
      const currentPoint = this.points[i];
      context.beginPath();
      context.moveTo(prevPoint.x, prevPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
      context.closePath();
    }
  }
}

class ToolPreview {
  private thickness: number;
  private x: number;
  private y: number;
  private color: string;

  constructor(thickness: number, x: number, y: number, color: string = "gray") {
    this.thickness = thickness;
    this.x = x;
    this.y = y;
    this.color = color;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  updateThickness(thickness: number) {
    this.thickness = thickness;
  }

  updateColor(color: string) {
    this.color = color;
  }

  draw(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    context.strokeStyle = this.color;
    context.lineWidth = 1;
    context.stroke();
    context.closePath();
  }
}

class Sticker {
  private emoji: string;
  private x: number;
  private y: number;
  private rotation: number = 0;

  constructor(emoji: string, x: number, y: number) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
  }

  setRotation(rotation: number) {
    this.rotation = rotation;
  }

  getRotation(): number {
    return this.rotation;
  }

  getEmoji(): string {
    return this.emoji;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate((this.rotation * Math.PI) / 180);
    context.font = "24px Arial";
    context.fillText(this.emoji, 0, 0);
    context.restore();
  }
}

const lines: Array<Line> = [];
let currentLine: Line | null = null;
const redoStack: Array<Line> = [];

function dispatchDrawingChangedEvent() {
  const event = new CustomEvent("drawing-changed");
  canvas.dispatchEvent(event);
}

function dispatchToolMovedEvent() {
  const event = new CustomEvent("tool-moved");
  canvas.dispatchEvent(event);
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  lines.forEach((line) => {
    line.display(ctx);
  });

  if (currentLine) {
    currentLine.display(ctx);
  }

  stickers.forEach((sticker) => {
    sticker.display(ctx);
  });

  if (toolPreview && !isDrawing) {
    toolPreview.draw(ctx);
  }

  if (currentSticker) {
    currentSticker.display(ctx);
  }
}

function getRandomColor(): string {
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33EC"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomRotation(): number {
  return Math.random() * 360;
}

canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

canvas.addEventListener("tool-moved", () => {
  redrawCanvas();
});

canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  if (currentSticker) {
    const newSticker = new Sticker(currentSticker.getEmoji(), x, y);
    newSticker.setRotation(currentSticker.getRotation());
    stickers.push(newSticker);
    currentSticker = null;
    dispatchDrawingChangedEvent();
  } else {
    isDrawing = true;
    currentColor = getRandomColor();
    currentLine = new Line(x, y, currentThickness, currentColor);
    toolPreview = null;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const newX = e.offsetX;
  const newY = e.offsetY;

  if (isDrawing && currentLine) {
    currentLine.drag(newX, newY);
    dispatchDrawingChangedEvent();
  } else {
    if (currentSticker) {
      currentSticker.drag(newX, newY);
      dispatchToolMovedEvent();
    } else {
      if (!toolPreview) {
        toolPreview = new ToolPreview(currentThickness, newX, newY, currentColor);
      } else {
        toolPreview.updatePosition(newX, newY);
      }
      dispatchToolMovedEvent();
    }
  }
});

window.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    lines.push(currentLine);
    currentLine = null;
    isDrawing = false;
    redoStack.length = 0;
    dispatchDrawingChangedEvent();
  }
});

const buttonContainer = document.createElement("div");
buttonContainer.id = "buttonContainer";

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
buttonContainer.append(clearButton);
clearButton.addEventListener("click", () => {
  lines.length = 0;
  stickers.length = 0;
  redoStack.length = 0;
  dispatchDrawingChangedEvent();
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
buttonContainer.append(undoButton);
undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const lastLine = lines.pop();
    if (lastLine) {
      redoStack.push(lastLine);
    }
    dispatchDrawingChangedEvent();
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
buttonContainer.append(redoButton);
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoLine = redoStack.pop();
    if (redoLine) {
      lines.push(redoLine);
    }
    dispatchDrawingChangedEvent();
  }
});

stickerData.forEach((sticker) => {
  const stickerButton = document.createElement("button");
  stickerButton.innerHTML = sticker.emoji;
  buttonContainer.append(stickerButton);

  stickerButton.addEventListener("click", () => {
    currentSticker = new Sticker(sticker.emoji, 0, 0);
    currentSticker.setRotation(getRandomRotation());
    dispatchToolMovedEvent();
  });
});

const addCustomStickerButton = document.createElement("button");
addCustomStickerButton.innerHTML = "Add Custom Sticker";
buttonContainer.append(addCustomStickerButton);

addCustomStickerButton.addEventListener("click", () => {
  const customEmoji = prompt("Enter a custom sticker emoji or text:", "💩");
  if (customEmoji) {
    stickerData.push({ emoji: customEmoji });
    const customButton = document.createElement("button");
    customButton.innerHTML = customEmoji;
    buttonContainer.append(customButton);

    customButton.addEventListener("click", () => {
      currentSticker = new Sticker(customEmoji, 0, 0);
      currentSticker.setRotation(getRandomRotation());
      dispatchToolMovedEvent();
    });
  }
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.classList.add("toolButton");
thinButton.classList.add("selectedTool");
buttonContainer.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.classList.add("toolButton");
buttonContainer.append(thickButton);

thinButton.addEventListener("click", () => {
  currentThickness = 3;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");

  currentColor = getRandomColor();
  if (toolPreview) {
    toolPreview.updateThickness(currentThickness);
    toolPreview.updateColor(currentColor);
    dispatchToolMovedEvent();
  }
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");

  currentColor = getRandomColor();
  if (toolPreview) {
    toolPreview.updateThickness(currentThickness);
    toolPreview.updateColor(currentColor);
    dispatchToolMovedEvent();
  }
});

const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
buttonContainer.append(exportButton);

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4);

  lines.forEach((line) => {
    line.display(exportCtx);
  });

  stickers.forEach((sticker) => {
    sticker.display(exportCtx);
  });

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

toolPreview = new ToolPreview(
  currentThickness,
  canvas.width / 2,
  canvas.height / 2,
  currentColor
);
dispatchToolMovedEvent();

app.append(buttonContainer);
