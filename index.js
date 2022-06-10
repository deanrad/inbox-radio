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
const bus = require("./services/bus");

bus.errors.subscribe((e) => {
  throw e;
});
const triggerToBus = {
  next(e) {
    bus.trigger(e);
  },
};

// Services: sources of events / Actors
const goog = require("./services/google");
const player = require("./services/player");
const user = require("./services/user");

let implementation;

if (process.env.DEMO === "1") {
  implementation = require("./implementations/stub");
} else {
  implementation = require("./implementations/real");
}

const { getMatchingMessages, playSubject, getMsgBody } = implementation;

const { props, updateView } = require("./components/View");

// Spies (every event)
bus.spy((event) => {
  props.logs.push(`${event.type}: ${JSON.stringify(event.payload)}`);
});
bus.spy(updateView);

// Filters (before each event)

// Listeners (after each event)
bus.listen(user.search.match, getMatchingMessages, triggerToBus);
bus.listen(goog.msgHeader.match, getMsgBody, triggerToBus);
// bus.listenQueueing(goog.msgBody.match, player.playSubject, triggerToBus);

function start() {
  //require("clear")();

  const query = "from:(hortond@district65.net)";
  bus.trigger(user.search({ q: query }));
}

// DO IT!
start();
