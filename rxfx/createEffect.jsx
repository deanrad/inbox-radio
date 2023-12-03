import React from "react";
import { Code, CallExpression, StringLiteral } from "react-ast";

export function CreateEffect({ concurMode = "", effect }) {
  const fn = `create${concurMode}Effect`;
  return <Code>{`${fn}( ${effect})`}</Code>;

  // TODO - do it the AST (hard) way
  // const code = <Code>{effect}</Code>;
  // return <CallExpression name={fn} arguments={[code]} />;
}
