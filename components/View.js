const React = require("react");
const { createElement } = React;
const h = createElement;
const { Color, Box, Text } = require("ink");
const Spinner = require("ink-spinner").default;
const { randomId } = require("rx-helper");

// LEFTOFF Use babel to make this less ugly per:
// https://flaviocopes.com/react-server-side-rendering/

// util to add newKey
const n = (o = {}) => Object.assign(o, { key: randomId() });

const View = ({ nowPlaying, queue, logs = [] }) => {
  return [
    h(Box, n({ marginTop: 1, flexDirection: "column" }), [
      h(Box, n({}), [
        h(Color, n({ rgb: [90, 90, 90] }), "Now Playing: "),
        nowPlaying.title === "---"
          ? h(Color, n({ rgb: [90, 90, 90] }), nowPlaying.title)
          : h(Color, n(), nowPlaying.title)
      ]),
      h(Box, n({ width: 56, flexDirection: "column" }), [
        h(Text, n({ underline: true }), "Queue"),

        ...queue.map(track => {
          return h(Box, n(), [
            h(
              Box,
              n({ width: 6 }),
              track.status === "downloading"
                ? h(Spinner, n())
                : track.status === "done"
                ? "✔︎"
                : " "
            ),
            h(Box, n({ width: 50 }), track.name)
          ]);
        }),
        ...Array.from(new Array(Math.max(0, 4 - queue.length))).map(() =>
          h(Box, n({ minHeight: 1 }))
        )
      ])
    ]),
    h(Box, n({ width: 56, flexDirection: "column" }), [
      "Logs",
      ...logs.map(log => log.substr(0, 80))
    ])
  ];
};

module.exports = {
  View
};
