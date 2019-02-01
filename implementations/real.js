const { google, googleAuthClient } = require("./googleAuth");

(async function() {
  let auth = await googleAuthClient;
  listLabels(auth);
})();

function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        console.log(`- ${labels[0].name}`);
        console.log(`- ${labels[1].name}`);
      } else {
        console.log("No labels found.");
      }
    }
  );
}
