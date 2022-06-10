const React = require("react");
const { createElement } = React;
const h = createElement;
const { Color, Box, Text, render } = require("ink");
const Spinner = require("ink-spinner").default;

const randomId = (length = 7) => {
  return Math.floor(Math.pow(2, length * 4) * Math.random())
    .toString(16)
    .padStart(length, "0");
};

const View = ({ logs = [] }) => {
  return (
    <Box key={randomId()} marginTop={1} flexDirection="column">
      <Box key={randomId()} minHeight={1} flexDirection="column">
        <Text key={randomId()} underline={true}>
          Logs
        </Text>
        {logs.map((log) => (
          <Box key={randomId()}>{log}</Box>
        ))}
      </Box>
    </Box>
  );
};

const props = {
  logs: [],
};

const updateView = () => {
  render(h(View, props));
};

module.exports = {
  props,
  updateView,
};
