require("@babel/register")({
  ignore: [/(node_modules)/],
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: ["babel-plugin-jsx-control-statements"]
});
require("babel-polyfill");

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
const { agent } = require("rx-helper");
const { format, indent } = require("./format");

let implementation;

if (process.env.DEMO === "1") {
  implementation = require("./implementations/stub");
} else {
  implementation = require("./implementations/real");
}

const {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playFinishedAttachment
} = implementation;

const { props, updateView } = require("./components/View");

// Log to console
// agent.addFilter(({ event }) => {
//   console.log(indent(event) + format(event));
// });
// Log to an object
agent.spy(({ event }) => {
  props.logs.push(indent(event) + format(event));
});

agent.filter("player/play", ({ event: { payload: { att } } }) => {
  props.nowPlaying.title = att;
});
agent.filter("player/complete", ({ event: { payload: { att } } }) => {
  props.nowPlaying.title = "---";
});
agent.filter("goog/att/id", ({ event: { payload: { att } } }) => {
  props.queue = [...props.queue, { name: att, status: null }];
});
agent.filter("net/att/start", ({ event: { payload: { att } } }) => {
  props.queue.find(i => i.name === att).status = "downloading";
});
agent.filter("net/att/finish", ({ event: { payload: { att } } }) => {
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
agent.on("goog/att/id", downloadAttachment, {
  processResults: true,
  concurrency: "serial"
});

// Option 2 - Limit how far you can get ahead using some RxJS magic
// const prePlays = n => from(Array(n));
// const downloads = zip(
//   agent.eventsOfType("goog/att/id"),
//   concat(prePlays(2), agent.eventsOfType("player/play")),
//   (att, _) => ({ event: att })
// ).pipe(concatMap(downloadAttachment));
// agent.subscribe(downloads);

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
