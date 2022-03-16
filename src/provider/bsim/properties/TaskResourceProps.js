import {
  CollapsibleEntry,
  isNumberFieldEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  ListEntry,
  NumberFieldEntry,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { without } from "min-dash";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getBsimObject } from "../utils/BsimUtil";
import { getDescr, getName } from "../utils/helper";
import { TimeUnitProps } from "./TimeUnitProps";

const RESOURCE_PROPS = {
  id: undefined,
  amount: 1,
  assignmentDefinition: undefined,
};

export function TaskResourceProps({ element, injector }) {
  if (!is(element, "bpmn:Activity")) {
    return [];
  }

  const bpmnFactory = injector.get("bpmnFactory"),
    commandStack = injector.get("commandStack");

  const bsimObject = getBsimObject(element);
  const resources = bsimObject.get("bsim:resources");
  let resourcesArray = resources?.get("resource") || [];

  const items = resourcesArray.map((resource, index) => {
    const id = `resource-${index}`;
    return {
      id,
      label: getResourceLabel(resource),
      entries: ResourceData({
        idPrefix: id,
        element,
        resource,
      }),
      remove: removeFactory({ commandStack, element, resource }),
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element }),
    shouldSort: false,
  };
}

function ResourceData(props) {
  const { idPrefix, element, resource } = props;

  return [
    {
      id: `${idPrefix}-id`,
      component: ResourceId,
      resource,
    },
    {
      id: `${idPrefix}-amount`,
      component: ResourceAmount,
      resource,
    },
    {
      id: `${idPrefix}-assignmentDefinition`,
      component: AssignmentDefinition,
      resource,
    },
  ];
}

function ResourceId({ id, element, resource }) {
  const commandStack = useService("commandStack");
  const modeler = useService("bpmnjs");

  const definitions = modeler._definitions;

  const resourceData = definitions.get("bsim:resourceData");
  const resourceDataArray = resourceData.get("bsim:dynamicResource") || [];

  function getValue() {
    return resource.get("id")?.get("id") || "";
  }

  function setValue(value) {
    const resourceData = resourceDataArray.find(
      (resource) => resource.id === value
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resource,
      properties: {
        id: resourceData,
      },
    });
  }

  const getOptions = () => {
    return resourceDataArray.map((resourceData) => ({
      value: resourceData.id,
      label: resourceData.id,
    }));
  };

  return SelectEntry({
    element: resource,
    isEdited: isSelectEntryEdited,
    id: id + "-resource",
    label: getName("id", "bsim:resource"),
    description: getDescr("id", "bsim:resource"),
    getValue,
    setValue,
    getOptions,
  });
}

function ResourceAmount({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("amount", "bsim:resource"),
    debounce,
    min: 0,
    isEdited: isNumberFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          amount: value,
        },
      });
    },
    getValue: () => {
      return resource.get("amount");
    },
  };

  return NumberFieldEntry(options);
}

function AssignmentDefinition({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");
  const bpmnFactory = useService("bpmnFactory");

  const setValue = (value) => {
    if (value === undefined) {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          assignmentDefinition: undefined,
        },
      });
      return;
    }
    let assignmentDefinition = resource.get("assignmentDefinition");
    if (!assignmentDefinition) {
      assignmentDefinition = createElement(
        "bsim:assignmentDefinition",
        {},
        resource,
        bpmnFactory
      );

      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          assignmentDefinition,
        },
      });
    }

    let priority = assignmentDefinition.get("bsim:priority");
    if (!priority) {
      priority = createElement(
        "bsim:priority",
        { value: value },
        assignmentDefinition,
        bpmnFactory
      );
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: assignmentDefinition,
        properties: {
          priority,
        },
      });
      return;
    }

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: priority,
      properties: {
        value: value,
      },
    });
  };
  const getValue = () => {
    const assignmentDefinition = resource.get("assignmentDefinition");
    const priority = assignmentDefinition?.get("priority")?.get("value") || "";

    return priority;
  };

  let options = {
    element,
    id: id,
    label: getName("assignmentDefinition", "bsim:resource"),
    debounce,
    min: 0,
    step: 1,
    isEdited: isNumberFieldEntryEdited,
    setValue,
    getValue,
  };

  return NumberFieldEntry(options);
}

function addFactory({ bpmnFactory, commandStack, element }) {
  return function addResource(event) {
    event.stopPropagation();

    const bsimObject = getBsimObject(element);
    let resources = bsimObject.get("bsim:resources");

    if (!resources) {
      resources = createElement(
        "bsim:resources",
        { resource: [] },
        bsimObject,
        bpmnFactory
      );

      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: bsimObject,
        properties: { resources },
      });
    }

    const resource = createElement(
      "bsim:resource",
      { ...RESOURCE_PROPS },
      resources,
      bpmnFactory
    );

    const resourceArray = resources.get("resource") || [];

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resources,
      properties: { resource: [...resourceArray, resource] },
    });
  };
}

function removeFactory({ commandStack, element, resource }) {
  return function removeResource(event) {
    event.stopPropagation();

    const bsimObject = getBsimObject(element);
    const resources = bsimObject.get("bsim:resources");
    const resourceArray = resources.get("resource") || [];

    const newResources = without(resourceArray, resource);

    if (newResources.length === 0) {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: bsimObject,
        properties: {
          resources: undefined,
        },
      });
      return;
    }

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resources,
      properties: {
        resource: newResources,
      },
    });
  };
}

// helper ///////////////////////

function getResourceLabel(resource) {
  const id = resource.get("id")?.get("id");
  return id;
}

function compareName(instance, anotherInstance) {
  const [name = "", anotherName = ""] = [instance.name, anotherInstance.name];

  return name === anotherName ? 0 : name > anotherName ? 1 : -1;
}
