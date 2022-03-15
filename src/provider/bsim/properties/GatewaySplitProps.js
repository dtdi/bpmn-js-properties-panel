import { is } from "bpmn-js/lib/util/ModelUtil";

export function GatewaySplitProps({ element, injector }) {
  if (!is(element, "bpmn:ExclusiveGateway")) {
    return [];
  }

  console.log(element);

  const entries = [];

  entries.push();

  return entries;
}

export function SequenceSplitProps({ element, injector }) {
  if (!is(element, "bpmn:SequenceFlow")) {
    return [];
  }

  console.log(element);

  return [];
}
