import actionCreatorFactory from "typescript-fsa";

const goog = actionCreatorFactory("goog");
const attachId = goog("att/id");
const attachBytes = goog("att/bytes");

module.exports = {
  attachId,
  attachBytes
};
