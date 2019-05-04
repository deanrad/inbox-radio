const { after, empty, concat, randomId } = require("rx-helper");

const SCALE = process.env.SCALE ? parseFloat(process.env.SCALE) : 3.0;

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(2000 * SCALE, { subject: "Friday gig" }),
    after(500 * SCALE, { subject: "Great jam" })
  );
}

function getAudioAttachments({ action }) {
  if (action.payload.subject !== "Great jam") {
    return empty();
  }
  const atts = ["jam.mp3", "jam2.mp3", "jam3.mp3"];
  return concat(
    after(2000 * SCALE, { att: atts[0] }),
    after(300 * SCALE, { att: atts[1] }),
    after(300 * SCALE, { att: atts[2] })
  );
}

function downloadAttachment({ action }) {
  return concat(
    after(1000 * SCALE, {
      type: "net/att/start",
      payload: action.payload
    }),
    after(3000 * SCALE, {
      type: "net/att/finish",
      payload: {
        ...action.payload,
        bytes: randomId() + "..."
      }
    })
  );
}

function playFinishedAttachment({ action }) {
  return concat(
    after(500 * SCALE, { type: "player/play", payload: action.payload }),
    after(5500 * SCALE, { type: "player/complete", payload: action.payload })
  );
}

module.exports = {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playFinishedAttachment
};
