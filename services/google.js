import actionCreatorFactory from "typescript-fsa";

const goog = actionCreatorFactory("goog");

const attachId = goog("att/id");
const attachStart = goog("att/start");
const attachBytes = goog("att/bytes");
const attachError = goog("att/error");
const msgHeader= goog("msg/header");

module.exports = {
  msgHeader,
  attachId,
  attachStart,
  attachBytes
};
