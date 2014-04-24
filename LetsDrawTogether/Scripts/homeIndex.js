var fromServer = false;

var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

var x = "black",
    y = 2;

canvas = document.getElementById('can');
ctx = canvas.getContext("2d");
w = canvas.width;
h = canvas.height;

$(function () {
    $("#can").jqScribble();

    if (typeof (localStorage) == 'undefined') {
        alert('Your browser does not support HTML5 localStorage. Try upgrading.');
    } else {
        try {
            localStorage.setItem('DrawGuId', guid()); //saves to the database, “key”, “value”

            var rect = canvas.getBoundingClientRect();
            localStorage.setItem('CanvasTop', rect.top);
            localStorage.setItem('CanvasLeft', rect.left);
            localStorage.setItem('CanvasBottom', rect.bottom);
            localStorage.setItem('CanvasRight', rect.right);
        } catch (e) {
            alert(e); //data wasn’t successfully saved due to quota exceed so throw an error
        }
    }

    //SignalR
    var hub = $.connection.hubController;

    // Create a function that the hub can call to broadcast messages.
    hub.client.drawTogether = function (res, clientX, clientY, fromLeft, fromTop, fromBottom, fromRight, mouseOrTouchType, resizer, canDraw) {
        switch (mouseOrTouchType) {
            case MouseOrTouchType.Move:
                handleMouseMove(convertPosition(clientX, fromLeft, fromTop, fromBottom, fromRight, true), convertPosition(clientY, fromLeft, fromTop, fromBottom, fromRight, false));
                break;
            case MouseOrTouchType.Out:
                handleMouseOut();
                break;
            case MouseOrTouchType.Down:
                handleMouseDown(convertPosition(clientX, fromLeft, fromTop, fromBottom, fromRight, true), convertPosition(clientY, fromLeft, fromTop, fromBottom, fromRight, false));
                updateDragginResizerFromServer(resizer);
                break;
        }

        if (canDraw) {
            findxy(res, convertPosition(clientX, fromLeft, fromTop, fromBottom, fromRight, true), convertPosition(clientY, fromLeft, fromTop, fromBottom, fromRight, false));
        }
    };
    hub.client.changeColor = function (color) {
        x = color;
        if (x == "white") y = 14;
        else y = 2;
    };
    hub.client.addImage = function (imgUrl) {
        fromServer = true;
        createImg(imgUrl);
    };
    hub.client.clear = function (btnId) {
        fromServer = true;
        if (confirm("Want to clear?")) {
            clearAll();
        }
    };
    hub.client.newGroup = function (groupId) {
        $("#groupId").html("Draw Id number: " + groupId);
        $("#drawIdToSend").val("");
    };

    // Start the connection.
    $.connection.hub.start().done(function () {
        hub.server.joinGroup(localStorage["DrawGuId"]);
        $("#groupId").html("Draw Id number: " + localStorage["DrawGuId"]);

        $("#sendDrawId").click(function () {
            hub.server.joinToSpecificGroup($("#drawIdToSend").val(), localStorage["DrawGuId"]);
            localStorage.setItem('DrawGuId', $("#drawIdToSend").val());
        });
        canvas.addEventListener("touchstart", function (e) {
            var touchEvent = e.changedTouches[0];
            if (!handleMouseDown(touchEvent.pageX, touchEvent.pageY)) {
                var res = 'down';
                hub.server.drawTogether(res, touchEvent.pageX, touchEvent.pageY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], 0, 0, true);
                findxy(res, touchEvent.pageX, touchEvent.pageY);
            } else {
                hub.server.drawTogether('', touchEvent.pageX, touchEvent.pageY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Down, getDragginResizer(), false);
            }
        }, false);
        canvas.addEventListener("touchend", function (e) {
            var res = 'out';
            var touchEvent = e.changedTouches[0];
            hub.server.drawTogether(res, touchEvent.pageX, touchEvent.pageY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Out, 0, true);
            handleMouseOut();
            findxy(res, touchEvent.pageX, touchEvent.pageY);
        }, false);
        canvas.addEventListener("touchmove", function (e) {
            var res = 'move';
            var touchEvent = e.changedTouches[0];
            hub.server.drawTogether(res, touchEvent.pageX, touchEvent.pageY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Move, 0, true);
            handleMouseMove(touchEvent.pageX, touchEvent.pageY);
            findxy(res, touchEvent.pageX, touchEvent.pageY);
        }, false);
        canvas.addEventListener("mousemove", function (e) {
            var res = 'move';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Move, 0, true);
            handleMouseMove(e.clientX, e.clientY);
            findxy(res, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mousedown", function (e) {
            if (!handleMouseDown(e.clientX, e.clientY)) {
                var res = 'down';
                hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], 0, 0, true);
                findxy(res, e.clientX, e.clientY);
            } else {
                hub.server.drawTogether('', e.clientX, e.clientY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Down, getDragginResizer(), false);
            }
        }, false);
        canvas.addEventListener("mouseup", function (e) {
            var res = 'up';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Out, 0, true);
            handleMouseUp(e);
            findxy(res, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mouseout", function (e) {
            var res = 'out';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["CanvasLeft"], localStorage["CanvasTop"], localStorage["CanvasBottom"], localStorage["CanvasRight"], localStorage["DrawGuId"], MouseOrTouchType.Out, 0, true);
            handleMouseOut();
            findxy(res, e.clientX, e.clientY);
        }, false);

        $("#sendImgUrl").click(function () {
            if (!fromServer) {
                hub.server.addImage($(this).val(), localStorage["DrawGuId"]);
            } else {
                fromServer = false;
            }
        });

        $(".colors").click(function color() {
            var obj = $(this);
            hub.server.changeColor(obj.attr("id"), localStorage["DrawGuId"]);
            switch (obj.attr("id")) {
                case "green":
                    x = "green";
                    break;
                case "blue":
                    x = "blue";
                    break;
                case "red":
                    x = "red";
                    break;
                case "yellow":
                    x = "yellow";
                    break;
                case "orange":
                    x = "orange";
                    break;
                case "black":
                    x = "black";
                    break;
                case "white":
                    x = "white";
                    break;
            }
            if (x == "white") y = 14;
            else y = 2;
        });

        $("#clr").click(function erase() {
            if (confirm("Want to clear?")) {
                if (!fromServer) {
                    hub.server.clear($(this).attr("id"), localStorage["DrawGuId"]);
                    clearAll();
                } else {
                    fromServer = false;
                }
            }
        });
    });

    function draw() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = x;
        ctx.lineWidth = y;
        ctx.stroke();
        ctx.closePath();
    }

    function findxy(res, clientX, clientY) {
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = clientX - canvas.offsetLeft;
            currY = clientY - canvas.offsetTop;

            flag = true;
            dot_flag = true;
            if (dot_flag) {
                ctx.beginPath();
                ctx.fillStyle = x;
                ctx.fillRect(currX, currY, 2, 2);
                ctx.closePath();
                dot_flag = false;
            }
            res = '';
        }
        if (res == 'up' || res == "out") {
            flag = false;
            res = '';
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = clientX - canvas.offsetLeft;
                currY = clientY - canvas.offsetTop;
                draw();
            }
            res = '';
        }
    }
});

