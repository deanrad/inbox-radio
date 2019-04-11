const { after, concat, randomId } = require("rx-helper");

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(2000, { subject: "Friday gig" }),
    after(2000, { subject: "Great jam" })
  );
}

function getAudioAttachments({ action }) {
  return after(3000, {
    ...action.payload,
    att:
      action.payload.subject === "Great jam"
        ? ["jam.mp3", "jam2.mp3", "jam3.mp3"]
        : []
  });
}

function getAttachmentIdsFromBody({ action }) {
  return concat(
    ...action.payload.att.map((att, index) =>
      after(index === 0 ? 1000 : 250, { att })
    )
  );
}

function downloadAttachment({ action }) {
  return concat(
    after(1000, {
      type: "net/att/start",
      payload: action.payload
    }),
    after(3000, {
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
    after(0, { type: "player/play", payload: action.payload }),
    after(5500, { type: "player/complete", payload: action.payload })
  );
}

module.exports = {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  getAttachmentIdsFromBody,
  downloadAttachment,
  playFinishedAttachment
};
