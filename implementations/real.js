const { google, googleAuthClient } = require("./googleAuth");
const { Observable } = require("rxjs");
const { trigger } = require("polyrhythm");
const atob = require("atob");
const tempWrite = require("temp-write");
const player = require("play-sound")();

const gApi = googleAuthClient.then((auth) =>
  google.gmail({
    version: "v1",
    auth,
  })
);

async function listMessages(query) {
  const res = await (
    await gApi
  ).users.messages.list({
    userId: "me",
    ...query,
  });
  return res.data.messages;
}

async function getBody(id) {
  return (await (await gApi).users.messages.get({ userId: "me", id })).data;
}

function getMatchingMsgHeadersFromSearch({ payload }) {
  return new Observable((notify) => {
    listMessages(payload).then((messages) => {
      (messages || []).forEach(({ id: messageId }) =>
        trigger("goog/msg/header", { messageId })
      );
      notify.complete();
    });
  });
}

function getAudioAttachments({ payload }) {
  const { messageId } = payload;
  return new Observable((notify) => {
    getBody(messageId).then((body) => {
      const { headers, parts } = body.payload;
      const { snippet } = body;

      const from = headers
        .filter((h) => h.name === "From")
        .map((h) => h.value)[0];
      const to = headers.filter((h) => h.name === "To").map((h) => h.value)[0];
      // const guid = headers.filter(h => h.name === "Message-ID").map(h => h.value)[0]

      const audioAttachments = parts.filter((p) => p.mimeType.match(/^audio/));
      audioAttachments.forEach((part) => {
        const { filename: att, mimeType } = part;
        const attachId = part.body.attachmentId;
        // Communicate back to the agent
        trigger("goog/att/id", {
          att,
          snippet,
          from,
          messageId,
          mimeType,
          attachId,
          to,
        });
      });
      notify.complete();
    });
  });
}
async function googDownloadAtt({ attachId, messageId }) {
  return (
    await (
      await gApi
    ).users.messages.attachments.get({
      id: attachId,
      messageId,
      userId: "me",
    })
  ).data;
}

function downloadAttachment({ payload }) {
  const { messageId, attachId, att } = payload;

  return new Observable((notify) => {
    notify.next({ type: "goog/att/start", payload: { att } });

    googDownloadAtt({ attachId, messageId })
      .then((attachment) => {
        const { size, data } = attachment;
        const bData = atob(urlDec(data));
        const rawBytes = Uint8Array.from(bData, (c) => c.charCodeAt(0));
        const localFile = tempWrite.sync(rawBytes, att);
        notify.next({
          type: "goog/att/bytes",
          payload: {
            att,
            messageId,
            attachId,
            size,
            localFile,
          },
        });
        notify.complete();
      })
      .catch((e) => {
        notify.next({ type: "goog/att/error", payload: e });
      });
  });
}

// Utility function to replace non-url compatible chars with base64 standard chars
function urlDec(input) {
  return input.replace(/-/g, "+").replace(/_/g, "/");
}

function playAttachment({ payload }) {
  const { localFile } = payload;
  return new Observable((notify) => {
    trigger("player/play", payload);

    const audio = player.play(localFile, () => {
      trigger("player/stop", payload);
      notify.complete();
    });

    return () => audio.kill();
  });
}

module.exports = {
  getMatchingMsgHeadersFromSearch,
  getAudioAttachments,
  downloadAttachment,
  playAttachment,
};

// listMessages({ q: "Greg" }).then(msg => console.log(msg));
// getBody("16a0386c11a7dc89").then(msg => console.log(msg));
