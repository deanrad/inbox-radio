require("@babel/register")({
  ignore: [/(node_modules)/],
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: ["babel-plugin-jsx-control-statements"],
});
require("babel-polyfill");

const { zip, concat, from } = require("rxjs");
const { map, concatMap } = require("rxjs/operators");
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
const bus = require("./services/bus");

bus.errors.subscribe((e) => {
  throw e;
});
const triggerToBus = {
  next(e) {
    bus.trigger(e);
  },
};

// Services: sources of events
const goog = require("./services/google");
const player = require("./services/player");
const user = require("./services/user");

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

bus.spy((event) => {
  props.logs.push(indent(event) + format(event));
});
bus.spy(updateView);

bus.filter(player.play.match, ({ payload: { att } }) => {
  props.nowPlaying.title = att;
});
bus.filter(player.complete.match, ({ payload: { att } }) => {
  props.nowPlaying.title = "---";
});
bus.filter(goog.attachId.match, ({ payload: { att } }) => {
  props.queue = [...props.queue, { name: att, status: null }];
});
bus.filter(goog.attachStart.match, ({ payload: { att } }) => {
  props.queue.find((i) => i.name === att).status = "downloading";
});
bus.filter(goog.attachBytes.match, ({ payload: { att } }) => {
  props.queue.find((i) => i.name === att).status = "done";
});

bus.listen(user.search.match, getMatchingMsgHeadersFromSearch, triggerToBus);

bus.listen(goog.msgHeader.match, getAudioAttachments, triggerToBus);

// To download and stream at full speed would just be..
// bus.listenQueueing(goog.attachId.match, downloadAttachment, triggerToBus);
// OR
// To limit downloads to 1 ahead of the playing song
const prePlays = (n) => from(Array(n));
// prettier-ignore
zip(
  bus.query(goog.attachId.match),
  concat(prePlays(1), bus.query(player.play.match))
).pipe(
  map(([{ payload }, _]) => goog.attachId(payload)),
  // call the downloadAttachment serially, just as a listenQueueing would
  concatMap(downloadAttachment)
).subscribe(triggerToBus);
// Explanation: after the first N preplays, we require a new player/play
// event to progress ahead to the next serialized download from an attachId

bus.listenQueueing(goog.attachBytes.match, playAttachment, triggerToBus);

function start() {
  //require("clear")();
  const search = process.argv[2] || "wedding";
  const query = `${search} {filename:mp3 filename:wav filename:m4a}`;
  bus.trigger(user.search({ q: query }));
}

// DO IT!
start();
