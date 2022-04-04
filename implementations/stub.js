const { after, concat } = require("omnibus-rxjs");
const { empty } = require("rxjs");

const goog = require("../services/google");
const player = require("../services/player");

const SCALE = process.env.SCALE ? parseFloat(process.env.SCALE) : 3.0;

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(2000 * SCALE, () =>
      goog.msgHeader({ subject: "Friday gig" })
    ),
    after(500 * SCALE, () =>
      goog.msgHeader({ subject: "Great jam" })
    )
  );
}

function getAudioAttachments({ payload }) {
  if (payload.subject !== "Great jam") {
    return empty();
  }
  const atts = ["jam.mp3", "jam2.mp3", "jam3.mp3"];
  return concat(
    after(2000 * SCALE, goog.attachId({ att: atts[0] })),
    after(300 * SCALE, goog.attachId({ att: atts[1] })),
    after(300 * SCALE, goog.attachId({ att: atts[2] })),
  );
}

// returns events
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
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playAttachment,
};
