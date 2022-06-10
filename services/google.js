import actionCreatorFactory from "typescript-fsa";

const goog = actionCreatorFactory("goog");

const attachId = goog("att/id");
const attachStart = goog("att/start");
const attachBytes = goog("att/bytes");
const msgHeader = goog("msg/header");
const msgBody = goog("msg/body");

module.exports = {
  msgHeader,
  msgBody,
  attachId,
  attachStart,
  attachBytes,
};
