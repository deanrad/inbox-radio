import actionCreatorFactory from "typescript-fsa";

const player = actionCreatorFactory("player");

const play = player("play");
const stop = player("stop");
const complete = player("complete");

module.exports = {
  play,
  stop,
  complete
}
