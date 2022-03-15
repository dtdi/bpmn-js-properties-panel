import {
  isNumberFieldEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  NumberFieldEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { is, isAny } from "bpmn-js/lib/util/ModelUtil";
import { useService } from "../../../hooks";

import { getBsimObject } from "../utils/BsimUtil";
import { getDescr, getName } from "../utils/helper";
import { DistributionProps } from "./DistributionProps";
import { TimeUnitProps } from "./TimeUnitProps";

function TimeAndDistributionProps({ element, idPrefix }) {
  const entries = [];

  const bsimObject = getBsimObject(element);
  const container = bsimObject.get(idPrefix);

  entries.push({
    id: idPrefix + "-timeUnit",
    idPrefix,
    component: TimeUnitProps,
    isEdited: isSelectEntryEdited,
    container,
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

export function DurationSelectionProps({ element, type }) {
  const idPrefix = type;

  if (
    !is(element, "bpmn:Activity") ||
    !["bsim:duration", "bsim:setUpDuration"].includes(type)
  ) {
    return [];
  }

  return TimeAndDistributionProps({ element, idPrefix });
}

export function ArrivalRateProps(props) {
  const { element, type } = props;

  if (!is(element, "bpmn:StartEvent") || !["bsim:arrivalRate"].includes(type)) {
    return [];
  }

  const idPrefix = type;

  return TimeAndDistributionProps({ element, idPrefix });
}

export function EventArrivalProps({ element }) {
  const idPrefix = "bsim:arrivalRate";

  const bsimObject = getBsimObject(element);

  if (!isAny(bsimObject, ["bsim:catchEvent", "bsim:boundaryEvent"])) {
    return [];
  }

  const entries = [...TimeAndDistributionProps({ element, idPrefix })];

  if (is(bsimObject, "bsim:boundaryEvent")) {
    entries.push({
      id: idPrefix + "-eventProbability",
      component: EventProbabilityProps,
      property: "eventProbability",
      bsimObject,
    });
  }

  return entries;
}

function EventProbabilityProps({ element, bsimObject, property }) {
  const commandStack = useService("commandStack"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    const properties = {};
    properties[property] = value;
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: bsimObject,
      properties,
    });
  };

  const getValue = () => {
    return bsimObject.get(property);
  };

  return NumberFieldEntry({
    element: element,
    id: property,
    isEdited: isNumberFieldEntryEdited,
    label: getName(property, "bsim:boundaryEvent"),
    description: getDescr(property, "bsim:boundaryEvent"),
    getValue,
    min: 0,
    max: 1,
    step: 0.05,
    setValue,
    debounce,
  });
}

// helper ///////////////////
