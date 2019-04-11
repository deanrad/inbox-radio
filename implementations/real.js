const { google, googleAuthClient } = require("./googleAuth");
const { Observable } = require("rxjs");

const gApi = googleAuthClient.then(auth =>
  google.gmail({
    version: "v1",
    auth
  })
);

async function listMessages(query) {
  const res = await (await gApi).users.messages.list({
    userId: "me",
    ...query
  });
  return res.data.messages;
}

async function getBody(id) {
  return (await (await gApi).users.messages.get({ userId: "me", id })).data;
}

function getMatchingMsgHeadersFromSearch({ action }) {
  return new Observable(notify => {
    listMessages(action.payload).then(messages => {
      (messages || []).forEach(
        ({ id: messageId }, idx) => idx < 5 && notify.next({ messageId })
      );
    });
  });
}

function getAudioAttachments({ action }) {
  const { messageId } = action.payload;
  return new Observable(notify => {
    getBody(messageId).then(body => {
      const { snippet } = body;

      const { headers, parts } = body.payload;
      const from = headers.filter(h => h.name === "From").map(h => h.value)[0];
      const to = headers.filter(h => h.name === "To").map(h => h.value)[0];
      const guid = headers
        .filter(h => h.name === "Message-ID")
        .map(h => h.value)[0];

      const audioAttachments = parts.filter(p => p.mimeType.match(/^audio/));
      const date = new Date(
        parseInt(body.internalDate, 10)
      ).toLocaleDateString();
      audioAttachments.forEach(part => {
        const { filename, mimeType } = part;
        const attachId = part.body.attachmentId;
        // Communicate back to the agent
        notify.next({
          guid,
          messageId,
          from,
          to,
          snippet,
          date,
          filename,
          mimeType,
          attachId
        });
      });
    });
  });
}

module.exports = {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments
};

// listMessages({ q: "Greg" }).then(msg => console.log(msg));
// getBody("16a0386c11a7dc89").then(msg => console.log(msg));
