/*
👩🏽‍💻 user/search: q: Greg
  📨 goog/msg/header: subject: Friday gig
  📨 goog/msg/header: subject: Great jam
    📨 goog/msg/body: subject: Friday gig, att: []
    📨 goog/msg/body: subject: Great jam, att: [jam.mp3, jam2.mp3]
    📨 goog/att/id: att: jam.mp3
    📨 goog/att/id: att: jam2.mp3
  🛰 net/att/start: att: jam.mp3
  🛰 net/att/finish: att: jam.mp3, bytes: ed5e27a...
🔊 player/play: att: jam.mp3, bytes: ed5e27a...
  🛰 net/att/start: att: jam2.mp3
  🛰 net/att/finish: att: jam2.mp3, bytes: 4cd26f0...
🔊 player/complete: att: jam.mp3, bytes: ed5e27a...
🔊 player/play: att: jam2.mp3, bytes: 4cd26f0...
🔊 player/complete: att: jam2.mp3, bytes: 4cd26f0...

*/
const { agent, after, from, concat, randomId } = require("rx-helper");

const indent = ({ type }) => {
  const spaces = {
    "user/search": "",
    "player/play": "",
    "player/complete": "",
    "goog/msg/header": " ".repeat(2),
    "goog/msg/body": " ".repeat(4),
    "goog/att/id": " ".repeat(4),
    "net/att/start": " ".repeat(2),
    "net/att/finish": " ".repeat(2)
  };
  const emoji = type => {
    if (type.match(/^user/)) return "👩🏽‍💻 ";
    if (type.match(/^net/)) return "🛰 ";
    if (type.match(/^goog/)) return "📨 ";
    if (type.match(/^player/)) return "🔊 ";
    return "";
  };
  return "" + (spaces[type] || "") + emoji(type);
};

function format({ type, payload = {} }) {
  const v = val => {
    return Array.isArray(val)
      ? JSON.stringify(val)
          .replace(/"/g, "")
          .replace(/,/g, ", ")
      : val;
  };
  return (
    type +
    ": " +
    (typeof payload === "object"
      ? Array.from(Object.keys(payload))
          .map(k => `${k}: ${v(payload[k])}`)
          .join(", ")
      : payload)
  );
}

function start() {
  agent.process({ type: "user/search", payload: { q: "Greg" } });
}

agent.addFilter(({ action }) => {
  console.log(indent(action) + format(action));
});

agent.on(
  "user/search",
  () =>
    concat(
      after(0, { subject: "Friday gig" }),
      after(0, { subject: "Great jam" })
    ),
  { type: "goog/msg/header" }
);

// Return some simulated payloads
agent.on(
  "goog/msg/header",
  ({ action }) =>
    after(500, {
      ...action.payload,
      att: action.payload.subject === "Great jam" ? ["jam.mp3", "jam2.mp3"] : []
    }),
  { type: "goog/msg/body" }
);

agent.on(
  "goog/msg/body",
  ({ action }) => {
    return from(action.payload.att.map(att => ({ att })));
  },
  {
    type: "goog/att/id"
  }
);

agent.on(
  "goog/att/id",
  ({ action }) =>
    concat(
      after(0, {
        type: "net/att/start",
        payload: action.payload
      }),
      after(1000, {
        type: "net/att/finish",
        payload: {
          ...action.payload,
          bytes: randomId() + "..."
        }
      })
    ),
  {
    processResults: true,
    concurrency: "serial"
  }
);

agent.on(
  "net/att/finish",
  ({ action }) =>
    concat(
      after(0, { type: "player/play", payload: action.payload }),
      after(1500, { type: "player/complete", payload: action.payload })
    ),
  {
    processResults: true,
    concurrency: "serial"
  }
);

// agent.process({ type: "goog/msg/header", payload: { Subject: "Great jam" } });
// agent.process({ type: "goog/msg/header", payload: { Subject: "Friday gig" } });

// agent.process({
//   type: "goog/msg/body",
//   payload: { Subject: "Great jam", att: "jam.mp3" }
// });
// agent.process({ type: "goog/att/start", payload: { att: "jam.mp3" } });

// agent.process({
//   type: "goog/msg/header",
//   payload: { Subject: "Rehearsal trax" }
// });
// agent.process({
//   type: "goog/msg/header",
//   payload: { Subject: "Saturday practice" }
// });
// agent.process({
//   type: "goog/att/finish",
//   payload: { att: "jam.mp3", bytes: "ab092c..." }
// });
// agent.process({
//   type: "goog/att/start",
//   payload: { att: "jam2.mp3" }
// });
// agent.process({
//   type: "player/play",
//   payload: { title: "jam.mp3", bytes: "ab092c..." }
// });
// agent.process({ type: "player/complete", payload: { title: "jam.mp3" } });

start();
