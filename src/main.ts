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

class Line {
  private points: Array<{ x: number; y: number }> = [];

  constructor(initialX: number, initialY: number) {
    this.points.push({ x: initialX, y: initialY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(context: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    for (let i = 1; i < this.points.length; i++) {
      const prevPoint = this.points[i - 1];
      const currentPoint = this.points[i];
      context.beginPath();
      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.moveTo(prevPoint.x, prevPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
      context.closePath();
    }
  }
}

const lines: Array<Line> = [];
let currentLine: Line | null = null;
const redoStack: Array<Line> = [];

function dispatchDrawingChangedEvent() {
  const event = new CustomEvent("drawing-changed");
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
}

canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  isDrawing = true;
  currentLine = new Line(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentLine) {
    const newX = e.offsetX;
    const newY = e.offsetY;
    currentLine.drag(newX, newY);
    dispatchDrawingChangedEvent();
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

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);
clearButton.addEventListener("click", () => {
  lines.length = 0;
  redoStack.length = 0;
  dispatchDrawingChangedEvent();
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);
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
app.append(redoButton);
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoLine = redoStack.pop();
    if (redoLine) {
      lines.push(redoLine);
    }
    dispatchDrawingChangedEvent();
  }
});
