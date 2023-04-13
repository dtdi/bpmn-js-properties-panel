import {
  isNumberFieldEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  NumberFieldEntry,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { getBusinessObject, is, isAny } from "bpmn-js/lib/util/ModelUtil";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getBsimObject } from "../utils/BsimUtil";
import { getDescr, getName } from "../utils/helper";

export function BsimConfigurationProps(props) {
  const { element: primaryElement } = props;
  let element = getBusinessObject(primaryElement);

  if (!isAny(primaryElement, ["bpmn:Process", "bpmn:Collaboration"])) {
    return [];
  }
  let bsimObject = getBsimObject(element);

  if (is(primaryElement, "bpmn:Collaboration")) {
    const collaborators = element.participants;
    if (collaborators && collaborators.length && collaborators.length === 1) {
      element = collaborators[0].processRef;
      bsimObject = element.bsim;
    }
  }
  const entries = [];

  entries.push(
    {
      id: "processInstances",
      component: NumberField,
      isEdited: isNumberFieldEntryEdited,
      process: bsimObject,
      property: "bsim:processInstances",
    },
    {
      id: "randomSeed",
      component: NumberField,
      isEdited: isNumberFieldEntryEdited,
      process: bsimObject,
      property: "bsim:randomSeed",
    },
    {
      id: "startDateTime",
      component: DateField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:startDateTime",
    },
    {
      id: "endDateTime",
      component: DateField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:endDateTime",
    }
  );

  return entries;
}

function DateField(props) {
  const { element, process, property, isEdited } = props;

  const commandStack = useService("commandStack");
  const debounce = useService("debounceInput");
  const moddle = useService("moddle");

  const getValue = () => {
    return process.get(property);
  };

  const setValue = (value) => {
    const properties = {};
    properties[property] = value;

    commandStack.execute("element.updateModdleProperties", {
      element: element,
      moddleElement: process,
      properties: properties,
    });
  };

  return (
    <TextFieldEntry
      element={element}
      id={property}
      isEdited={isEdited}
      setValue={setValue}
      getValue={getValue}
      debounce={debounce}
      label={getName(property, "bsim:simulationConfiguration")}
      description={getDescr(property, "bsim:simulationConfiguration")}
    />
  );
}

function NumberField(props) {
  const { element, process, property, isEdited } = props;

  const commandStack = useService("commandStack");
  const debounce = useService("debounceInput");
  const moddle = useService("moddle");

  const getValue = () => {
    return process.get(property);
  };

  const setValue = (value) => {
    const properties = {};
    properties[property] = value;

    commandStack.execute("element.updateModdleProperties", {
      element: element,
      moddleElement: process,
      properties: properties,
    });
  };

  return (
    <NumberFieldEntry
      element={element}
      id={property}
      isEdited={isEdited}
      setValue={setValue}
      getValue={getValue}
      debounce={debounce}
      label={getName(property, "bsim:simulationConfiguration")}
      description={getDescr(property, "bsim:simulationConfiguration")}
    />
  );
}
