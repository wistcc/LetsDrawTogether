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
        } catch (e) {
            alert(e); //data wasn’t successfully saved due to quota exceed so throw an error
        }
    }

    //SignalR
    var hub = $.connection.hubController;

    // Create a function that the hub can call to broadcast messages.
    hub.client.drawTogether = function (res, clientX, clientY) {
        findxy(res, clientX, clientY);
    };
    hub.client.changeColor = function (color) {
        x = color;
        if (x == "white") y = 14;
        else y = 2;
    };
    hub.client.addImage = function (imgUrl) {
        fromServer = true;
        $("#can").data("jqScribble").update({ backgroundImage: imgUrl });
    };
    hub.client.clear = function (btnId) {
        fromServer = true;
        $("#" + btnId).trigger("click");
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

        canvas.addEventListener("mousemove", function (e) {
            var res = 'move';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["DrawGuId"]);
            findxy(res, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mousedown", function (e) {
            var res = 'down';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["DrawGuId"]);
            findxy(res, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mouseup", function (e) {
            var res = 'up';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["DrawGuId"]);
            findxy(res, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mouseout", function (e) {
            var res = 'out';
            hub.server.drawTogether(res, e.clientX, e.clientY, localStorage["DrawGuId"]);
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
            if (confirm("Want to clear")) {
                if (!fromServer) {
                    hub.server.clear($(this).attr("id"), localStorage["DrawGuId"]);
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
        }
        if (res == 'up' || res == "out") {
            flag = false;
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = clientX - canvas.offsetLeft;
                currY = clientY - canvas.offsetTop;
                draw();
            }
        }
    }
});

function addImage() {
    var img = prompt("Enter the URL of the image.");
    if (img !== '') {
        $("#sendImgUrl").val(img);
        $("#sendImgUrl").trigger("click");
        $("#can").data("jqScribble").update({ backgroundImage: img });
    }
}
