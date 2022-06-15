import {
  CollapsibleEntry,
  isTextFieldEntryEdited,
  ListEntry,
  SelectEntry,
  TextFieldEntry,
} from "@bpmn-io/properties-panel";
import { getBusinessObject, is, isAny } from "bpmn-js/lib/util/ModelUtil";
import { without } from "min-dash";
import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
// import { DateTime } from "luxon";

import { getDescr, getName } from "../utils/helper";

const WEEKDAY_OPTIONS = [
  { value: "", label: "<empty>", lbl: "<>" },
  { value: "MONDAY", label: "Monday", lbl: "Mon" },
  { value: "TUESDAY", label: "Tuesday", lbl: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", lbl: "Wed" },
  { value: "THURSDAY", label: "Thursday", lbl: "Thu" },
  { value: "FRIDAY", label: "Friday", lbl: "Fri" },
  { value: "SATURDAY", label: "Saturday", lbl: "Sat" },
  { value: "SUNDAY", label: "Sunday", lbl: "Sun" },
];

const TIMETABLE_PROPS = {
  id: "",
  timetableItem: [],
};

const TIMETABLE_ITEM_PROPS = {
  from: "",
  to: "",
  beginTime: undefined,
  endTime: undefined,
};

export function TimeTableProps({ element, injector }) {
  if (!isAny(element, ["bpmn:Process", "bpmn:Collaboration"])) {
    return [];
  }

  const definitions = getBusinessObject(element).$parent;

  if (!is(definitions, "bpmn:Definitions")) {
    return [];
  }

  const bpmnFactory = injector.get("bpmnFactory"),
    commandStack = injector.get("commandStack");

  const timetables = definitions.get("bsim:timetables");
  const timetablesArray = timetables.get("bsim:timetable") || [];

  const items = timetablesArray.map((timetable, index) => {
    const id = `timetable-${index}`;
    return {
      id,
      label: getTimetableLabel(timetable),
      entries: Timetable({
        idPrefix: id,
        element,
        timetable,
      }),
      remove: removeFactory({ commandStack, element, timetable }),
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element }),
    shouldSort: false,
  };
}

function Timetable({ idPrefix, timetable }) {
  return [
    {
      id: `${idPrefix}-id`,
      component: TimetableId,
      timetable,
    },
    {
      id: `${idPrefix}-items`,
      component: TimetableItems,
      timetable,
    },
  ];
}

function TimetableId({ id, element, timetable }) {
  const debounce = useService("debounceInput");
  const commandStack = useService("commandStack");

  let options = {
    element,
    id: id,
    label: getName("id", "bsim:timetable"),
    debounce,
    isEdited: isTextFieldEntryEdited,
    setValue: (value) => {
      commandStack.execute("element.updateModdleProperties", {
        element,
        moddleElement: timetable,
        properties: {
          id: value,
        },
      });
    },
    getValue: () => {
      return timetable.get("id");
    },
  };

  return TextFieldEntry(options);
}

function TimetableItemEntry(props) {
  const { element, idPrefix, item } = props;

  return [
    {
      id: `${idPrefix}-from`,
      component: SelectWeekdayProperty,
      item,
      elem: element,
      idPrefix,
      property: "from",
    },
    {
      id: `${idPrefix}-to`,
      component: SelectWeekdayProperty,
      item,
      elem: element,
      idPrefix,
      property: "to",
    },
    {
      id: `${idPrefix}-beginTime`,
      component: TimeProperty,
      item,
      elem: element,
      idPrefix,
      property: "beginTime",
    },
    {
      id: `${idPrefix}-endTime`,
      component: TimeProperty,
      item,
      elem: element,
      idPrefix,
      property: "endTime",
    },
  ];
}

function SelectWeekdayProperty({ idPrefix, elem, item, property }) {
  const commandStack = useService("commandStack");

  const setValue = (value) => {
    const properties = {};
    properties[property] = value;
    commandStack.execute("element.updateModdleProperties", {
      element: elem,
      moddleElement: item,
      properties,
    });
  };

  const getValue = (item) => {
    return item.get(property);
  };

  const getOptions = () => WEEKDAY_OPTIONS;

  return SelectEntry({
    element: item,
    id: idPrefix + "-" + property,
    label: getName(property, "bsim:timetableItem"),
    description: getDescr(property, "bsim:timetableItem"),
    getValue,
    setValue,
    getOptions,
  });
}

function TimeProperty({ idPrefix, elem, item, property }) {
  const commandStack = useService("commandStack"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    const properties = {};
    properties[property] = value;
    commandStack.execute("element.updateModdleProperties", {
      element: elem,
      moddleElement: item,
      properties,
    });
  };

  const getValue = (item) => {
    return item.get(property);
  };

  return TextFieldEntry({
    element: item,
    id: idPrefix + "-" + property,
    label: getName(property, "bsim:timetableItem"),
    description: getDescr(property, "bsim:timetableItem"),
    getValue,
    setValue,
    debounce,
  });
}

function TimetableItem(props) {
  const { element, id: idPrefix, index, item, open } = props;

  const fieldId = `${idPrefix}-item-${index}`;

  return (
    <CollapsibleEntry
      id={fieldId}
      entries={TimetableItemEntry({
        element,
        item,
        idPrefix: fieldId,
      })}
      label={getItemName(item)}
      open={open}
    />
  );
}

function TimetableItems({ id, element, timetable }) {
  const bpmnFactory = useService("bpmnFactory");
  const commandStack = useService("commandStack");

  const items = timetable.get("timetableItem");

  function addItem() {
    const timetableItem = createElement(
      "bsim:timetableItem",
      {
        ...TIMETABLE_ITEM_PROPS,
      },
      timetable,
      bpmnFactory
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: timetable,
      properties: {
        timetableItem: [...timetable.get("timetableItem"), timetableItem],
      },
    });
  }

  function removeItem(timetableItem) {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: timetable,
      properties: {
        timetableItem: without(timetable.get("timetableItem"), timetableItem),
      },
    });
  }

  return (
    <ListEntry
      id={id}
      element={element}
      label={"Timetable Items"}
      items={items}
      component={TimetableItem}
      onAdd={addItem}
      onRemove={removeItem}
      compareFn={compareName}
      autoFocusEntry
    />
  );
}

function addFactory({ bpmnFactory, commandStack, element }) {
  return function addTimetable(event) {
    event.stopPropagation();

    const definitions = getBusinessObject(element).$parent;

    const timetables = definitions.get("bsim:timetables");
    const timetablesArray = timetables.get("bsim:timetable") || [];

    const timetable = createElement(
      "bsim:timetable",
      { ...TIMETABLE_PROPS },
      timetables,
      bpmnFactory
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: timetables,
      properties: { timetable: [...timetablesArray, timetable] },
    });
  };
}

function removeFactory({ commandStack, element, timetable }) {
  return function (event) {
    event.stopPropagation();
  };
}

// helper ///////////////////////

function getTimetableLabel(timetable) {
  const id = timetable.get("id");
  return id;
}

function compareName(instance, anotherInstance) {
  const [name = "", anotherName = ""] = [instance.name, anotherInstance.name];

  return name === anotherName ? 0 : name > anotherName ? 1 : -1;
}

function getItemName(item) {
  if (!item || !item.from || !item.to) return "<empty>";

  const from = WEEKDAY_OPTIONS.find((day) => day.value === item.from).lbl;
  const to = WEEKDAY_OPTIONS.find((day) => day.value === item.to).lbl;

  return `${from}-${to} `;
}
