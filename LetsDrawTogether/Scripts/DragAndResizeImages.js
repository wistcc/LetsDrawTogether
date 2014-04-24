var canvas = document.getElementById("can");
var ctx = canvas.getContext("2d");

var canvasOffset = $("#can").offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;

var startX;
var startY;
var isDown = false;
var img = new Image();


var pi2 = Math.PI * 2;
var resizerRadius = 8;
var rr = resizerRadius * resizerRadius;
var draggingResizer = {
    x: 0,
    y: 0
};
var imageX = 50;
var imageY = 50;
var imageWidth, imageHeight, imageRight, imageBottom;
var draggingImage = false;
var startX;
var startY;

function drawImg(withAnchors, withBorders) {
    // clear the canvas
    if (draggingImage || (draggingResizer > -1)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // draw the image
    ctx.drawImage(img, 0, 0, img.width, img.height, imageX, imageY, imageWidth, imageHeight);

    // optionally draw the draggable anchors
    if (withAnchors) {
        drawDragAnchor(imageX, imageY);
        drawDragAnchor(imageRight, imageY);
        drawDragAnchor(imageRight, imageBottom);
        drawDragAnchor(imageX, imageBottom);
    }

    // optionally draw the connecting anchor lines
    if (withBorders) {
        ctx.beginPath();
        ctx.moveTo(imageX, imageY);
        ctx.lineTo(imageRight, imageY);
        ctx.lineTo(imageRight, imageBottom);
        ctx.lineTo(imageX, imageBottom);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawDragAnchor(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, resizerRadius, 0, pi2, false);
    ctx.closePath();
    ctx.fill();
}

function anchorHitTest(x, y) {
    var dx, dy;

    // top-left
    dx = x - imageX;
    dy = y - imageY;
    if (dx * dx + dy * dy <= rr) {
        return (0);
    }
    // top-right
    dx = x - imageRight;
    dy = y - imageY;
    if (dx * dx + dy * dy <= rr) {
        return (1);
    }
    // bottom-right
    dx = x - imageRight;
    dy = y - imageBottom;
    if (dx * dx + dy * dy <= rr) {
        return (2);
    }
    // bottom-left
    dx = x - imageX;
    dy = y - imageBottom;
    if (dx * dx + dy * dy <= rr) {
        return (3);
    }
    return (-1);
}

function hitImage(x, y) {
    return (x > imageX && x < imageX + imageWidth && y > imageY && y < imageY + imageHeight);
}

function handleMouseDown(clientX, clientY) {
    startX = parseInt(clientX - offsetX);
    startY = parseInt(clientY - offsetY);
    
    draggingResizer = anchorHitTest(startX, startY);
    draggingImage = draggingResizer < 0 && hitImage(startX, startY);
    return (draggingResizer > -1) || draggingImage;
}

function updateDragginResizerFromServer(resizer) {
    draggingResizer = resizer;
}

function getDragginResizer() {
    return draggingResizer;
}

function handleMouseUp() {
    draggingResizer = -1;
    draggingImage = false;
    drawImg(false, false);
}

function handleMouseOut() {
    handleMouseUp();
}

function handleMouseMove(clientX, clientY) {
    if (draggingResizer > -1) {
        mouseX = parseInt(clientX - offsetX);
        mouseY = parseInt(clientY - offsetY);

        // resize the image
        switch (draggingResizer) {
            case 0:
                //top-left
                imageX = mouseX;
                imageWidth = imageRight - mouseX;
                imageY = mouseY;
                imageHeight = imageBottom - mouseY;
                break;
            case 1:
                //top-right
                imageY = mouseY;
                imageWidth = mouseX - imageX;
                imageHeight = imageBottom - mouseY;
                break;
            case 2:
                //bottom-right
                imageWidth = mouseX - imageX;
                imageHeight = mouseY - imageY;
                break;
            case 3:
                //bottom-left
                imageX = mouseX;
                imageWidth = imageRight - mouseX;
                imageHeight = mouseY - imageY;
                break;
        }

        if (imageWidth < 25) { imageWidth = 25; }
        if (imageHeight < 25) { imageHeight = 25; }

        // set the image right and bottom
        imageRight = imageX + imageWidth;
        imageBottom = imageY + imageHeight;

        // redraw the image with resizing anchors
        drawImg(false, true);

    } else if (draggingImage) {
        imageClick = false;

        mouseX = parseInt(clientX - offsetX);
        mouseY = parseInt(clientY - offsetY);

        // move the image by the amount of the latest drag
        var dx = mouseX - startX;
        var dy = mouseY - startY;
        imageX += dx;
        imageY += dy;
        imageRight += dx;
        imageBottom += dy;
        // reset the startXY for next time
        startX = mouseX;
        startY = mouseY;

        // redraw the image with border
        drawImg(false, true);
    }
}