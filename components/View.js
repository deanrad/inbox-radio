const React = require("react");
const { createElement } = React;
const h = createElement;
const { Color, Box, Text, render } = require("ink");
const Spinner = require("ink-spinner").default;
const { randomId } = require("rx-helper");

const View = ({ nowPlaying, queue, logs = [] }) => {
  return (
    <Box key={randomId()} marginTop={1} flexDirection="column">
      <Box key={randomId()}>
        <Color rgb={[90, 90, 90]} key={randomId()}>
          Now Playing{" "}
        </Color>
        <Color rgb={nowPlaying.title === "---" ? [90, 90, 90] : null}>
          {nowPlaying.title}
        </Color>
      </Box>
      <Box key={randomId()} width={56} flexDirection="column">
        <Text key={randomId()} underline={true}>
          Queue
        </Text>
        {queue.map(track => {
          return (
            <Box key={randomId()}>
              <Box key={randomId()} width={6}>
                <Choose>
                  <When condition={track.status === "downloading"}>
                    <Spinner key={randomId()} />
                  </When>
                  <When condition={track.status === "done"}>✔︎</When>
                  <Otherwise> </Otherwise>
                </Choose>
              </Box>
              <Box key={randomId()} width={50}>
                {track.name}
              </Box>
            </Box>
          );
        })}
        {Array.from(new Array(Math.max(0, 4 - queue.length))).map(() => {
          return <Box key={randomId()} minHeight={1} />;
        })}
      </Box>
      <Box key={randomId()} minHeight={1}>
        Logs
        {logs.map(log => log.substr(0, 80)).join("\n")}
      </Box>
    </Box>
  );
};

const props = {
  nowPlaying: {
    title: "---"
  },
  queue: [],
  logs: []
};

const updateView = () => {
  render(h(View, props));
  if (props.queue.length > 4) {
    props.queue.shift();
  }
};

module.exports = {
  props,
  updateView
};
