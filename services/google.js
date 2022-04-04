import actionCreatorFactory from "typescript-fsa";

const goog = actionCreatorFactory("goog");

const attachId = goog("att/id");
const attachBytes = goog("att/bytes");
const msgHeader= goog("msg/header");

module.exports = {
  msgHeader,
  attachId,
  attachBytes
};
