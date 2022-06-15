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
import { getBusinessObject, is, isAny } from "bpmn-js/lib/util/ModelUtil";
import { without } from "min-dash";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getDescr, getName } from "../utils/helper";
import { TimeUnitProps } from "./TimeUnitProps";

const DYNAMIC_RESOURCE_PROPS = {
  id: undefined,
  defaultQuantity: 1,
  defaultTimetableId: undefined,
  defaultCost: 10,
};

const INSTANCE_PROPS = {
  name: undefined,
  timetableId: undefined,
  cost: undefined,
};

export function ResourceDataProps({ element, injector }) {
  if (!isAny(element, ["bpmn:Process", "bpmn:Collaboration"])) {
    return [];
  }

  const definitions = getBusinessObject(element).$parent;

  if (!is(definitions, "bpmn:Definitions")) {
    return [];
  }

  const bpmnFactory = injector.get("bpmnFactory"),
    commandStack = injector.get("commandStack");

  const resources = definitions.get("bsim:resourceData");
  const resourcesArray = resources.get("bsim:dynamicResource") || [];

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
    /** 
    {
      id: `${idPrefix}-name`,
      component: ResourceName,
      resource,
    },
    */
    {
      id: `${idPrefix}-defaultQuantity`,
      component: ResourceQuantity,
      resource,
    },
    {
      id: `${idPrefix}-defaultCost`,
      component: ResourceCost,
      resource,
    },
    {
      id: `${idPrefix}-defaultTimeUnit`,
      idPrefix: `bsim:dynamicResource`,
      component: TimeUnitProps,
      element: resource,
      container: resource,
      property: "defaultTimeUnit",
    },
    {
      id: `${idPrefix}-defaultTimetableId`,
      component: TimeTable,
      resource,
    },
    {
      id: `${idPrefix}-instances`,
      component: Instances,
      resource,
    },
  ];
}

function ResourceName({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("bsim:name", "bsim:dynamicResource"),
    description: getDescr("bsim:name", "bsim:dynamicResource"),
    debounce,
    isEdited: isTextFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          "bsim:name": value,
        },
      });
    },
    getValue: () => {
      return resource.get("bsim:name");
    },
  };

  return TextFieldEntry(options);
}

function ResourceId({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("id", "bsim:dynamicResource"),
    debounce,
    isEdited: isTextFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          id: value,
        },
      });
    },
    getValue: () => {
      return resource.get("id");
    },
  };

  return TextFieldEntry(options);
}

function ResourceQuantity({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("defaultQuantity", "bsim:dynamicResource"),
    debounce,
    min: 0,
    isEdited: isNumberFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          defaultQuantity: value,
        },
      });
    },
    getValue: () => {
      return resource.get("defaultQuantity");
    },
  };

  return NumberFieldEntry(options);
}

function ResourceCost({ id, element, resource }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("defaultCost", "bsim:dynamicResource"),
    debounce,
    min: 0,
    isEdited: isNumberFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: resource,
        properties: {
          defaultCost: value,
        },
      });
    },
    getValue: () => {
      return resource.get("defaultCost");
    },
  };

  return NumberFieldEntry(options);
}

function TimeTable({ id, element, resource }) {
  const commandStack = useService("commandStack");
  const definitions = getBusinessObject(element).$parent;

  const timetables = definitions.get("bsim:timetables");
  const timetablesArray = timetables.get("bsim:timetable") || [];

  function getValue() {
    return resource.get("defaultTimetableId")?.get("id") || "";
  }

  function setValue(value) {
    const timetable = timetablesArray.find(
      (timetable) => timetable.id === value
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resource,
      properties: {
        defaultTimetableId: timetable,
      },
    });
  }

  const getOptions = () => {
    return timetablesArray.map((timetable) => ({
      value: timetable.id,
      label: timetable.id,
    }));
  };

  return (
    <SelectEntry
      isEdited={isSelectEntryEdited}
      id={id}
      label={getName("defaultTimetableId", "bsim:dynamicResource")}
      description={getDescr("defaultTimetableId", "bsim:dynamicResource")}
      getValue={getValue}
      setValue={setValue}
      getOptions={getOptions}
    />
  );
}

function ResourceInstance(props) {
  const { element, idPrefix, instance } = props;

  return [
    {
      id: `${idPrefix}-name`,
      component: NameProperty,
      instance,
      elem: element,
      idPrefix,
    },
    {
      id: `${idPrefix}-cost`,
      component: CostProperty,
      instance,
      elem: element,
      idPrefix,
    },
    {
      id: `${idPrefix}-timetable`,
      component: TimetableProperty,
      instance,
      elem: element,
      idPrefix,
    },
  ];
}