function addImage() {
    var imgUrl = prompt("Enter the URL of the image.");
    if (imgUrl !== '') {
        $("#sendImgUrl").val(imgUrl);
        $("#sendImgUrl").trigger("click");
        createImg(imgUrl);
    }
}

function createImg(imgSrc) {
    img = new Image();
    img.onload = function () {
        imageWidth = img.width;
        imageHeight = img.height;
        imageRight = imageX + imageWidth;
        imageBottom = imageY + imageHeight;
        drawImg(false, false);
    }
    img.src = imgSrc;
}

function convertPosition(move, fromLeft, fromTop, fromBottom, fromRight, isX) {
    if (isX) {
        var diff1 = localStorage["CanvasRight"] - localStorage["CanvasLeft"];
        var diff2 = fromRight - fromLeft;
        var diff3 = 0;
        if (diff1 <= diff2) {
            diff3 = diff2 / diff1;
        } else {
            diff3 = diff1 / diff2;
        }

        if (localStorage["CanvasRight"] <= fromRight) {
            return move / diff3;
        }
        return move * diff3;
    }

    var diff4 = localStorage["CanvasBottom"] - localStorage["CanvasTop"];
    var diff5 = fromBottom - fromTop;
    var diff6 = 0;
    if (diff4 <= diff5) {
        diff6 = diff5 / diff4;
    } else {
        diff6 = diff4 / diff5;
    }

    if (localStorage["CanvasBottom"] <= fromBottom) {
        return move / diff6;
    }
    return move * diff6;
}

function clearAll() {
    img = new Image();
    $("#can").data("jqScribble").clear();

    w = canvas.width;
    h = canvas.height;
    fromServer = false;

    flag = false;
    prevX = 0;
    currX = 0;
    prevY = 0;
    currY = 0;
    dot_flag = false;

    x = "black";
    y = 2;
}