import "./style.css";

const APP_NAME = "Splonchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

const appCanvas = document.createElement("canvas");
appCanvas.height = 256;
appCanvas.width = 256;
const appCanvasContext = appCanvas.getContext("2d")!;
app.append(appCanvas);

let isDrawing = false;
let x = 0;
let y = 0;

const lines: Array<Array<{ x: number; y: number }>> = [];
let currentLine: Array<{ x: number; y: number }> = [];

function dispatchDrawingChangedEvent() {
  const event = new CustomEvent("drawing-changed");
  appCanvas.dispatchEvent(event);
}

function redrawCanvas() {
  appCanvasContext.clearRect(0, 0, appCanvas.width, appCanvas.height);
  
  lines.forEach((line) => {
    for (let i = 1; i < line.length; i++) {
      drawLine(appCanvasContext, line[i - 1].x, line[i - 1].y, line[i].x, line[i].y);
    }
  });

  if (currentLine.length > 1) {
    for (let i = 1; i < currentLine.length; i++) {
      drawLine(appCanvasContext, currentLine[i - 1].x, currentLine[i - 1].y, currentLine[i].x, currentLine[i].y);
    }
  }
}

appCanvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

appCanvas.addEventListener("mousedown", (e) => {
  x = e.offsetX;
  y = e.offsetY;
  isDrawing = true;
  currentLine = [{ x, y }];
});

appCanvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    const newX = e.offsetX;
    const newY = e.offsetY;
    currentLine.push({ x: newX, y: newY });
    dispatchDrawingChangedEvent();
  }
});

window.addEventListener("mouseup", () => {
  if (isDrawing) {
    lines.push(currentLine);
    currentLine = [];
    isDrawing = false;
    dispatchDrawingChangedEvent();
  }
});

function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  context.beginPath();
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.length = 0;
  dispatchDrawingChangedEvent();
});
