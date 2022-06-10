const { Omnibus } = require("omnibus-rxjs");
const bus = new Omnibus();
bus.errors.subscribe((e) => {
  console.error(e);
});
module.exports = bus;
