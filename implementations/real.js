let { google } = require("googleapis");
let { Observable } = require("rxjs");
let privatekey = require("../../-caution-gapi-creds-.json");

let jwtClient = new google.auth.JWT(
  privatekey.client_email,
  null,
  privatekey.private_key,
  ["https://www.googleapis.com/auth/gmail.readonly"]
);

let auth;
let gClient;
let gAuth = new Promise((resolve, reject) => {
  //authenticate request
  jwtClient.authorize(function(err, tokens) {
    if (err) {
      console.log(err);
      reject(err);
      return;
    } else {
      auth = jwtClient;
      gClient = google.gmail({ version: "v1", auth });
      console.log("Successfully connected to GAPI");
      resolve();
    }
  });
});

const query = () => {
  console.log("Yay GAPI");
  const oMessages = getMessages(
    "fumes {filename:mp3 filename:wav filename:m4a}"
  );
  oMessages.subscribe(m => console.log(m));
};

gAuth.then(query);

function getMessages(search) {
  return new Observable(notify => {
    const origQuery = { q: search, userId: "chicagogrooves@gmail.com" };
    const getPageOfMessages = function(request) {
      debugger;
      request.then(
        function(resp) {

          if (!resp.messages) return;
          resp.messages.forEach(m => {
            notify.next({ messageId: m.id });
          });

          // Get the next page, or bailout
          const nextPageToken = resp.nextPageToken;
          if (!nextPageToken) {
            notify.complete();
            return;
          }

          // Include the token and the fields of the original request as we recur
          const query = Object.assign({}, origQuery, {
            pageToken: nextPageToken
          });
          request = gClient.users.messages.list(query);
          getPageOfMessages(request);
        },
        e => {
          console.error(e);
          debugger;
        }
      );
    };

    const initialRequest = gClient.users.messages.list(origQuery);
    getPageOfMessages(initialRequest);
  });
}
