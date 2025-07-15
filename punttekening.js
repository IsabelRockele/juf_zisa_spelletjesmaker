// --- punttekening.js start ---

// Elementen van de gecombineerde HTML
const canvas = document.getElementById("mainCanvas"); // Hoofdcanvas
const ctx = canvas.getContext("2d");
const dikteInput = document.getElementById("dikte");
let tool = "bekijken"; // Standaard tool voor punten plaatsen
const gumVormSelect = document.getElementById("gumvorm");
let gumVorm = "circle";

const maxAantalInput = document.getElementById("maxAantal");
const clearAllBtn = document.getElementById("clearAllBtn");
const undoBtn = document.getElementById("undoBtn");
const opnieuwBtn = document.getElementById("opnieuwBtn"); // NIEUWE KNOP
const fileInput = document.getElementById("fileInput");
const uploadImageBtn = document.getElementById("uploadImageBtn");
const showWorksheetBtn = document.getElementById("showWorksheetBtn");
const downloadEditedImageBtn = document.getElementById("downloadEditedImageBtn");
const outputJson = document.getElementById("outputJson");

const VIEWER_CANVAS_WIDTH = 512;
const VIEWER_CANVAS_HEIGHT = 768;

let punten = [];
let image = new Image();
let bestandsnaam = "punttekening"; // Standaardnaam voor downloads
let afbeeldingGeladen = false;

// Drie canvaslagen voor betere controle
let baseCanvas = document.createElement('canvas'); // Voor de geüploade afbeelding
let baseCtx = baseCanvas.getContext('2d');

let drawingCanvas = document.createElement('canvas'); // Voor getekende lijnen
let drawingCtx = drawingCanvas.getContext('2d');

let pointsCanvas = document.createElement('canvas'); // Voor de rode punten
let pointsCtx = pointsCanvas.getContext('2d');

let drawnStrokes = [];
let currentStroke = []; // Tijdelijke array voor de huidige lijn (vrije lijn) of gum-sessie tracking

let undoStack = [];
const MAX_UNDO_STATES = 20;

// Constanten voor lijn smoothing
const SPLINE_TENSION = 0.1;
const SPLINE_SEGMENTS_PER_POINT = 80;
const RDP_SIMPLIFICATION_EPSILON = 0.5;
const SMOOTHING_FACTOR = 0.5;

let lastPoint = null; // Voor vrije lijn smoothing
const MIN_DISTANCE_FOR_POINT = 1;

let startPoint = null; // Startpunt voor rechte lijn en cirkel

// Variabele om de huidige muispositie vast te houden voor realtime tekenen
let currentMousePos = {
    x: 0,
    y: 0
};


// --- Initialisatie en Laadlogica ---

document.querySelectorAll("input[name='tool']").forEach(input => {
    input.addEventListener("change", e => {
        tool = e.target.value;

        switch (tool) {
            case 'vrijeLijn':
            case 'rechteLijn':
            case 'cirkel':
                canvas.style.cursor = "url('icons/potlood.png'), auto";
                break;
            case 'gummen':
                canvas.style.cursor = "none";
                break;
            case 'bekijken':
            default:
                canvas.style.cursor = "default";
                break;
        }

        tekenAlles();
    });
});

// EVENT LISTENER VOOR DE NIEUWE KNOP
opnieuwBtn.addEventListener("click", resetApplication);

gumVormSelect.addEventListener("change", () => {
    gumVorm = gumVormSelect.value;
});

uploadImageBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (!file) return;

    bestandsnaam = file.name.split(".")[0];

    const reader = new FileReader();
    reader.onload = function (e) {
        image = new Image();
        image.onload = function () {
            afbeeldingGeladen = true;
            punten = [];
            drawnStrokes = [];
            currentStroke = [];
            undoStack = [];

            canvas.width = VIEWER_CANVAS_WIDTH;
            canvas.height = VIEWER_CANVAS_HEIGHT;
            baseCanvas.width = VIEWER_CANVAS_WIDTH;
            baseCanvas.height = VIEWER_CANVAS_HEIGHT;
            drawingCanvas.width = VIEWER_CANVAS_WIDTH;
            drawingCanvas.height = VIEWER_CANVAS_HEIGHT;
            pointsCanvas.width = VIEWER_CANVAS_WIDTH;
            pointsCanvas.height = VIEWER_CANVAS_HEIGHT;

            baseCtx.drawImage(image, 0, 0, baseCanvas.width, baseCanvas.height);
            redrawPoints();
            redrawDrawnStrokes();

            saveStateForUndo();
            tekenAlles();
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


// --- NIEUWE FUNCTIE OM ALLES TE RESETTEN ---
function resetApplication() {
    if (!confirm("Weet je zeker dat je opnieuw wilt beginnen? Alle wijzigingen gaan verloren.")) {
        return;
    }

    afbeeldingGeladen = false;
    punten = [];
    drawnStrokes = [];
    undoStack = [];
    image = new Image();
    bestandsnaam = "punttekening";

    canvas.width = VIEWER_CANVAS_WIDTH;
    canvas.height = VIEWER_CANVAS_HEIGHT;
    baseCanvas.width = VIEWER_CANVAS_WIDTH;
    baseCanvas.height = VIEWER_CANVAS_HEIGHT;
    drawingCanvas.width = VIEWER_CANVAS_WIDTH;
    drawingCanvas.height = VIEWER_CANVAS_HEIGHT;
    pointsCanvas.width = VIEWER_CANVAS_WIDTH;
    pointsCanvas.height = VIEWER_CANVAS_HEIGHT;

    tekenAlles();

    outputJson.value = "";
    fileInput.value = ""; 

    alert("De editor is gereset. Je kunt een nieuwe afbeelding uploaden.");
}


// --- Tekenfunctionaliteiten ---

function tekenAlles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(baseCanvas, 0, 0);
    ctx.drawImage(pointsCanvas, 0, 0);
    ctx.drawImage(drawingCanvas, 0, 0);

    if (isDrawing && currentMousePos) {
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = parseInt(dikteInput.value);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (tool === "vrijeLijn" && currentStroke.length > 0) {
            drawCatmullRomSpline(ctx, currentStroke, SPLINE_TENSION, SPLINE_SEGMENTS_PER_POINT, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(currentMousePos.x, currentMousePos.y, parseInt(dikteInput.value) / 2, 0, 2 * Math.PI);
            ctx.fillStyle = "black";
            ctx.fill();
        } else if (tool === "rechteLijn" && startPoint) {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentMousePos.x, currentMousePos.y);
            ctx.stroke();
        } else if (tool === "cirkel" && startPoint) {
            const radius = Math.sqrt(Math.pow(currentMousePos.x - startPoint.x, 2) + Math.pow(currentMousePos.y - startPoint.y, 2));
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function redrawDrawnStrokes() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawnStrokes.forEach(stroke => {
        drawingCtx.beginPath();
        drawingCtx.strokeStyle = stroke.color;
        drawingCtx.lineWidth = stroke.width;
        drawingCtx.lineCap = "round";
        drawingCtx.lineJoin = "round";

        if (stroke.type === 'vrijeLijn') {
            if (stroke.points && stroke.points.length > 1) {
                drawCatmullRomSpline(drawingCtx, stroke.points, SPLINE_TENSION, SPLINE_SEGMENTS_PER_POINT, false);
            }
        } else if (stroke.type === 'rechteLijn') {
            if (stroke.start && stroke.end) {
                drawingCtx.moveTo(stroke.start.x, stroke.start.y);
                drawingCtx.lineTo(stroke.end.x, stroke.end.y);
            }
        } else if (stroke.type === 'cirkel') {
            if (stroke.center && stroke.radius) {
                drawingCtx.arc(stroke.center.x, stroke.center.y, stroke.radius, 0, 2 * Math.PI);
            }
        }
        drawingCtx.stroke();
    });
}

function redrawPoints() {
    pointsCtx.clearRect(0, 0, pointsCanvas.width, pointsCanvas.height);

    punten.forEach(([x, y], i) => {
        const radius = 8;

        pointsCtx.beginPath();
        pointsCtx.arc(x, y, radius, 0, 2 * Math.PI);
        pointsCtx.fillStyle = "white";
        pointsCtx.fill();

        pointsCtx.beginPath();
        pointsCtx.arc(x, y, 4, 0, 2 * Math.PI);
        pointsCtx.fillStyle = "red";
        pointsCtx.fill();

        pointsCtx.save();
        pointsCtx.strokeStyle = "white";
        pointsCtx.lineWidth = 2;
        pointsCtx.font = "12px Arial";
        pointsCtx.textAlign = "left";
        pointsCtx.textBaseline = "bottom";

        pointsCtx.strokeText(i + 1, x + 6, y - 6);
        pointsCtx.fillText(i + 1, x + 6, y - 6);
        pointsCtx.restore();
    });
}

// Helpers voor Canvas State Management
function getCanvasImageData(sourceCanvas) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceCanvas.height;
    tempCtx.drawImage(sourceCanvas, 0, 0);
    return tempCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
}

function saveStateForUndo() {
    if (undoStack.length >= MAX_UNDO_STATES) {
        undoStack.shift();
    }
    undoStack.push({
        baseCanvasData: getCanvasImageData(baseCanvas),
        drawingCanvasData: getCanvasImageData(drawingCanvas),
        pointsData: getCanvasImageData(pointsCanvas),
        strokes: JSON.parse(JSON.stringify(drawnStrokes)),
        rawPunten: JSON.parse(JSON.stringify(punten))
    });
}

// --- Event Listeners voor Interactie ---

canvas.addEventListener("mousedown", (e) => {
    if (!afbeeldingGeladen) {
        alert("Upload eerst een afbeelding!");
        return;
    }

    const {
        x,
        y
    } = getPos(e);
    isDrawing = true;

    if (tool === "bekijken") {
        const maxAantal = parseInt(maxAantalInput.value);
        if (punten.length >= maxAantal) {
            alert(`Maximum aantal punten (${maxAantal}) bereikt.`);
            isDrawing = false;
            return;
        }
        saveStateForUndo();
        punten.push([x, y]);
        redrawPoints();
        tekenAlles();
        isDrawing = false;
    } else if (tool === "gummen") {
        saveStateForUndo();
        const gumDikte = parseInt(dikteInput.value);
        applyGumToCanvas(x, y, gumDikte, gumVorm, baseCtx);
        tekenAlles();
        currentStroke = [{
            x: -1,
            y: -1
        }];
    } else if (tool === "vrijeLijn" || tool === "rechteLijn" || tool === "cirkel") {
        saveStateForUndo();
        if (tool === "vrijeLijn") {
            currentStroke = [{
                x,
                y
            }];
            lastPoint = {
                x,
                y
            };
        } else if (tool === "rechteLijn" || tool === "cirkel") {
            startPoint = {
                x,
                y
            };
        }
        currentMousePos = {
            x,
            y
        };
        tekenAlles();
    }
});

canvas.addEventListener("mousemove", (e) => {
    const {
        x,
        y
    } = getPos(e);
    currentMousePos = {
        x,
        y
    };

    if (tool === "gummen" && afbeeldingGeladen) {
        tekenAlles();
        drawGumCursor(x, y, parseInt(dikteInput.value), gumVorm);
        if (!isDrawing) return;
    } else if (!isDrawing) {
        return;
    }

    if (tool === "gummen") {
        const gumDikte = parseInt(dikteInput.value);
        applyGumToCanvas(x, y, gumDikte, gumVorm, baseCtx);

        const tolerance = gumDikte / 2;
        let linesErasedThisMove = false;
        for (let i = drawnStrokes.length - 1; i >= 0; i--) {
            const stroke = drawnStrokes[i];
            if (isPointNearStroke(x, y, stroke, tolerance)) {
                drawnStrokes.splice(i, 1);
                linesErasedThisMove = true;
            }
        }

        if (linesErasedThisMove) {
            redrawDrawnStrokes();
        }
        tekenAlles();
    } else if (tool === "vrijeLijn") {
        let newX = x;
        let newY = y;

        if (lastPoint && currentStroke.length > 0) {
            newX = (x * SMOOTHING_FACTOR) + (currentStroke[currentStroke.length - 1].x * (1 - SMOOTHING_FACTOR));
            newY = (y * SMOOTHING_FACTOR) + (currentStroke[currentStroke.length - 1].y * (1 - SMOOTHING_FACTOR));
        }

        if (!lastPoint || Math.sqrt(Math.pow(newX - lastPoint.x, 2) + Math.pow(newY - lastPoint.y, 2)) > MIN_DISTANCE_FOR_POINT) {
            currentStroke.push({
                x: newX,
                y: newY
            });
            lastPoint = {
                x: newX,
                y: newY
            };
        }
        tekenAlles();
    } else if (tool === "rechteLijn" || tool === "cirkel") {
        tekenAlles();
    }
});

canvas.addEventListener("mouseup", (event) => {
    if (!isDrawing) return;

    isDrawing = false;
    lastPoint = null;

    if (tool === "gummen") {
        if (currentStroke.length > 0) {
            saveStateForUndo();
        }
        currentStroke = [];
    } else if (tool === "vrijeLijn") {
        if (currentStroke.length === 0) {
            const {
                x,
                y
            } = getPos(event);
            currentStroke.push({
                x,
                y
            });
        }
        if (currentStroke.length === 1) {
            currentStroke.push(currentStroke[0]);
        }

        const simplifiedPoints = simplifyPolyline(currentStroke, RDP_SIMPLIFICATION_EPSILON);
        drawnStrokes.push({
            type: 'vrijeLijn',
            points: simplifiedPoints,
            color: "black",
            width: parseInt(dikteInput.value)
        });

        redrawDrawnStrokes();
        currentStroke = [];
        saveStateForUndo();
    } else if (tool === "rechteLijn") {
        const {
            x,
            y
        } = getPos(event);
        if (startPoint) {
            drawnStrokes.push({
                type: 'rechteLijn',
                start: startPoint,
                end: {
                    x,
                    y
                },
                color: "black",
                width: parseInt(dikteInput.value)
            });
            startPoint = null;
            redrawDrawnStrokes();
            saveStateForUndo();
        }
    } else if (tool === "cirkel") {
        const {
            x,
            y
        } = getPos(event);
        if (startPoint) {
            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
            drawnStrokes.push({
                type: 'cirkel',
                center: startPoint,
                radius: radius,
                color: "black",
                width: parseInt(dikteInput.value)
            });
            startPoint = null;
            redrawDrawnStrokes();
            saveStateForUndo();
        }
    }
    tekenAlles();
});

canvas.addEventListener("mouseout", (event) => {
    if (tool === "gummen") {
        tekenAlles();
    }

    if ((tool === "vrijeLijn" || tool === "rechteLijn" || tool === "cirkel") && isDrawing) {
        canvas.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY
        }));
    } else if (isDrawing) {
        isDrawing = false;
        lastPoint = null;
        if (currentStroke.length > 0) {
            saveStateForUndo();
        }
        currentStroke = [];
        tekenAlles();
    }
});


