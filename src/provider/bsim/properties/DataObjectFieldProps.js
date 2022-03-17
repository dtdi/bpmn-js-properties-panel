import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { getBsimObject } from "../utils/BsimUtil";
import { createElement } from "../../../utils/ElementUtil";
import {
  isTextFieldEntryEdited,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { useService } from "../../../hooks";
import { getName } from "../utils/helper";
import { DistributionProps } from "./DistributionProps";
import { without } from "min-dash";

const DATA_FIELD_PROPS = {
  name: "",
  type: 1,
  distribution: undefined,
};

const DATA_FIELD_TYPES = [
  { value: "long", label: "long" },
  { value: "double", label: "double" },
  { value: "string", label: "string" },
  { value: "boolean", label: "boolean" },
];

export function DataObjectFieldProps({ element, injector }) {
  if (!is(element, "bpmn:DataObjectReference")) return [];

  const bsimObject = getBsimObject(element);

  if (!is(bsimObject, "bsim:dataObject")) return [];

  const bpmnFactory = injector.get("bpmnFactory"),
    commandStack = injector.get("commandStack");

  const fields = bsimObject.get("fields") || [];

  const items = fields.map((field, index) => {
    const id = `field-${index}`;
    return {
      id,
      label: getFieldLabel(field),
      entries: FieldData({
        idPrefix: id,
        element,
        field,
      }),
      remove: removeFactory({ commandStack, element, field }),
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element }),
  };
}

function FieldData({ idPrefix, field }) {
  return [
    { id: `${idPrefix}-name`, field, component: FieldName },
    { id: `${idPrefix}-type`, field, component: FieldType },
    ...DistributionProps({
      idPrefix: `${idPrefix}-distribution`,
      container: field,
      distribution: field.get("distribution"),
    }),
  ];
}

function FieldName({ id, field, element }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("name", "bsim:field"),
    debounce,
    isEdited: isTextFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: field,
        properties: {
          name: value,
        },
      });
    },
    getValue: () => {
      return field.get("name");
    },
  };

  return TextFieldEntry(options);
}

function FieldType({ id, field, element }) {
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("type", "bsim:field"),
    isEdited: isTextFieldEntryEdited,
    getOptions: () => DATA_FIELD_TYPES,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: field,
        properties: {
          type: value,
        },
      });
    },
    getValue: () => {
      return field.get("type");
    },
  };

  return SelectEntry(options);
}

function addFactory({ bpmnFactory, commandStack, element }) {
  return function addDataField(event) {
    event.stopPropagation();

    const bsimObject = getBsimObject(element);
    let fields = bsimObject.get("fields") || [];

    const constantValue = createElement(
      "bsim:constantValue",
      { value: 1 },
      null,
      bpmnFactory
    );

    const distribution = createElement(
      "bsim:constantDistribution",
      { constantValue },
      null,
      bpmnFactory
    );

    const dataField = createElement(
      "bsim:field",
      { ...DATA_FIELD_PROPS, distribution },
      fields,
      bpmnFactory
    );
    distribution.$parent = dataField;

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: bsimObject,
      properties: { fields: [...fields, dataField] },
    });
  };
}

function removeFactory({ commandStack, element, field }) {
  return function removeResource(event) {
    event.stopPropagation();

    const dataObject = getBsimObject(element);
    const dataFields = dataObject.get("fields") || [];

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: dataObject,
      properties: {
        fields: without(dataFields, field),
      },
    });
  };
}

// helper ///////////////////////

function getFieldLabel(field) {
  return field.get("name");
}

function compareName(instance, anotherInstance) {
  const [name = "", anotherName = ""] = [instance.name, anotherInstance.name];

  return name === anotherName ? 0 : name > anotherName ? 1 : -1;
}
