const { after, from, concat, randomId } = require("rx-helper");

function getMatchingMsgHeadersFromSearch() {
  return concat(
    after(0, { subject: "Friday gig" }),
    after(0, { subject: "Great jam" })
  );
}
function getMessageBodyFromHeader({ action }) {
  return after(1500, {
    ...action.payload,
    att: action.payload.subject === "Great jam" ? ["jam.mp3", "jam2.mp3"] : []
  });
}

function getAttachmentIdsFromBody({ action }) {
  return from(action.payload.att.map(att => ({ att })));
}

function downloadAttachment({ action }) {
  return concat(
    after(0, {
      type: "net/att/start",
      payload: action.payload
    }),
    after(5000, {
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
  getMessageBodyFromHeader,
  getAttachmentIdsFromBody,
  downloadAttachment,
  playFinishedAttachment
};
