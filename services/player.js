import actionCreatorFactory from "typescript-fsa";
const say = require("say");

const player = actionCreatorFactory("player");

const play = player("play");
const stop = player("stop");
const complete = player("complete");

function playSubject({ payload: { subject } }) {
  return new Observable((notify) => {
    say.speak(subject, "Alex", 1.1, (err) => {
      if (err) {
        notify.error(err);
      } else {
        notify.complete();
      }
    });

    return () => say.stop();
  });
}

module.exports = {
  play,
  stop,
  complete,
  playSubject,
};
