require("@babel/register")({
  ignore: [/(node_modules)/],
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: ["babel-plugin-jsx-control-statements"],
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
  🛰 goog/att/start: att: jam.mp3
  🛰 goog/att/bytes: att: jam.mp3, bytes: ed5e27a...
🔊 player/play: att: jam.mp3, bytes: ed5e27a...
  🛰 goog/att/start: att: jam2.mp3
  🛰 goog/att/bytes: att: jam2.mp3, bytes: 4cd26f0...
🔊 player/complete: att: jam.mp3, bytes: ed5e27a...
🔊 player/play: att: jam2.mp3, bytes: 4cd26f0...
🔊 player/complete: att: jam2.mp3, bytes: 4cd26f0...

*/

const { channel } = require("polyrhythm");
const { matchesAny } = require("omnibus-rxjs");
const bus = require("./services/bus");
bus.errors.subscribe((e) => {
  throw e;
});
const sendToChannel = {
  next(e) {
    channel.trigger(e.type, e.payload);
  },
};

// Services: sources of events
const goog = require("./services/google");
const player = require("./services/player");
const user = require("./services/user");

// as a transitional measure, we'll handle some parts in omnibus,
// but send all omnibus actions back to the channel, until all have moved over.
channel.listen(
  matchesAny(goog.attachId, goog.attachBytes, goog.msgHeader, user.search),
  (e) => {
    bus.trigger(e);
  }
);

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
  playAttachment,
} = implementation;

const { props, updateView } = require("./components/View");

// Log to an object
channel.filter(true, (event) => {
  props.logs.push(indent(event) + format(event));
});

channel.filter(player.play.match, ({ payload: { att } }) => {
  props.nowPlaying.title = att;
});
channel.filter(player.complete.match, ({ payload: { att } }) => {
  props.nowPlaying.title = "---";
});
channel.filter(goog.attachId.match, ({ payload: { att } }) => {
  props.queue = [...props.queue, { name: att, status: null }];
});
channel.filter(goog.attachStart.match, ({ payload: { att } }) => {
  props.queue.find((i) => i.name === att).status = "downloading";
});
channel.filter(goog.attachBytes.match, ({ payload: { att } }) => {
  props.queue.find((i) => i.name === att).status = "done";
});
channel.filter(true, updateView);

bus.listen(user.search.match, getMatchingMsgHeadersFromSearch, sendToChannel);

// channel.on("goog/msg/header", getAudioAttachments);
bus.listen(goog.msgHeader.match, getAudioAttachments, sendToChannel);

bus.listenQueueing(goog.attachId.match, downloadAttachment, sendToChannel);

// Backpressure-ish - not yet Omnibus-ified
// const prePlays = n => from(Array(n));
// const downloads = zip(
//   channel.actionsOfType("goog/att/id"),
//   concat(prePlays(2), channel.actionsOfType("player/play")),
//   (att, _) => ({ action: att })
// ).pipe(concatMap(downloadAttachment));
// channel.subscribe(downloads);

bus.listenQueueing(goog.attachBytes.match, playAttachment, sendToChannel);

function start() {
  //require("clear")();
  const search = process.argv[2] || "wedding";
  const query = `${search} {filename:mp3 filename:wav filename:m4a}`;
  channel.trigger("user/search", { q: query });
  updateView();
}

// WHAT
// ----
// HOW

// DO IT!
start();
