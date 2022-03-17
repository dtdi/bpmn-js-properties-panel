import {
  isNumberFieldEntryEdited,
  NumberFieldEntry,
} from "@bpmn-io/properties-panel";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { useService } from "../../../hooks";
import { getBsimObject } from "../utils/BsimUtil";
import { getDescr, getName } from "../utils/helper";

export function GatewaySplitProps({ element, injector }) {
  if (!is(element, "bpmn:ExclusiveGateway")) {
    return [];
  }

  const bsimObject = getBsimObject(element);
  if (!is(bsimObject, "bsim:exclusiveGateway")) {
    return [];
  }

  const outgoing = bsimObject.get("outgoing") || [];

  const entries = outgoing.map((flow, index) => ({
    id: `outgoingSequenceFlow-${index}`,
    component: SequenceFlowField,
    flow,
  }));

  return entries;
}

export function SequenceFlowField({ element, id, flow }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  const getValue = (element) => {
    const branchingProbability = flow.get("branchingProbability");
    return branchingProbability.get("value") || "";
  };

  const setValue = (value) => {
    const branchingProbability = flow.get("branchingProbability");
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: branchingProbability,
      properties: {
        value: value,
      },
    });
  };

  const options = {
    id,
    element,
    isEdited: isNumberFieldEntryEdited,
    label: getSequenceFlowName(flow),
    description: getName(null, "bsim:branchingProbability"),
    min: 0,
    max: 1,
    step: 0.05,
    getValue,
    setValue,
    debounce,
  };
  return NumberFieldEntry(options);
}

export function SequenceSplitProps({ element, injector }) {
  if (!is(element, "bpmn:SequenceFlow")) {
    return [];
  }

  const bsimObject = getBsimObject(element);
  if (!is(bsimObject, "bsim:outgoingSequenceFlow")) {
    return [];
  }

  return [
    {
      id: `outgoingSequenceFlow`,
      component: SequenceFlowField,
      flow: bsimObject,
    },
  ];
}

// helpers ///////////////////

function getSequenceFlowName(flow) {
  const bO = flow.bpmnElement;
  const flowName = bO.name || "";
  const nextElement = bO.targetRef;
  const nextName = nextElement.name || nextElement.id;
  return `${flowName} 🠖 ${nextName}`;
}
