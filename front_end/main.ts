//http methods
interface HttpPostCallback {
    (x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
const g_id = random_id(12);

// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
    let request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        if(request.readyState === 4)
        {
            if(request.status === 200) {
                let response_obj;
                try {
                    response_obj = JSON.parse(request.responseText);
                } catch(err) {}
                if (response_obj) {
                    callback(response_obj);
                } else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            } else {
                if(request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                } else {
                    callback({
                        status: 'error',
                        message: `server returned status ${request.status}: ${request.statusText}`,
                    });
                }
            }
        }
    };
    request.open('post', `${g_origin}/${page_name}`, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
}

//blank interfaces
interface OnClickHandler {
    (x:number, y:number): void;
}

interface UpdateHandler {
    (): void
}

class Sprite {
    id: string;
    x: number;
    y: number;
    speed: number;
    image: HTMLImageElement;
    update: UpdateHandler;
    onclick: OnClickHandler;
    dest_x: number = 50;
    dest_y: number = 50;

    constructor(id: string, x: number, y: number, image_url: string, update_method: UpdateHandler, onclick_method: OnClickHandler) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.speed = 4;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
    }

    set_destination(x: number, y: number) {
        this.dest_x = x;
        this.dest_y = y;
    }

    ignore_click(x: number, y: number) {
    }

    move(dx: number, dy: number) {
        this.dest_x = this.x + dx;
        this.dest_y = this.y + dy;
    }

    go_toward_destination() {
        if(this.dest_x === undefined)
            return;

        if(this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if(this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if(this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if(this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    }

    sit_still() {
    }
}






class Model {
    sprites: Sprite[];
    turtle: Sprite;

    constructor() {
        this.sprites = [];
        this.sprites.push(new Sprite('lettuce',200, 100, "lettuce.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
        this.turtle = new Sprite(g_id,50, 50, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
        this.sprites.push(this.turtle);
    }

    update() {
        for (const sprite of this.sprites) {
            sprite.update();
        }
    }

    onclick(x: number, y: number) {
        for (const sprite of this.sprites) {
            sprite.onclick(x, y);
        }
    }

    move(dx: number, dy: number) {
        this.turtle.move(dx, dy);
    }
}


class View
{
    model: Model;
    canvas: HTMLCanvasElement;
    turtle: HTMLImageElement;

    constructor(model: Model) {
        this.model = model;
        this.canvas = <HTMLCanvasElement> document.getElementById("myCanvas");
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
    }

    update() {
        let ctx = this.canvas.getContext("2d");
        ctx?.clearRect(0, 0, 1000, 500);
        for (const sprite of this.model.sprites) {
            ctx?.drawImage(sprite.image, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height);
        }
    }
}


class Controller {
    model: Model;
    view: View;
    key_right: boolean;
    key_left: boolean;
    key_up: boolean;
    key_down: boolean;
    first_load: boolean;
    last_update_request_time: number;

    constructor(model: Model, view: View) {
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        this.first_load = true;
        this.last_update_request_time = Date.now();
        let self = this;
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

    onAcknowledgeClick(ob: any) {
        console.log(`Response to move: ${JSON.stringify(ob)}`);
    }

    onLoad() {
        httpPost('ajax.html', {
            id: g_id,
            action: 'load',
            x: this.model.turtle.x,
            y: this.model.turtle.y,
        }, this.update_handler.bind(this))
    }

    onClick(event: MouseEvent) {
        const x = event.pageX - this.view.canvas.offsetLeft;
        const y = event.pageY - this.view.canvas.offsetTop;

        //send http message to backend
        httpPost('ajax.html', {
            id: g_id,
            action: 'move',
            x: x,
            y: y,
        }, this.onAcknowledgeClick);

        this.model.onclick(x, y);
    }

    keyDown(event: KeyboardEvent) {
        if (event.keyCode == 39) this.key_right = true;
        else if (event.keyCode == 37) this.key_left = true;
        else if (event.keyCode == 38) this.key_up = true;
        else if (event.keyCode == 40) this.key_down = true;
    }

    keyUp(event: KeyboardEvent) {
        if (event.keyCode == 39) this.key_right = false;
        else if (event.keyCode == 37) this.key_left = false;
        else if (event.keyCode == 38) this.key_up = false;
        else if (event.keyCode == 40) this.key_down = false;
    }

    request_updates() {
        httpPost('ajax.html', {
            id: g_id,
            action: 'update',
        }, ob => {
            console.log(`Response to update: ${JSON.stringify(ob)}`);
            let objects = JSON.parse(JSON.stringify(ob));
            let updates = objects['updates'];
            for (let obj: number = 0; obj < updates.length; obj++) {
                let exists = false;
                for (let i: number = 0; i < this.model.sprites.length; i++) {
                    if (this.model.sprites[i].id == updates[obj][0]) {
                        console.log((this.model.sprites[i]));
                        this.model.sprites[i].set_destination(updates[obj][1], updates[obj][2]);
                        exists = true;
                        break;
                    }
                }

                //add new player if not found in sprites array
                if (!exists) {
                    let temp_sprite = new Sprite(
                        updates[obj][0],
                        50,
                        50,
                        "green_robot.png",
                        Sprite.prototype.go_toward_destination,
                        Sprite.prototype.ignore_click
                    )
                    this.model.sprites.push(temp_sprite);
                    temp_sprite.set_destination(updates[obj][1], [obj][2]);
                }
            }
        })
    }

    update_handler(ob: any) {
        console.log(`Response to update: ${JSON.stringify(ob)}`);
        let objects = JSON.parse(JSON.stringify(ob));
        let updates = objects['updates'];
        for (let obj: number = 0; obj < updates.length; obj++) {
            let exists = false;
            for (let i: number = 0; i < this.model.sprites.length; i++) {
                if (this.model.sprites[i].id == updates[obj][0]) {
                    console.log((this.model.sprites[i]));
                    this.model.sprites[i].set_destination(updates[obj][1], updates[obj][2]);
                    exists = true;
                    break;
                }
            }

            //add new player if not found in sprites array
            if (!exists) {
                let temp_sprite = new Sprite(
                    updates[obj][0],
                    50,
                    50,
                    "green_robot.png",
                    Sprite.prototype.go_toward_destination,
                    Sprite.prototype.ignore_click
                )
                this.model.sprites.push(temp_sprite);
                temp_sprite.set_destination(updates[obj][1], [obj][2]);
            }
        }
    }

    update() {
        if (this.first_load){
            this.onLoad()
            this.first_load = false
        }

        //check time for updates
        const time = Date.now();
        if (time - this.last_update_request_time >= 1000) {
            this.last_update_request_time = time;
            this.request_updates();
        }

        let dx = 0;
        let dy = 0;
        let speed = this.model.turtle.speed;
        if(this.key_right) dx += speed;
        if(this.key_left) dx -= speed;
        if(this.key_up) dy -= speed;
        if(this.key_down) dy += speed;
        if(dx != 0 || dy != 0)
            this.model.move(dx, dy);
    }
}





class Game {
    model: Model;
    view: View;
    controller: Controller;

    constructor() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }

    onTimer() {
        this.controller.update();
        this.model.update();
        this.view.update();
    }
}


let game = new Game();
let timer = setInterval(() => { game.onTimer(); }, 40);