import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { getBsimObject } from "../utils/BsimUtil";

import { getExtensionElementsList } from "../../../utils/ExtensionElementsUtil";

import { createElement, nextId } from "../../../utils/ElementUtil";
import {
  isSelectEntryEdited,
  isTextAreaEntryEdited,
  isTextFieldEntryEdited,
  SelectEntry,
  TextAreaEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";

import { without } from "min-dash";
import { useService } from "../../../hooks";
import { RelatedProps } from "./RelatedProp";

const DATA_FIELD_TYPES = [
  { value: "Boolean", label: "Boolean" },
  { value: "String", label: "String" },
  { value: "Number", label: "Number" },
];

export function areAbprPropsSupported(element) {
  return true;
}

export function CreatePropertyCmd(element, type, parent, bpmnFactory) {
  const newProperty = createElement(
    type,
    {
      name: nextId("ABPR_"),
    },
    parent,
    bpmnFactory
  );

  const propertyName = "values";

  return {
    cmd: "element.updateModdleProperties",
    context: {
      element,
      moddleElement: parent,
      properties: {
        [propertyName]: [...parent.get(propertyName), newProperty],
      },
    },
  };
}

export function AddPropertyCmd(element, type, bpmnFactory) {
  const commands = [];
  const businessObject = getBusinessObject(element);

  let extensionElements = businessObject.get("extensionElements");

  // (1) ensure extension elements
  if (!extensionElements) {
    extensionElements = createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      businessObject,
      bpmnFactory
    );

    commands.push({
      cmd: "element.updateModdleProperties",
      context: {
        element,
        moddleElement: businessObject,
        properties: { extensionElements },
      },
    });
  }

  // (2) ensure abprProperties
  let abprProperties = getAbprProperties(element);

  if (!abprProperties) {
    const parent = extensionElements;

    abprProperties = createElement(
      "abpr:properties",
      {
        values: [],
      },
      parent,
      bpmnFactory
    );

    commands.push({
      cmd: "element.updateModdleProperties",
      context: {
        element,
        moddleElement: extensionElements,
        properties: {
          values: [...extensionElements.get("values"), abprProperties],
        },
      },
    });
  }

  // (3) create + add parameter
  commands.push(CreatePropertyCmd(element, type, abprProperties, bpmnFactory));

  return commands;
}

function getElements(businessObject, type, property) {
  const elements = getExtensionElementsList(businessObject, type);
  return !property ? elements : (elements[0] || {})[property] || [];
}

export function getAbprPropertiesValues(element) {
  const abpr = getAbprProperties(element);

  return (abpr && abpr.get("values")) || [];
}

export function getAbprProperties(element) {
  const businessObject = getBusinessObject(element);

  return (getElements(businessObject, "abpr:properties") || [])[0];
}

export function AbprProps({ element, injector }) {
  if (!areAbprPropsSupported(element)) {
    return null;
  }

  const abprProperties = getAbprPropertiesValues(element) || [];

  const bpmnFactory = injector.get("bpmnFactory"),
    commandStack = injector.get("commandStack");

  const items = abprProperties.map((property, index) => {
    const id = element.id + "-abprProperty-" + index;

    return {
      id,
      label: property.get("name") || property.get("id") || "",
      entries: AbprProperty({
        idPrefix: id,
        element,
        property,
      }),
      autoFocusEntry: id + "-id",
      remove: removeFactory({ element, commandStack, property }),
    };
  });

  function add(event) {
    event.stopPropagation();

    commandStack.execute(
      "properties-panel.multi-command-executor",
      AddPropertyCmd(element, "abpr:property", bpmnFactory)
    );
  }

  return {
    items,
    add,
  };
}

function removeFactory(props) {
  const { commandStack, element, property } = props;

  return function (event) {
    event.stopPropagation();

    const properties = getAbprProperties(element);

    if (!properties) {
      return;
    }

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: properties,
      properties: {
        values: without(properties.get("values"), property),
      },
    });
  };
}

export default function AbprProperty(props) {
  const { idPrefix, element, property } = props;

  const propertyType = property.get("type");

  let entries = [
    {
      id: idPrefix + "-id",
      component: Id,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      property,
    },
    {
      id: idPrefix + "-name",
      component: Name,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      property,
    },
    {
      id: idPrefix + "-type",
      component: Type,
      isEdited: isSelectEntryEdited,
      idPrefix,
      property,
    },
  ];

  if (propertyType === "string") {
    entries.push({
      id: idPrefix + "-value",
      component: StringField,
      isEdited: isTextAreaEntryEdited,
      idPrefix,
      property,
    });
  } else if (propertyType === "number") {
    entries.push({
      id: idPrefix + "-value",
      component: NumberField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      property,
    });
  } else if (propertyType === "boolean") {
    entries.push({
      id: idPrefix + "-value",
      component: BooleanField,
      isEdited: isSelectEntryEdited,
      idPrefix,
      property,
    });
  }

  entries.push({
    id: `${idPrefix}-related`,
    component: RelatedProps,
    idPrefix,
    property,
  });

  return entries;
}

function Id(props) {
  const { idPrefix, element, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: {
        id: value,
      },
    });
  };

  const getValue = (property) => {
    return property.get("id");
  };

  return TextFieldEntry({
    element: property,
    id: idPrefix + "-id",
    label: translate("Id"),
    getValue,
    setValue,
    debounce,
  });
}

function Name(props) {
  const { idPrefix, element, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: {
        name: value,
      },
    });
  };

  const getValue = (property) => {
    return property.get("name");
  };

  return TextFieldEntry({
    element: property,
    id: idPrefix + "-name",
    label: translate("Name"),
    getValue,
    setValue,
    debounce,
  });
}

function Type(props) {
  const { idPrefix, element, property } = props;

  const bpmnFactory = useService("bpmnFactory");
  const commandStack = useService("commandStack");
  const translate = useService("translate");

  const getValue = (mapping) => {
    return mapping.type;
  };

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: { type: value },
    });
  };

  const getOptions = () => {
    const options = [
      { label: translate("Boolean"), value: "boolean" },
      { label: translate("String"), value: "string" },
      { label: translate("Number"), value: "number" },
    ];

    return options;
  };

  return SelectEntry({
    element: property,
    id: idPrefix + "-type",
    label: translate("Type"),
    getValue,
    setValue,
    getOptions,
  });
}

function StringField(props) {
  const { idPrefix, element, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: {
        value,
      },
    });
  };

  const getValue = (parameter) => {
    return parameter.get("value");
  };

  return TextAreaEntry({
    element: property,
    id: idPrefix + "-string",
    label: translate("Value"),
    getValue,
    setValue,
    rows: 2,
    debounce,
  });
}

function NumberField(props) {
  const { idPrefix, element, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: {
        value,
      },
    });
  };

  const getValue = (parameter) => {
    return parameter.get("value");
  };

  return TextFieldEntry({
    element: property,
    id: idPrefix + "-number",
    label: translate("Value"),
    getValue,
    setValue,
    debounce,
  });
}

function BooleanField(props) {
  const { idPrefix, element, property } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: property,
      properties: {
        value,
      },
    });
  };

  const getOptions = () => {
    return [
      { label: translate("True"), value: "true" },
      { label: translate("False"), value: "false" },
    ];
  };

  const getValue = (parameter) => {
    return parameter.get("value");
  };

  return SelectEntry({
    element: property,
    id: idPrefix + "-value",
    label: translate("Value"),
    getValue,
    setValue,
    getOptions,
  });
}
