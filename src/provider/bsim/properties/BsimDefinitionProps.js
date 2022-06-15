import {
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { getBusinessObject, is, isAny } from "bpmn-js/lib/util/ModelUtil";

import { useService } from "../../../hooks";
import { getDescr, getName } from "../utils/helper";

export function BsimDefinitionProps(props) {
  const { element: primaryElement } = props;

  if (!isAny(primaryElement, ["bpmn:Process", "bpmn:Collaboration"])) {
    return [];
  }
  let element = primaryElement;

  const definitions = getBusinessObject(element).$parent;

  if (!is(definitions, "bpmn:Definitions")) {
    return [];
  }

  const entries = [];

  entries.push(
    {
      id: "zoneOffset",
      component: ZoneOffsetField,
      isEdited: isTextFieldEntryEdited,
      process: definitions,
      property: "bsim:zoneOffset",
    },
    {
      id: "resourceAssignmentOrder",
      component: AssignmentStrategyField,
      isEdited: isTextFieldEntryEdited,
      process: definitions,
      property: "bsim:resourceAssignmentOrder",
    }
  );

  return entries;
}

function AssignmentStrategyField(props) {
  const { element, process, property } = props;

  const commandStack = useService("commandStack");
  const debounce = useService("debounceInput");
  const translate = useService("translate");

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

  const getOptions = () => {
    return [
      { value: "simulationTime", label: translate("simulationTime (default)") },
      { value: "priority", label: translate("priority") },
      {
        value: "priority,simulationTime",
        label: translate("priority,simulationTime"),
      },
    ];
  };

  return (
    <SelectEntry
      element={element}
      id={property}
      isEdited={isSelectEntryEdited}
      setValue={setValue}
      getValue={getValue}
      debounce={debounce}
      getOptions={getOptions}
      label={getName(property, process.$type)}
      description={getDescr(property, process.$type)}
    />
  );
}

function ZoneOffsetField(props) {
  const { element, process, property } = props;

  const commandStack = useService("commandStack");
  const debounce = useService("debounceInput");

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
      label={getName(property, process.$type)}
      description={getDescr(property, process.$type)}
    />
  );
}
