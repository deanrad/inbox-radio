import React from "react";
import { Code } from "react-ast";

export function CreateService({ concurMode = "", id, effect, reducerProducer }) {
  const reducerPart = reducerProducer ? `, ${reducerProducer}` : '';

  return <Code>{`create${concurMode}Service('${id}', ${effect} ${reducerPart})`}</Code>;
}
