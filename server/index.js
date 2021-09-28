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
    ctx.fillStyle = "#000";
    ctx.font = `${"normal"} ${18}px ${"Helvetica"}`;
    ctx.textBaseline = "top"; // required
    if (Math.random() > 0.66) {
      state.bubbles.correct[id] = {
        id: id,
        time: Date.now(),
        duration: duration,
      };
      ctx.fillText("4+4", 0, 0);
    } else {
      state.bubbles.wrong[id] = {
        id: id,
        time: Date.now(),
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
        if (
          state.bubbles.correct[message.data.id] &&
          state.bubbles.correct[message.data.id].time +
            state.bubbles.correct[message.data.id].duration * 1000 >
            Date.now()
        ) {
          delete state.bubbles.correct[message.data.id]; // TODO: delete other bubbles after expiration
          state.score += 1;
          ws.send(
            JSON.stringify({
              signal: 5, // score update
              data: {
                id: message.data.id,
                correct: true,
                score: state.score,
              },
            })
          );
        } else if (
          state.bubbles.wrong[message.data.id] &&
          state.bubbles.wrong[message.data.id].time +
            state.bubbles.wrong[message.data.id].duration * 1000 >
            Date.now()
        ) {
          state.score -= 1;
          ws.send(
            JSON.stringify({
              signal: 5, // score update
              data: {
                id: message.data.id,
                correct: false,
                score: state.score,
              },
            })
          );
        }
        break;
    }
  });
});
