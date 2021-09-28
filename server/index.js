import { WebSocketServer } from "ws";
import canvas from "canvas";
const { createCanvas } = canvas;

const wss = new WebSocketServer({ port: 8080 });

const gameLength = 120; // seconds

wss.on("connection", (ws) => {
  console.log("Connection received");
  const state = {
    started: false,
    ended: false,
    bubbles: {
      correct: {},
      wrong: {},
    },
    score: 0,
  };

  let nextBubbleId = 0;

  function addBubble() {
    if (state.ended) {
      return;
    }

    const id = nextBubbleId++;
    const duration = 3;
    let img;
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    if (Math.random() > 0.66) {
      state.bubbles.correct[id] = {
        id: id,
        duration: duration,
      };
      ctx.fillText("4+4", 0, 0);
    } else {
      state.bubbles.wrong[id] = {
        id: id,
        duration: duration,
      };
      ctx.fillText("4+2-2", 0, 0);
    }
    img = canvas.toDataURL();
    ws.send(
      JSON.stringify({
        signal: 3, // new bubble
        data: {
          // bubble object
          id: id,
          duration: duration,
          img: img,
        },
      })
    );
    setTimeout(addBubble, 1000);
  }

  function endGame() {
    ws.send(
      JSON.stringify({
        signal: 6, // game results
        data: {
          score: state.score,
        },
      })
    );
  }

  ws.on("message", (messageStr) => {
    console.log("received: %s", messageStr);
    const message = JSON.parse(messageStr);
    switch (message.signal) {
      case 1: // game start
        console.log("Starting game!");
        if (state.started) {
          ws.close();
        }
        state.started = true;
        state.startTime = Date.now();
        state.target = 8;

        setTimeout(() => {
          state.ended = true;
          endGame();
        }, gameLength * 1000);

        addBubble();
        break;
      case 2: // end game early
        if (state.ended) {
          return;
        }
        state.ended = true;
        endGame();
        break;
      case 4: // bubble clicked
        if (!state.started) {
          ws.close();
        }
        if (state.ended) {
          return;
        }
        if (state.bubbles.correct[message.data.id]) {
          state.score += 1;
        } else if (state.bubbles.wrong[message.data.id]) {
          state.score -= 1;
        }
        ws.send(
          JSON.stringify({
            signal: 5, // score update
            data: {
              score: state.score,
            },
          })
        );
        break;
    }
  });
});
