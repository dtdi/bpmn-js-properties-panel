import {
  ListEntry as RelatedEntry,
  SimpleEntry,
} from "@bpmn-io/properties-panel";

import { without } from "min-dash";

import { useService } from "../../../hooks";

import { createElement } from "../../../utils/ElementUtil";

function RelatedProp(props) {
  const { element, id: idPrefix, index, item } = props;

  const id = `${idPrefix}-listItem-${index}`;

  return <RelatedItem idPrefix={id} element={element} item={item} />;
}

export function RelatedProps(props) {
  const { idPrefix, element, property } = props;

  const bpmnFactory = useService("bpmnFactory");
  const commandStack = useService("commandStack");
  const translate = useService("translate");

  const related = property;

  const items = related.get("related") || [];

  function removeItem(item) {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: related,
      properties: {
        items: without(related.get("related"), item),
      },
    });
  }

  function compareFn(item, anotherItem) {
    const [value = "", anotherValue = ""] = [item.id, anotherItem.id];

    return value === anotherValue ? 0 : value > anotherValue ? 1 : -1;
  }

  return RelatedEntry({
    element,
    autoFocusEntry: true,
    compareFn,
    id: idPrefix + "-list",
    items,
    label: translate("List related"),
    onRemove: removeItem,
    component: RelatedProp,
    onAdd: () => {
      return;
    },
  });
}

function RelatedItem(props) {
  const { idPrefix, element, item } = props;

  const commandStack = useService("commandStack");

  const getValue = () => {
    return item.get("id");
  };

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: item,
      properties: {
        value,
      },
    });
  };

  return RelatedValue({
    id: idPrefix + "-value",
    disabled: true,
    getValue,
    setValue,
  });
}

function RelatedValue(props) {
  const { id, disabled, getValue, setValue } = props;

  const debounce = useService("debounceInput", true);

  return (
    <SimpleEntry
      id={id}
      getValue={getValue}
      setValue={setValue}
      disabled={disabled}
      debounce={debounce}
    />
  );
}

// helper //////////////////////
