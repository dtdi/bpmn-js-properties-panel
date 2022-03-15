import {
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getBsimObject } from "../utils/BsimUtil";
import { getDescr, getName } from "../utils/helper";

export function BsimConfigurationProps(props) {
  const { element } = props;

  if (!is(element, "bpmn:Process")) {
    return [];
  }

  const bsimObject = getBsimObject(element);

  const entries = [];

  entries.push(
    {
      id: "processInstances",
      component: InstancesField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:processInstances",
    },
    {
      id: "randomSeed",
      component: InstancesField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:randomSeed",
    },
    {
      id: "startDateTime",
      component: InstancesField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:startDateTime",
    },
    {
      id: "endDateTime",
      component: InstancesField,
      isEdited: isTextFieldEntryEdited,
      process: bsimObject,
      property: "bsim:endDateTime",
    }
  );

  return entries;
}

function InstancesField(props) {
  const { element, process, property } = props;

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
      isEdited={isTextFieldEntryEdited}
      setValue={setValue}
      getValue={getValue}
      debounce={debounce}
      label={getName(property, "bsim:simulationConfiguration")}
      description={getDescr(property, "bsim:simulationConfiguration")}
    />
  );
}
