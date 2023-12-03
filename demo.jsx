import { produce, immerable } from "immer";
import { render } from "react-ast";
import { Reqs, CodeComp } from "./code";

const baseReqs = new Reqs({
  [immerable]: true,
  id: "logger",
  needsState: true,
});

let demoReqs = baseReqs; // overridden for each test

// Effect
demoReqs = overrideReqs({ needsState: false });
printCodeGen(demoReqs);

// Service
demoReqs = overrideReqs({ needsState: true });
printCodeGen(demoReqs);

// Service, Arg
demoReqs = overrideReqs({ needsState: true, arg: 'message' });
printCodeGen(demoReqs);

// Switching
demoReqs = overrideReqs({ cancelsExisting: true });
printCodeGen(demoReqs);

// Blocking
demoReqs = overrideReqs({ skipsNew: true });
printCodeGen(demoReqs);

// Queueing
demoReqs = overrideReqs({ queues: true });
printCodeGen(demoReqs);

// Cancelation
demoReqs = overrideReqs({ needsCancelation: true });
printCodeGen(demoReqs);

// Timeout
demoReqs = overrideReqs({ timeout: 200 });
printCodeGen(demoReqs);

function printCodeGen(reqs) {
  const code = render(CodeComp(reqs));

  console.log(JSON.stringify(reqs));
  console.log(code + "\n\n");
}

function overrideReqs(overrides) {
  return produce(baseReqs, (base) => Object.assign(base, overrides));
}
