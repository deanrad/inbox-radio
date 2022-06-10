const { google, googleAuthClient } = require("./googleAuth");
const { Observable } = require("rxjs");
const { take } = require("rxjs/operators");

const atob = require("atob");
const tempWrite = require("temp-write");
const soundPlayer = require("play-sound")();

const goog = require("../services/google");
const player = require("../services/player");

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

function getMatchingMessages({ payload }) {
  return new Observable((notify) => {
    listMessages(payload).then((messages) => {
      (messages || []).forEach(({ id: messageId }) =>
        notify.next(goog.msgHeader({ messageId }))
      );
      notify.complete();
    });
  }).pipe(take(3));
}

function getMsgBody({ payload }) {
  const { messageId } = payload;
  return getBody(messageId).then((msg) => {
    const subject = msg.payload.headers.find(
      (h) => h.name.toLowerCase() === "subject"
    ).value;
    let decoder = Buffer.from(msg.payload.parts[0].body.data, "base64");

    // return goog.msgBody({ subject, textPart: msg.payload.parts[0] });
    return goog.msgBody({ subject, body: decoder.toString("utf8") });
  });
}

// function getAudioAttachments({ payload }) {
//   const { messageId } = payload;
//   return new Observable((notify) => {
//     getBody(messageId).then((body) => {
//       const { headers, parts } = body.payload;
//       const { snippet } = body;

//       const from = headers
//         .filter((h) => h.name === "From")
//         .map((h) => h.value)[0];
//       const to = headers.filter((h) => h.name === "To").map((h) => h.value)[0];

//       const audioAttachments = parts.filter((p) => p.mimeType.match(/^audio/));
//       audioAttachments.forEach((part) => {
//         const { filename: att, mimeType } = part;
//         const attachId = part.body.attachmentId;

//         notify.next(
//           goog.attachId({
//             att,
//             snippet,
//             from,
//             messageId,
//             mimeType,
//             attachId,
//             to,
//           })
//         );
//       });
//       notify.complete();
//     });
//   });
// }
// async function googDownloadAtt({ attachId, messageId }) {
//   return (
//     await (
//       await gApi
//     ).users.messages.attachments.get({
//       id: attachId,
//       messageId,
//       userId: "me",
//     })
//   ).data;
// }

// function downloadAttachment({ payload }) {
//   const { messageId, attachId, att } = payload;

//   return new Observable((notify) => {
//     notify.next(goog.attachStart({ att }));

//     googDownloadAtt({ attachId, messageId })
//       .then((attachment) => {
//         const { size, data } = attachment;
//         const bData = atob(urlDec(data));
//         const rawBytes = Uint8Array.from(bData, (c) => c.charCodeAt(0));
//         const localFile = tempWrite.sync(rawBytes, att);
//         notify.next(
//           goog.attachBytes({
//             att,
//             messageId,
//             attachId,
//             size,
//             localFile,
//           })
//         );
//         notify.complete();
//       })
//       .catch((e) => {
//         notify.next(goog.attachError(e));
//       });
//   });
// }

// // Utility function to replace non-url compatible chars with base64 standard chars
// function urlDec(input) {
//   return input.replace(/-/g, "+").replace(/_/g, "/");
// }

// function playAttachment({ payload }) {
//   const { localFile } = payload;
//   return new Observable((notify) => {
//     notify.next(player.play(payload));

//     const audio = soundPlayer.play(localFile, () => {
//       notify.next(player.stop(payload));
//       notify.complete();
//     });

//     return () => audio.kill();
//   });
// }

module.exports = {
  getMatchingMessages,
  getMsgBody,
  // getAudioAttachments,
  // downloadAttachment,
  // playAttachment,
};

// listMessages({ q: "Greg" }).then(msg => console.log(msg));
// getBody("16a0386c11a7dc89").then(msg => console.log(msg));
