import {
  isSelectEntryEdited,
  isTextFieldEntryEdited,
} from "@bpmn-io/properties-panel";
import { is, isAny } from "bpmn-js/lib/util/ModelUtil";

import { getBsimObject } from "../utils/BsimUtil";
import { DistributionProps } from "./DistributionProps";
import { TimeUnitProps } from "./TimeUnitProps";

const ALLOWED_TYPES = ["bpmn:Activity", "bpmn:StartEvent"];

export function DurationSelectionProps(props) {
  const { element, type } = props;
  const idPrefix = type;

  if (!isAny(element, ALLOWED_TYPES)) {
    return [];
  }

  if (
    is(element, "bpmn:Activity") &&
    !["bsim:duration", "bsim:setUpDuration"].includes(type)
  ) {
    return [];
  }

  if (is(element, "bpmn:StartEvent") && !["bsim:arrivalRate"].includes(type)) {
    return [];
  }

  const entries = [];

  const bsimObject = getBsimObject(element);
  const container = bsimObject.get(type);

  entries.push({
    id: idPrefix + "-timeUnit",
    idPrefix,
    component: TimeUnitProps,
    container: container,
  });

  if (container) {
    const distribution = container.get("bsim:distribution");

    entries.push(
      ...DistributionProps({
        element,
        distribution,
        container: container,
        idPrefix: idPrefix,
      })
    );
  }

  return entries;
}

// helper ///////////////////
