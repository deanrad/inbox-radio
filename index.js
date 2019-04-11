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
const { zip, of, from, concat } = require("rxjs");
const { concatMap } = require("rxjs/operators");
const { format, indent } = require("./format");
const { render, Color, Box, Text } = require("ink");

const Spinner = require("ink-spinner").default;
const React = require("react");
const { createElement } = React;
const h = createElement;

const {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playFinishedAttachment
} = require("./implementations/real");
const {} = require("./implementations/stub");

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
        h(Color, n({ rgb: [90, 90, 90] }), "Now Playing: "),
        nowPlaying.title === "---"
          ? h(Color, n({ rgb: [90, 90, 90] }), nowPlaying.title)
          : h(Color, n(), nowPlaying.title)
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
                : track.status === "done"
                ? "✔︎"
                : " "
            ),
            h(Box, n({ width: 50 }), track.name)
          ]);
        }),
        ...Array.from(new Array(Math.max(0, 4 - queue.length))).map(() =>
          h(Box, n({ minHeight: 1 }))
        )
      ])
    ]),
    h(Box, n({ width: 56, flexDirection: "column" }), [
      "Logs",
      ...logs.map(log => log.substr(0, 80))
    ])
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

agent.on("goog/msg/header", getAudioAttachments, {
  type: "goog/att/id"
});

// Option 1 - download attachments as you discover them (serially)
// agent.on("goog/att/id", downloadAttachment, {
//   processResults: true,
//   concurrency: "serial"
// });

// Option 2 - Limit how far you can get ahead using some RxJS magic
const prePlays = from(Array(2));
const downloads = zip(
  agent.actionsOfType("goog/att/id"),
  concat(prePlays, agent.actionsOfType("player/play")),
  (att, _) => ({ action: att })
).pipe(concatMap(downloadAttachment));
agent.subscribe(downloads);

agent.on("net/att/finish", playFinishedAttachment, {
  processResults: true,
  concurrency: "serial"
});

function start() {
  require("clear")();
  const search = process.argv[2] || "wedding";
  const query = `${search} {filename:mp3 filename:wav filename:m4a}`;
  agent.process({
    type: "user/search",
    payload: { q: query }
  });
  updateView();
}

// WHAT
// ----
// HOW

// DO IT!
start();
