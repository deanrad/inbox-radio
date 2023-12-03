import React from "react";

import {
  ClassDeclaration,
  render,
  Code,
  VariableDeclaration,
  VariableDeclarator,
  VariableDeclarationKind,
} from "react-ast";
import { CreateService } from "./rxfx/createService";
import { CreateEffect } from "./rxfx/createEffect";

export class Reqs {
  id = "";
  arg = "";
  needsState = false;
  skipsNew = false;
  cancelsExisting = false;
  queues = false;
  needsCancelation = false;
  needsProgress = false;
  timeout = null;

  constructor(props) {
    Object.assign(this, props);
  }

  get isLossy() {
    return this.skipsNew || this.cancelsExisting;
  }

  get concurMode() {
    if (this.skipsNew && !this.cancelsExisting) {
      return "Blocking";
    }
    if (this.skipsNew && this.cancelsExisting) {
      return "Toggling";
    }
    if (!this.skipsNew && this.cancelsExisting) {
      return "Switching";
    }
    if (!this.skipsNew && !this.cancelsExisting) {
      return this.queues ? "Queueing" : "";
    }
  }

  get usesObservable() {
    return this.needsCancelation || this.cancelsExisting || this.needsProgress;
  }
}

export const CodeComp = (reqs) => {
  const { id, concurMode, needsCancelation, timeout, needsState, arg } = reqs;
  const Factory = needsState ? CreateService : CreateEffect;
  const method = needsState ? "Service" : "Effect";
  const fn = `create${concurMode}${method}`;

  const imports = `import { ${fn} ${
    needsState ? ", createResponseReducer" : ""
  } } from '@rxfx/service'`;

  const effect = needsCancelation
    ? `(${arg}) => {return of(${arg}) }`
    : `(${arg}) => {return Promise.resolve(${arg})}`;

  const reducerProducer = needsState
    ? `createResponseReducer('INITIAL_VALUE')`
    : null;

  const timeLimitedEffect = !timeout
    ? effect
    : `timeoutHandler({ duration: ${timeout} }, ${effect})`;

  return (
    <>
      <Code>{imports}</Code>
      {reqs.usesObservable ? <Code>{`import { of } from 'rxjs'`}</Code> : null}

      <VariableDeclaration kind={VariableDeclarationKind.Const}>
        <VariableDeclarator id={id}>
          <Factory
            concurMode={concurMode}
            id={id}
            effect={timeLimitedEffect}
            reducerProducer={reducerProducer}
          />
        </VariableDeclarator>
      </VariableDeclaration>
    </>
  );
};
