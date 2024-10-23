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
const appCanvasContext = appCanvas.getContext("2d");
app.append(appCanvas);

let isDrawing = false;
let x = 0;
let y = 0;

appCanvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
  });
  
  appCanvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      drawLine(appCanvasContext, x, y, e.offsetX, e.offsetY);
      x = e.offsetX;
      y = e.offsetY;
    }
  });
  
  window.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      drawLine(appCanvasContext, x, y, e.offsetX, e.offsetY);
      x = 0;
      y = 0;
      isDrawing = false;
    }
  });
  
  function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
  }

  const clearButton = document.createElement("button");
  clearButton.innerHTML = "clear";
  app.append(clearButton);
  clearButton.addEventListener("click", () => {
    appCanvasContext?.clearRect(0, 0, appCanvas.width, appCanvas.height);
  });