// --- Helper functies ---

function applyGumToCanvas(x, y, size, form, targetCtx) {
    targetCtx.save();
    targetCtx.beginPath();
    if (form === "circle") {
        targetCtx.arc(x, y, size / 2, 0, 2 * Math.PI);
        targetCtx.clip();
        targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    } else {
        targetCtx.clearRect(x - size / 2, y - size / 2, size, size);
    }
    targetCtx.restore();
}

function drawGumCursor(x, y, size, form) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    if (form === "circle") {
        ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        ctx.stroke();
    } else {
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
}

function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.round(evt.clientX - rect.left),
        y: Math.round(evt.clientY - rect.top)
    };
}

function isPointNearStroke(pointX, pointY, stroke, tolerance) {
    if (stroke.type === 'vrijeLijn' && stroke.points) {
        for (let i = 0; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            const dist = Math.sqrt(Math.pow(pointX - p.x, 2) + Math.pow(pointY - p.y, 2));
            if (dist < tolerance) {
                return true;
            }
        }
    } else if (stroke.type === 'rechteLijn' && stroke.start && stroke.end) {
        const p1 = stroke.start;
        const p2 = stroke.end;

        const A = pointX - p1.x;
        const B = pointY - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const dist = Math.sqrt(Math.pow(pointX - xx, 2) + Math.pow(pointY - yy, 2));
        return dist < tolerance;

    } else if (stroke.type === 'cirkel' && stroke.center && stroke.radius) {
        const distFromCenter = Math.sqrt(Math.pow(pointX - stroke.center.x, 2) + Math.pow(pointY - stroke.center.y, 2));
        return Math.abs(distFromCenter - stroke.radius) < tolerance;
    }
    return false;
}

