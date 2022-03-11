import { isSelectEntryEdited } from "@bpmn-io/properties-panel";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { getBsimObject } from "../utils/BsimUtil";
import { DistributionProps } from "./DistributionProps";
import { TimeUnitProps } from "./TimeUnitProps";

export function DurationProps(props) {
  const { element } = props;
  const idPrefix = "duration";

  if (!is(element, "bpmn:Activity")) {
    return [];
  }
  const entries = [];

  const bsimObject = getBsimObject(element);
  const duration = bsimObject.get("bsim:duration");

  entries.push({
    id: idPrefix + "-timeUnit",
    idPrefix,
    component: TimeUnitProps,
    isEdited: isSelectEntryEdited,
    container: duration,
  });

  const distribution = duration.get("bsim:distribution");

  entries.push(
    ...DistributionProps({
      element,
      distribution,
      container: duration,
      idPrefix: idPrefix,
    })
  );

  return entries;
}

// helper ///////////////////
