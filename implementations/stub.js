const { after, concat } = require("omnibus-rxjs");
const { empty, Observable } = require("rxjs");
const goog = require("../services/google");
const player = require("../services/player");

const SCALE = process.env.SCALE ? parseFloat(process.env.SCALE) : 3.0;

function getMatchingMessages() {
  return concat(
    after(500 * SCALE, () => goog.msgHeader({ id: "111" })),
    after(500 * SCALE, () => goog.msgHeader({ id: "112" }))
  );
}

function getMsgBody({ payload: { id } }) {
  return id === "111"
    ? after(500 * SCALE, () => goog.msgBody({ subject: "D65 Update" }))
    : after(500 * SCALE, () =>
        goog.msgBody({ subject: "Crimes against Huge Manatees" })
      );
}

function downloadAttachment({ payload }) {
  return concat(
    after(1000 * SCALE, () => goog.attachStart(payload)),
    after(3000 * SCALE, () => goog.attachBytes({ ...payload, bytes: "..." }))
  );
}

function playAttachment({ payload }) {
  return concat(
    after(500 * SCALE, () => player.play(payload)),
    after(5500 * SCALE, () => player.complete(payload))
  );
}

module.exports = {
  getMatchingMessages,
  getMsgBody,
  playSubject,
};