function drawCatmullRomSpline(ctx, points, tension = 0.5, numOfSegments = 30, close = false) {
    const count = points.length;
    if (count < 2) {
        if (count === 1) {
            ctx.beginPath();
            ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2, true);
            ctx.fill();
        }
        return;
    }
    if (count === 2) {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        return;
    }

    function hermite(t, p0, p1, m0, m1) {
        const t2 = t * t;
        const t3 = t2 * t;
        const h1 = 2 * t3 - 3 * t2 + 1;
        const h2 = -2 * t3 + 3 * t2;
        const h3 = t3 - 2 * t2 + t;
        const h4 = t3 - t2;
        return h1 * p0 + h2 * p1 + h3 * m0 + h4 * m1;
    }

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < count - 1; i++) {
        let p0 = points[i];
        let p1 = points[i + 1];
        let p_prev, p_next;

        if (i === 0) {
            p_prev = {
                x: points[0].x - (points[1].x - points[0].x),
                y: points[0].y - (points[1].y - points[0].y)
            };
        } else {
            p_prev = points[i - 1];
        }

        if (i === count - 2) {
            p_next = {
                x: points[count - 1].x + (points[count - 1].x - points[count - 2].x),
                y: points[count - 1].y + (points[count - 1].y - points[count - 2].y)
            };
        } else {
            p_next = points[i + 2];
        }

        const m0x = tension * (p1.x - p_prev.x);
        const m0y = tension * (p1.y - p_prev.y);
        const m1x = tension * (p_next.x - p0.x);
        const m1y = tension * (p_next.y - p0.y);

        for (let t = 0; t <= 1; t += 1 / numOfSegments) {
            const x = hermite(t, p0.x, p1.x, m0x, m1x);
            const y = hermite(t, p0.y, p1.y, m0y, m1y);
            ctx.lineTo(x, y);
        }
    }
    ctx.lineTo(points[count - 1].x, points[count - 1].y);
    if (close) {
        ctx.closePath();
    }
}

