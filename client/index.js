var websocket = new WebSocket("ws://localhost:8080");

const app = new PIXI.Application({
  width: 740,
  height: 460,
  backgroundColor: 0xffffff,
});

document.body.appendChild(app.view);
const container = new PIXI.Container();

websocket.onopen = function (event) {
  websocket.send("{}");
  var btn = document.createElement("Button");
  btn.innerHTML = "Start";
  document.body.appendChild(btn);
  btn.onclick = function () {
    startgame();
    document.body.appendChild(app.view);
  };
};

websocket.onmessage = function (event) {
  var msg = JSON.parse(event.data);
  console.log(msg.data.score);
  const sprite = PIXI.Sprite.from(msg.data.img);
  sprite.anchor.set(0);
  sprite.interactive = true;
  sprite.buttonMode = true;
  sprite.x = Math.random() * app.screen.width;
  sprite.y = Math.random() * app.screen.height;
  app.stage.addChild(container);
  container.addChild(sprite);
  sprite.on("pointerdown", (event) => {
    sprite.destroy();
    websocket.send(
      JSON.stringify({
        signal: 4,
        data: {
          id: msg.data.id,
        },
      })
    );
  });
};

function startgame() {
  websocket.send(JSON.stringify({ signal: 1 }));
}

console.log("Hello");
//websocket.send("Connection established");
// Create the application helper and add its render target to the page

//document.body.appendChild(app.view);
// Create the sprite and add it to the stage
//let sprite = PIXI.Sprite.from("sample.png");
//app.stage.addChild(sprite);

// Add a ticker callback to move the sprite back and forth
//let elapsed = 0.0;
//app.ticker.add((delta) => {
// elapsed += delta;
// sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0;
//});