function NameProperty(props) {
  const { idPrefix, elem, instance } = props;
  const commandStack = useService("commandStack"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: elem,
      moddleElement: instance,
      properties: {
        name: value,
      },
    });
  };

  const getValue = (instance) => {
    return instance.name;
  };

  return TextFieldEntry({
    element: instance,
    id: idPrefix + "-name",
    label: getName("name", "bsim:instance"),
    description: getDescr("name", "bsim:instance"),
    getValue,
    setValue,
    debounce,
  });
}

function CostProperty(props) {
  const { idPrefix, elem: element, instance } = props;
  const commandStack = useService("commandStack"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: element,
      moddleElement: instance,
      properties: {
        cost: value,
      },
    });
  };

  const getValue = (instance) => {
    return instance.cost;
  };

  return NumberFieldEntry({
    element: instance,
    id: idPrefix + "-name",
    label: getName("cost", "bsim:instance"),
    description: getDescr("cost", "bsim:instance"),
    getValue,
    setValue,
    debounce,
  });
}

function TimetableProperty(props) {
  const { idPrefix, elem: element, instance } = props;
  const commandStack = useService("commandStack");

  const definitions = getBusinessObject(element).$parent;

  const timetables = definitions.get("bsim:timetables");
  const timetablesArray = timetables.get("bsim:timetable") || [];

  function getValue() {
    return instance.get("timetableId")?.get("id") || "";
  }

  function setValue(value) {
    const timetable = timetablesArray.find(
      (timetable) => timetable.id === value
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: instance,
      properties: {
        timetableId: timetable,
      },
    });
  }

  const getOptions = () => {
    return timetablesArray.map((timetable) => ({
      value: timetable.id,
      label: timetable.id,
    }));
  };

  return SelectEntry({
    element: instance,
    isEdited: isSelectEntryEdited,
    id: idPrefix + "-timetableId",
    label: getName("timetableId", "bsim:instance"),
    description: getDescr("timetableId", "bsim:instance"),
    getValue,
    setValue,
    getOptions,
  });
}

function Instance(props) {
  const { element, id: idPrefix, index, item: instance, open } = props;

  const fieldId = `${idPrefix}-instance-${index}`;

  return (
    <CollapsibleEntry
      id={fieldId}
      entries={ResourceInstance({
        element,
        instance,
        idPrefix: fieldId,
      })}
      label={instance.get("name") || "<empty>"}
      open={open}
    />
  );
}

function Instances(props) {
  const { id, element, resource } = props;

  const bpmnFactory = useService("bpmnFactory");
  const commandStack = useService("commandStack");

  const instances = resource.get("instances");

  function addInstance() {
    const instance = createElement(
      "bsim:instance",
      {
        ...INSTANCE_PROPS,
        name: `${resource.id} ${resource.get("instances")?.length}`,
        cost: resource.defaultCost,
        timetableId: resource.defaultTimetableId,
      },
      resource,
      bpmnFactory
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resource,
      properties: {
        instances: [...resource.get("instances"), instance],
      },
    });
  }

  function removeInstance(instance) {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resource,
      properties: {
        instances: without(resource.get("instances"), instance),
      },
    });
  }

  return (
    <ListEntry
      id={id}
      element={element}
      label={getName(null, "bsim:instance")}
      items={instances}
      component={Instance}
      onAdd={addInstance}
      onRemove={removeInstance}
      compareFn={compareName}
      autoFocusEntry
    />
  );
}

function addFactory({ bpmnFactory, commandStack, element }) {
  return function addResource(event) {
    event.stopPropagation();

    const definitions = getBusinessObject(element).$parent;

    const resources = definitions.get("bsim:resourceData");
    const resourcesArray = resources.get("bsim:dynamicResource") || [];

    const dynamicResource = createElement(
      "bsim:dynamicResource",
      { ...DYNAMIC_RESOURCE_PROPS },
      resources,
      bpmnFactory
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resources,
      properties: { dynamicResource: [...resourcesArray, dynamicResource] },
    });
  };
}

function removeFactory({ commandStack, element, resource }) {
  return function removeResource(event) {
    event.stopPropagation();

    const definitions = getBusinessObject(element).$parent;

    const resources = definitions.get("bsim:resourceData");
    const resourcesArray = resources.get("bsim:dynamicResource") || [];

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: resources,
      properties: {
        dynamicResource: without(resourcesArray, resource),
      },
    });
  };
}

// helper ///////////////////////

function getResourceLabel(resource) {
  const id = resource.get("id");
  return id;
}

function compareName(instance, anotherInstance) {
  const [name = "", anotherName = ""] = [instance.name, anotherInstance.name];

  return name === anotherName ? 0 : name > anotherName ? 1 : -1;
}
