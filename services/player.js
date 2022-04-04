import actionCreatorFactory from "typescript-fsa";

const player = actionCreatorFactory("player");

const play = player("play");
const complete = player("complete");

module.exports = {
  play,
  complete
}
