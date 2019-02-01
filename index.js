/*
We think it's as simple as playing a file Greg sent me, but...
search: q: Greg
player/play: title: jam.mp3, bytes: ab092c...
player/complete: title: jam.mp3

// When we search we don't get back files, but message headers
search: q: Greg
  goog/msg/header: Subject: Great jam
  goog/msg/header: Subject: Friday gig

// For each header, we must query for its body, which tells us its attachments
search: q: Greg
  goog/msg/header: Subject: Great jam
  goog/msg/header: Subject: Friday gig
    goog/msg/body: Subject: Friday gig, att: []
    goog/msg/body: Subject: Great jam, att: [jam.mp3, jam2.mp3]

// For each attachment, we must then get, and decode its bytes into playable audio
search: q: Greg
  goog/msg/header: Subject: Great jam
  goog/msg/header: Subject: Friday gig
    goog/msg/body: Subject: Friday gig, att: []
    goog/msg/body: Subject: Great jam, att: [jam.mp3, jam2.mp3]
      goog/att/start: att: jam.mp3

// Then as complete attachment bytes come back, we can play them (and start new ones)
search: q: Greg
  goog/msg/header: Subject: Great jam
  goog/msg/header: Subject: Friday gig
    goog/msg/body: Subject: Friday gig, att: []
    goog/msg/body: Subject: Great jam, att: [jam.mp3, jam2.mp3]
      goog/att/start: att: jam.mp3
      goog/att/finish: att: jam.mp3, bytes: ab092c...
player/play: title: jam.mp3, bytes: ab092c...
      goog/att/start: att: jam2.mp3
player/complete: title: jam.mp3

*/
const { agent, after, concat } = require("rx-helper");

const indent = ({ type }) => {
  const spaces = {
    search: "",
    "player/play": "",
    "player/complete": "",
    "goog/msg/header": " ".repeat(2),
    "goog/msg/body": " ".repeat(4),
    "goog/att/start": " ".repeat(6),
    "goog/att/finish": " ".repeat(6)
  };
  return spaces[type] || "";
};

function format({ type, payload = {} }) {
  return (
    type +
    ": " +
    (typeof payload === "object"
      ? Array.from(Object.keys(payload))
          .map(k => `${k}: ${payload[k]}`)
          .join(", ")
      : payload)
  );
}

function start() {
  agent.process({ type: "search", payload: { q: "Greg" } });
}

agent.addFilter(({ action }) => {
  console.log(indent(action) + format(action));
});

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
console.log("");
