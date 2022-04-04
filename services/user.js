import actionCreatorFactory from "typescript-fsa";

const user = actionCreatorFactory("user");
const search = user('search');

module.exports = {
  search
}