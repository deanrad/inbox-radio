/*
A sample session:
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
const { format, indent } = require("./format");

agent.addFilter(({ action }) => {
  console.log(indent(action) + format(action));
});

agent.on("user/search", getMatchingMsgHeadersFromSearch, {
  type: "goog/msg/header"
});

agent.on("goog/msg/header", getMessageBodyFromHeader, {
  type: "goog/msg/body"
});

agent.on("goog/msg/body", getAttachmentIdsFromBody, {
  type: "goog/att/id"
});

agent.on("goog/att/id", downloadAttachment, {
  processResults: true,
  concurrency: "serial"
});

agent.on("net/att/finish", playFinishedAttachment, {
  processResults: true,
  concurrency: "serial"
});

function start() {
  agent.process({ type: "user/search", payload: { q: "Greg" } });
}

// WHAT
// ----
// HOW

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(0, { subject: "Friday gig" }),
    after(0, { subject: "Great jam" })
  );
}
function getMessageBodyFromHeader({ action }) {
  return after(1500, {
    ...action.payload,
    att: action.payload.subject === "Great jam" ? ["jam.mp3", "jam2.mp3"] : []
  });
}

function getAttachmentIdsFromBody({ action }) {
  return from(action.payload.att.map(att => ({ att })));
}

function downloadAttachment({ action }) {
  return concat(
    after(0, {
      type: "net/att/start",
      payload: action.payload
    }),
    after(5000, {
      type: "net/att/finish",
      payload: {
        ...action.payload,
        bytes: randomId() + "..."
      }
    })
  );
}

function playFinishedAttachment({ action }) {
  return concat(
    after(0, { type: "player/play", payload: action.payload }),
    after(1500, { type: "player/complete", payload: action.payload })
  );
}

// DO IT!
start();
