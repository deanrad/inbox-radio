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

bus.guard((event) => {
  props.logs.push(indent(event) + format(event));
});
bus.spy(updateView);

bus.guard(player.play.match, ({ payload: { att } }) => {
  props.nowPlaying.title = att;
});
bus.guard(player.complete.match, ({ payload: { att } }) => {
  props.nowPlaying.title = "---";
});
bus.guard(goog.attachId.match, ({ payload: { att } }) => {
  props.queue = [...props.queue, { name: att, status: null }];
});
bus.guard(goog.attachStart.match, (e) => {
  const {
    payload: { att },
  } = e;
  props.queue.find((i) => i.name === att).status = "downloading";
});
bus.guard(goog.attachBytes.match, (e) => {
  const {
    payload: { att },
  } = e;
  console.log(props.queue, e);
  props.queue.find((i) => i.name === att).status = "done";
});

bus.listen(user.search.match, getMatchingMsgHeadersFromSearch, triggerToBus);

bus.listen(goog.msgHeader.match, getAudioAttachments, triggerToBus);

// To download and stream at full speed would just be..
// bus.listenQueueing(goog.attachId.match, downloadAttachment, triggerToBus);
// OR
// To limit downloads to N ahead of the playing song
// Attachments waiting for download
const queueOfDownloads = bus.query(goog.attachId.match);
// Download slots - starting with 2, then each time a new 'play' begins, a new slot appears
const availSlots = concat(from(Array(2)), bus.query(player.play.match));

// Only begins to download as availSlots emits
zip(queueOfDownloads, availSlots)
  .pipe(
    map(([{ payload }, _]) => goog.attachId(payload)),
    concatMap(downloadAttachment) // serial ala listenQueueing
  )
  .subscribe(triggerToBus);

bus.listenQueueing(goog.attachBytes.match, playAttachment, triggerToBus);

function start() {
  //require("clear")();
  const search = process.argv[2] || "wedding";
  const query = `${search} {filename:mp3 filename:wav filename:m4a}`;
  bus.trigger(user.search({ q: query }));
}

// DO IT!
start();
