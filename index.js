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
const { agent, randomId } = require("rx-helper");
const { zip, of, concat } = require("rxjs");
const { concatMap } = require("rxjs/operators");
const { format, indent } = require("./format");
const { render, Color, Box, Text } = require("ink");
const FancyBox = require("ink-box");

const Spinner = require("ink-spinner").default;
const React = require("react");
const { createElement } = React;
const h = createElement;

const {
  getMatchingMsgHeadersFromSearch,
  getMessageBodyFromHeader,
  getAttachmentIdsFromBody,
  downloadAttachment,
  playFinishedAttachment
} = require("./implementations/stub");

const n = (o = {}) => Object.assign(o, { key: randomId() });
// Use ink to render (to console!)
const props = {
  nowPlaying: {
    title: "---"
  },
  queue: [],
  logs: []
};

// Log to console
// agent.addFilter(({ action }) => {
//   console.log(indent(action) + format(action));
// });
// Log to an object
agent.addFilter(({ action }) => {
  props.logs.push(indent(action) + format(action));
});

const View = ({ nowPlaying, queue, logs = [] }) => {
  return [
    h(Box, n({ marginTop: 1, flexDirection: "column" }), [
      h(Box, n({}), [
        h(Color, n({ rgb: [210, 210, 255] }), "Now Playing: "),
        h(Color, n({ green: true }), nowPlaying.title)
      ]),
      h(Box, n({ width: 56, flexDirection: "column" }), [
        h(Text, n({ underline: true }), "Queue"),

        ...queue.map(track => {
          return h(Box, n(), [
            h(
              Box,
              n({ width: 6 }),
              track.status === "downloading"
                ? h(Spinner, n())
                : track.name === nowPlaying.title
                ? "➤"
                : track.status === "done"
                ? "✔︎"
                : " "
            ),
            h(Box, n({ width: 50 }), track.name)
          ]);
        }),
        ...Array.from(new Array(Math.max(0, 3 - queue.length))).map(() =>
          h(Box, n({ minHeight: 1 }))
        )
      ])
    ]),
    h(Box, n({ width: 56, flexDirection: "column" }), ["Logs", ...logs])
  ];
};

const updateView = () => {
  render(h(View, props));
  if (props.queue.length > 4) {
    props.queue.shift();
  }
};
agent.filter("player/play", ({ action: { payload: { att } } }) => {
  props.nowPlaying.title = att;
});
agent.filter("player/complete", ({ action: { payload: { att } } }) => {
  props.nowPlaying.title = "---";
});
agent.filter("net/att/start", ({ action: { payload: { att } } }) => {
  props.queue = [...props.queue, { name: att, status: "downloading" }];
});
agent.filter("net/att/finish", ({ action: { payload: { att } } }) => {
  props.queue.find(i => i.name === att).status = "done";
});
agent.filter(() => true, updateView);

agent.on("user/search", getMatchingMsgHeadersFromSearch, {
  type: "goog/msg/header"
});

agent.on("goog/msg/header", getMessageBodyFromHeader, {
  type: "goog/msg/body"
});

agent.on("goog/msg/body", getAttachmentIdsFromBody, {
  type: "goog/att/id"
});

/*
Instead of blindly turning goog/att/id into downloads the moment we see them,
we can create a stream that only begins the next download once a play action has
occurred, then subscribe the agent to that stream.

The old way - jam3.mp3 starts downloading before jam3.mp3 has begun playing
// agent.on("goog/att/id", downloadAttachment, {
//   processResults: true,
//   concurrency: "serial"
// });

👩🏽‍💻 user/search: q: Greg
  📨 goog/msg/header: subject: Friday gig
  📨 goog/msg/header: subject: Great jam
    📨 goog/msg/body: subject: Friday gig, att: []
    📨 goog/msg/body: subject: Great jam, att: [jam.mp3, jam2.mp3, jam3.mp3]
    📨 goog/att/id: att: jam.mp3
    📨 goog/att/id: att: jam2.mp3
    📨 goog/att/id: att: jam3.mp3
  🛰 net/att/start: att: jam.mp3
  🛰 net/att/finish: att: jam.mp3, bytes: 6b39f6e...
🔊 player/play: att: jam.mp3, bytes: 6b39f6e...
  🛰 net/att/start: att: jam2.mp3
  🛰 net/att/finish: att: jam2.mp3, bytes: d8b761e...
  🛰 net/att/start: att: jam3.mp3
🔊 player/complete: att: jam.mp3, bytes: 6b39f6e...
🔊 player/play: att: jam2.mp3, bytes: d8b761e...
  🛰 net/att/finish: att: jam3.mp3, bytes: e819eef...
🔊 player/complete: att: jam2.mp3, bytes: d8b761e...
🔊 player/play: att: jam3.mp3, bytes: e819eef...
🔊 player/complete: att: jam3.mp3, bytes: e819eef...

The old way - jam3.mp3 doesn't start downloading until jam2.mp3 has begun playing
👩🏽‍💻 user/search: q: Greg
  📨 goog/msg/header: subject: Friday gig
  📨 goog/msg/header: subject: Great jam
    📨 goog/msg/body: subject: Friday gig, att: []
    📨 goog/msg/body: subject: Great jam, att: [jam.mp3, jam2.mp3, jam3.mp3]
    📨 goog/att/id: att: jam.mp3
    📨 goog/att/id: att: jam2.mp3
    📨 goog/att/id: att: jam3.mp3
  🛰 net/att/start: att: jam.mp3
  🛰 net/att/finish: att: jam.mp3, bytes: c7f3cbd...
🔊 player/play: att: jam.mp3, bytes: c7f3cbd...
  🛰 net/att/start: att: jam2.mp3
  🛰 net/att/finish: att: jam2.mp3, bytes: 988fa58...
🔊 player/complete: att: jam.mp3, bytes: c7f3cbd...
🔊 player/play: att: jam2.mp3, bytes: 988fa58...
  🛰 net/att/start: att: jam3.mp3
  🛰 net/att/finish: att: jam3.mp3, bytes: 587ddf4...
🔊 player/complete: att: jam2.mp3, bytes: 988fa58...
🔊 player/play: att: jam3.mp3, bytes: 587ddf4...
🔊 player/complete: att: jam3.mp3, bytes: 587ddf4...
*/
const downloads = zip(
  agent.actionsOfType("goog/att/id"),
  concat(of({ type: "player/play" }), agent.actionsOfType("player/play")),
  (att, _) => ({ action: att })
).pipe(concatMap(downloadAttachment));
agent.subscribe(downloads);

agent.on("net/att/finish", playFinishedAttachment, {
  processResults: true,
  concurrency: "serial"
});

function start() {
  agent.process({ type: "user/search", payload: { q: "Greg" } });
  updateView();
}

// WHAT
// ----
// HOW

// DO IT!
start();
