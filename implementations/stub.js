const { after, concat, randomId, trigger } = require("polyrhythm");
const { empty } = require("rxjs");

const SCALE = process.env.SCALE ? parseFloat(process.env.SCALE) : 3.0;

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(2000 * SCALE, () =>
      trigger("goog/msg/header", { subject: "Friday gig" })
    ),
    after(500 * SCALE, () =>
      trigger("goog/msg/header", { subject: "Great jam" })
    )
  );
}

function getAudioAttachments({ payload }) {
  if (payload.subject !== "Great jam") {
    return empty();
  }
  const atts = ["jam.mp3", "jam2.mp3", "jam3.mp3"];
  return concat(
    after(2000 * SCALE, () => trigger("goog/att/id", { att: atts[0] })),
    after(300 * SCALE, () => trigger("goog/att/id", { att: atts[1] })),
    after(300 * SCALE, () => trigger("goog/att/id", { att: atts[2] }))
  );
}

function downloadAttachment({ payload }) {
  return concat(
    after(1000 * SCALE, () => trigger("net/att/start", payload)),
    after(3000 * SCALE, () =>
      trigger("net/att/finish", {
        ...payload,
        bytes: randomId() + "...",
      })
    )
  );
}

function playFinishedAttachment({ payload }) {
  return concat(
    after(500 * SCALE, () => trigger("player/play", payload)),
    after(5500 * SCALE, () => trigger("player/complete", payload))
  );
}

module.exports = {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playFinishedAttachment,
};
