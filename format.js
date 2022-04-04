function indent({ type }) {
  const spaces = {
    "user/search": "",
    "player/play": "",
    "player/complete": "",
    "goog/msg/header": " ".repeat(2),
    "goog/msg/body": " ".repeat(4),
    "goog/att/id": " ".repeat(4),
    "goog/att/start": " ".repeat(2),
    "goog/att/bytes": " ".repeat(2)
  };
  const emoji = type => {
    if (type.match(/^user/)) return "👩🏽‍💻 ";
    if (type.match(/^net/)) return "🛰 ";
    if (type.match(/^goog/)) return "📨 ";
    if (type.match(/^player/)) return "🔊 ";
    return "";
  };
  return "" + (spaces[type] || "") + emoji(type);
}

function format({ type, payload = {} }) {
  const v = val => {
    return Array.isArray(val)
      ? JSON.stringify(val)
          .replace(/"/g, "")
          .replace(/,/g, ", ")
      : val;
  };
  return (
    type +
    ": " +
    (typeof payload === "object"
      ? Array.from(Object.keys(payload))
          .map(k => `${k}: ${v(payload[k])}`)
          .join(", ")
      : payload)
  );
}

module.exports = { format, indent };
