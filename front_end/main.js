"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var random_id = function (len) {
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return __spreadArray([], Array(len), true).reduce(function (a) { return a + p[Math.floor(Math.random() * p.length)]; }, '');
};
var g_origin = new URL(window.location.href).origin;
var g_id = random_id(12);
// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
var httpPost = function (page_name, payload, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var response_obj = void 0;
                try {
                    response_obj = JSON.parse(request.responseText);
                }
                catch (err) { }
                if (response_obj) {
                    callback(response_obj);
                }
                else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            }
            else {
                if (request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                }
                else {
                    callback({
                        status: 'error',
                        message: "server returned status ".concat(request.status, ": ").concat(request.statusText),
                    });
                }
            }
        }
    };
    request.open('post', "".concat(g_origin, "/").concat(page_name), true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
};
var Sprite = /** @class */ (function () {
    function Sprite(id, x, y, image_url, update_method, onclick_method) {
        this.dest_x = 50;
        this.dest_y = 50;
        this.id = id;
        this.x = x;
        this.y = y;
        this.speed = 4;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
    }
    Sprite.prototype.set_destination = function (x, y) {
        this.dest_x = x;
        this.dest_y = y;
    };
    Sprite.prototype.ignore_click = function (x, y) {
    };
    Sprite.prototype.move = function (dx, dy) {
        this.dest_x = this.x + dx;
        this.dest_y = this.y + dy;
    };
    Sprite.prototype.go_toward_destination = function () {
        if (this.dest_x === undefined)
            return;
        if (this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if (this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    };
    Sprite.prototype.sit_still = function () {
    };
    return Sprite;
}());
var Model = /** @class */ (function () {
    function Model() {
        this.sprites = [];
        this.sprites.push(new Sprite('lettuce', 200, 100, "lettuce.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
        this.turtle = new Sprite(g_id, 50, 50, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
        this.sprites.push(this.turtle);
    }
    Model.prototype.update = function () {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.update();
        }
    };
    Model.prototype.onclick = function (x, y) {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.onclick(x, y);
        }
    };
    Model.prototype.move = function (dx, dy) {
        this.turtle.move(dx, dy);
    };
    return Model;
}());
var View = /** @class */ (function () {
    function View(model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
    }
    View.prototype.update = function () {
        var ctx = this.canvas.getContext("2d");
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, 1000, 500);
        for (var _i = 0, _a = this.model.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height);
        }
    };
    return View;
}());
var Controller = /** @class */ (function () {
    function Controller(model, view) {
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        this.first_load = true;
        this.last_update_request_time = Date.now();
        var self = this;
        view.canvas.addEventListener("click", function (event) {
            self.onClick(event);
        });
        document.addEventListener('keydown', function (event) {
            self.keyDown(event);
        }, false);
        document.addEventListener('keyup', function (event) {
            self.keyUp(event);
        }, false);
    }
    Controller.prototype.onAcknowledgeClick = function (ob) {
        console.log("Response to move: ".concat(JSON.stringify(ob)));
    };
    Controller.prototype.onLoad = function () {
        httpPost('ajax.html', {
            id: g_id,
            action: 'load',
            x: this.model.turtle.x,
            y: this.model.turtle.y,
        }, this.update_handler.bind(this));
    };
    Controller.prototype.onClick = function (event) {
        var x = event.pageX - this.view.canvas.offsetLeft;
        var y = event.pageY - this.view.canvas.offsetTop;
        //send http message to backend
        httpPost('ajax.html', {
            id: g_id,
            action: 'move',
            x: x,
            y: y,
        }, this.onAcknowledgeClick);
        this.model.onclick(x, y);
    };
    Controller.prototype.keyDown = function (event) {
        if (event.keyCode == 39)
            this.key_right = true;
        else if (event.keyCode == 37)
            this.key_left = true;
        else if (event.keyCode == 38)
            this.key_up = true;
        else if (event.keyCode == 40)
            this.key_down = true;
    };
    Controller.prototype.keyUp = function (event) {
        if (event.keyCode == 39)
            this.key_right = false;
        else if (event.keyCode == 37)
            this.key_left = false;
        else if (event.keyCode == 38)
            this.key_up = false;
        else if (event.keyCode == 40)
            this.key_down = false;
    };
    Controller.prototype.request_updates = function () {
        var _this = this;
        httpPost('ajax.html', {
            id: g_id,
            action: 'update',
        }, function (ob) {
            console.log("Response to update: ".concat(JSON.stringify(ob)));
            var objects = JSON.parse(JSON.stringify(ob));
            var updates = objects['updates'];
            for (var obj = 0; obj < updates.length; obj++) {
                var exists = false;
                for (var i = 0; i < _this.model.sprites.length; i++) {
                    if (_this.model.sprites[i].id == updates[obj][0]) {
                        console.log((_this.model.sprites[i]));
                        _this.model.sprites[i].set_destination(updates[obj][1], updates[obj][2]);
                        exists = true;
                        break;
                    }
                }
                //add new player if not found in sprites array
                if (!exists) {
                    var temp_sprite = new Sprite(updates[obj][0], 50, 50, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
                    _this.model.sprites.push(temp_sprite);
                    temp_sprite.set_destination(updates[obj][1], [obj][2]);
                }
            }
        });
    };
    Controller.prototype.update_handler = function (ob) {
        console.log("Response to update: ".concat(JSON.stringify(ob)));
        var objects = JSON.parse(JSON.stringify(ob));
        var updates = objects['updates'];
        for (var obj = 0; obj < updates.length; obj++) {
            var exists = false;
            for (var i = 0; i < this.model.sprites.length; i++) {
                if (this.model.sprites[i].id == updates[obj][0]) {
                    console.log((this.model.sprites[i]));
                    this.model.sprites[i].set_destination(updates[obj][1], updates[obj][2]);
                    exists = true;
                    break;
                }
            }
            //add new player if not found in sprites array
            if (!exists) {
                var temp_sprite = new Sprite(updates[obj][0], 50, 50, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
                this.model.sprites.push(temp_sprite);
                temp_sprite.set_destination(updates[obj][1], [obj][2]);
            }
        }
    };
    Controller.prototype.update = function () {
        if (this.first_load) {
            this.onLoad();
            this.first_load = false;
        }
        //check time for updates
        var time = Date.now();
        if (time - this.last_update_request_time >= 1000) {
            this.last_update_request_time = time;
            this.request_updates();
        }
        var dx = 0;
        var dy = 0;
        var speed = this.model.turtle.speed;
        if (this.key_right)
            dx += speed;
        if (this.key_left)
            dx -= speed;
        if (this.key_up)
            dy -= speed;
        if (this.key_down)
            dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
    };
    return Controller;
}());
var Game = /** @class */ (function () {
    function Game() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }
    Game.prototype.onTimer = function () {
        this.controller.update();
        this.model.update();
        this.view.update();
    };
    return Game;
}());
var game = new Game();
var timer = setInterval(function () { game.onTimer(); }, 40);
