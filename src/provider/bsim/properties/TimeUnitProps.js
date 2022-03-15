import { isSelectEntryEdited, SelectEntry } from "@bpmn-io/properties-panel";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getBsimObject } from "../utils/BsimUtil";
import { getName } from "../utils/helper";

export function TimeUnitProps(props) {
  const { element, idPrefix, container, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const bpmnFactory = useService("bpmnFactory");
  const bsimObject = getBsimObject(element);

  const isOptional = () => {
    return idPrefix === "bsim:setUpDuration";
  };

  const getProperty = () => {
    return property || "timeUnit";
  };

  const getValue = () => {
    return container?.get(getProperty()) || "";
  };

  const setValue = (value) => {
    console.log(bsimObject, container, value);

    // (1) remove optional distribution
    if (value === "" && isOptional()) {
      bsimObject.set(idPrefix, undefined);
      return;
    }

    // (2) set a new provider
    if (value !== "" && container === undefined) {
      const newContainer = createElement(
        idPrefix,
        {
          timeUnit: value,
        },
        bsimObject,
        bpmnFactory
      );

      const constantDistr = createElement(
        "bsim:constantDistribution",
        {},
        newContainer,
        bpmnFactory
      );

      constantDistr.set(
        "bsim:constantValue",
        createElement(
          "bsim:constantValue",
          {
            value: 5,
          },
          constantDistr,
          bpmnFactory
        )
      );

      newContainer.set("bsim:distribution", constantDistr);

      const properties = {};
      properties[idPrefix] = newContainer;

      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: bsimObject,
        properties: properties,
      });

      return;
    }

    // (0) anyway, set timeUnit

    const properties = {};
    properties[getProperty()] = value;

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: container,
      properties,
    });
  };

  const getOptions = () => {
    const options = [
      { value: "", label: translate("<none>") },
      { value: "HOURS", label: translate("HOURS") },
      { value: "MINUTES", label: translate("MINUTES") },
      { value: "DAYS", label: translate("DAYS") },
      { value: "SECONDS", label: translate("SECONDS") },
      { value: "MICROSECONDS", label: translate("MICROSECONDS") },
      { value: "MILLISECONDS", label: translate("MILLISECONDS") },
      { value: "NANOSECONDS", label: translate("NANOSECONDS") },
    ];
    return isOptional() ? options : options.slice(1);
  };

  return SelectEntry({
    element,
    id: idPrefix + getProperty(),
    label: `${getName(getProperty(), idPrefix)}`,
    isEdited: isSelectEntryEdited,
    getValue,
    setValue,
    getOptions,
  });
}