function simplifyPolyline(points, epsilon) {
    if (points.length <= 2) return points;

    let dmax = 0;
    let index = 0;
    const end = points.length - 1;
    const start = 0;

    const lineDistance = (p1, p2, p) => {
        const A = p.x - p1.x;
        const B = p.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        const dx = p.x - xx;
        const dy = p.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    for (let i = start + 1; i < end; i++) {
        const d = lineDistance(points[start], points[end], points[i]);
        if (d > dmax) {
            index = i;
            dmax = d;
        }
    }

    if (dmax > epsilon) {
        const recResults1 = simplifyPolyline(points.slice(start, index + 1), epsilon);
        const recResults2 = simplifyPolyline(points.slice(index, end + 1), epsilon);
        return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
    } else {
        return [points[start], points[end]];
    }
}


// --- Algemene bewerkingsknoppen ---

undoBtn.addEventListener("click", () => {
    if (undoStack.length > 1) {
        undoStack.pop();
        const previousState = undoStack[undoStack.length - 1];

        baseCtx.putImageData(previousState.baseCanvasData, 0, 0);
        drawingCtx.putImageData(previousState.drawingCanvasData, 0, 0);
        pointsCtx.putImageData(previousState.pointsData, 0, 0);

        drawnStrokes = JSON.parse(JSON.stringify(previousState.strokes));
        punten = JSON.parse(JSON.stringify(previousState.rawPunten));

        redrawDrawnStrokes();
        redrawPoints();
        tekenAlles();
    } else if (undoStack.length === 1) {
        punten = [];
        drawnStrokes = [];

        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        if (afbeeldingGeladen && image.src) {
            baseCtx.drawImage(image, 0, 0, baseCanvas.width, baseCanvas.height);
        }

        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        pointsCtx.clearRect(0, 0, pointsCanvas.width, pointsCanvas.height);

        redrawPoints();
        redrawDrawnStrokes();
        tekenAlles();
        saveStateForUndo();
    }
});

clearAllBtn.addEventListener("click", () => {
    if (!confirm("Weet u zeker dat u alle punten en getekende lijnen wilt wissen? De geüploade afbeelding blijft behouden.")) {
        return;
    }
    saveStateForUndo();
    punten = [];
    drawnStrokes = [];

    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    pointsCtx.clearRect(0, 0, pointsCanvas.width, pointsCanvas.height);

    redrawPoints();
    redrawDrawnStrokes();
    tekenAlles();
    outputJson.value = "";
});


// --- jsPDF integratie ---
showWorksheetBtn.addEventListener("click", async () => {
    if (!afbeeldingGeladen) {
        alert("Upload eerst een afbeelding!");
        return;
    }
    if (punten.length === 0 && drawnStrokes.length === 0) {
        alert("Plaats punten en/of teken lijnen voordat u een werkblad genereert.");
        return;
    }

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    exportCtx.drawImage(baseCanvas, 0, 0);
    exportCtx.drawImage(drawingCanvas, 0, 0);
    exportCtx.drawImage(pointsCanvas, 0, 0);

    const dataURL = exportCanvas.toDataURL("image/png");

    const {
        jsPDF
    } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = imgWidth / imgHeight;

    let pdfImgWidth = pageWidth - 20;
    let pdfImgHeight = pdfImgWidth / ratio;

    if (pdfImgHeight > pageHeight - 40) {
        pdfImgHeight = pageHeight - 40;
        pdfImgWidth = pdfImgHeight * ratio;
    }

    const xPos = (pageWidth - pdfImgWidth) / 2;
    const yPos = (pageHeight - pdfImgHeight) / 2;

    doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);

    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('nl-BE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Gegenereerd op: ${date}`, pageWidth / 2, pageHeight - 10, {
        align: 'center'
    });

    doc.save(`${bestandsnaam}_werkblad.pdf`);
});

// --- PNG Download ---
downloadEditedImageBtn.addEventListener("click", () => {
    if (!afbeeldingGeladen) {
        alert("Upload eerst een afbeelding!");
        return;
    }

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    exportCtx.drawImage(baseCanvas, 0, 0);
    exportCtx.drawImage(drawingCanvas, 0, 0);
    exportCtx.drawImage(pointsCanvas, 0, 0);

    const dataURL = exportCanvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataURL;
    a.download = bestandsnaam + "_bewerkt.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// --- Begin initiële opzet ---
canvas.width = VIEWER_CANVAS_WIDTH;
canvas.height = VIEWER_CANVAS_HEIGHT;
baseCanvas.width = VIEWER_CANVAS_WIDTH;
baseCanvas.height = VIEWER_CANVAS_HEIGHT;
drawingCanvas.width = VIEWER_CANVAS_WIDTH;
drawingCanvas.height = VIEWER_CANVAS_HEIGHT;
pointsCanvas.width = VIEWER_CANVAS_WIDTH;
pointsCanvas.height = VIEWER_CANVAS_HEIGHT;

tekenAlles();
// --- Eind initiële opzet ---