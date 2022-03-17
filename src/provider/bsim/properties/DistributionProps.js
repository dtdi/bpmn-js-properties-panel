import {
  SelectEntry,
  TextFieldEntry,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  ListEntry,
  CollapsibleEntry,
  NumberFieldEntry,
} from "@bpmn-io/properties-panel";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { without } from "min-dash";

import { useService } from "../../../hooks";
import { createElement } from "../../../utils/ElementUtil";
import { getDescr, getName } from "../utils/helper";

export function DistributionProps(props) {
  const { element, idPrefix, distribution, container } = props;

  const entries = [];

  entries.push({
    id: `${idPrefix}-distributionType`,
    component: DistributionType,
    isEdited: isSelectEntryEdited,
    distribution: distribution,
    container: container,
  });

  if (!is(distribution, "bsim:KeyValueDistribution")) {
    const typeDescriptor = moddle.getTypeDescriptor(distribution.$type);

    entries.push(
      ...typeDescriptor.properties.map((property) => {
        return {
          id: `${idPrefix}-${property.type}`,
          component: NumericField,
          property: property.type,
          distribution: distribution,
          container: container,
        };
      })
    );
  } else {
    entries.push({
      id: `${idPrefix}-fields`,
      component: Entries,
      distribution,
      container,
    });
  }

  return entries;
}

function DistributionType(props) {
  const { element, distribution, container } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const moddle = useService("moddle");
  const bpmnFactory = useService("bpmnFactory");

  const getOptions = () => {
    console.log(container);

    const filter = is(container, "bsim:field")
      ? "DataTypeDistribution"
      : "DurationDistribution";

    return moddle
      .getPackage("bsim")
      .types.filter((e) => e.superClass?.includes(filter))
      .map((e) => {
        return {
          value: `bsim:${e.name}`,
          label: e.meta?.displayName || translate(e.name),
        };
      });
  };

  const getValue = () => {
    return distribution.$type;
  };

  const setValue = (value) => {
    if (value === distribution.$type) return;

    const newDistribution = inflate(distribution, value, moddle, bpmnFactory);
    newDistribution.$parent = container;

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: container,
      properties: { distribution: newDistribution },
    });
  };

  return (
    <>
      <div className="bio-properties-panel-entry">
        <div className={"bio-properties-panel-description"}>
          {getDescr(null, "bsim:Distribution")}
        </div>
      </div>
      <SelectEntry
        element={element}
        id={"distributionType"}
        isEdited={isSelectEntryEdited}
        label={getName(null, "bsim:Distribution")}
        description={getDescr(null, getValue())}
        getValue={getValue}
        setValue={setValue}
        getOptions={getOptions}
      />
    </>
  );
}

function Entries(props) {
  const { id, element, distribution } = props;

  const bpmnFactory = useService("bpmnFactory");
  const commandStack = useService("commandStack");
  const translate = useService("translate");

  const entries = distribution.get("entry");

  function addEntry() {
    const entry = createElement(
      "bsim:entry",
      { value: "Entry", frequency: 0 },
      distribution,
      bpmnFactory
    );

    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: distribution,
      properties: { entry: [...distribution.get("entry"), entry] },
    });
  }
  function removeEntry(entry) {
    commandStack.execute("element.updateModdleProperties", {
      element,
      moddleElement: distribution,
      properties: {
        entry: without(distribution.get("entry"), entry),
      },
    });
  }

  return (
    <ListEntry
      id={id}
      element={element}
      label={translate("Fields")}
      items={entries}
      component={Field}
      onAdd={addEntry}
      onRemove={removeEntry}
      compareFn={compareName}
      autoFocusEntry
    />
  );
}

function Field(props) {
  const { element, id: idPrefix, index, item: entry, open } = props;
  const fieldId = `${idPrefix}-field-${index}`;

  return (
    <CollapsibleEntry
      id={fieldId}
      entries={EntryFieldSet({
        element: element,
        entry: entry,
        idPrefix: fieldId,
      })}
      label={`${entry.get("value")}: ${entry.get("frequency")}` || "<empty>"}
      open={open}
    />
  );
}

function EntryFieldSet(props) {
  const { element, idPrefix, entry } = props;
  return [
    {
      id: `${idPrefix}-value`,
      component: ValueProperty,
      entry,
      idPrefix,
      elem: element,
    },
    {
      id: `${idPrefix}-frequency`,
      component: FrequencyProperty,
      entry,
      idPrefix,
      elem: element,
    },
  ];
}

function ValueProperty(props) {
  const { idPrefix, elem, entry } = props;

  const commandStack = useService("commandStack"),
    translate = useService("translate"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: elem,
      moddleElement: entry,
      properties: {
        value: value,
      },
    });
  };

  const getValue = (field) => {
    return field.value;
  };

  return TextFieldEntry({
    element: entry,
    id: idPrefix + "-name",
    label: translate("Name"),
    getValue,
    setValue,
    debounce,
  });
}

function FrequencyProperty(props) {
  const { idPrefix, elem, entry } = props;

  const commandStack = useService("commandStack"),
    translate = useService("translate"),
    debounce = useService("debounceInput");

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: elem,
      moddleElement: entry,
      properties: {
        frequency: value,
      },
    });
  };

  const getValue = (field) => {
    return field.frequency;
  };

  return NumberFieldEntry({
    element: entry,
    id: idPrefix + "-name",
    label: translate("Frequency"),
    getValue,
    setValue,
    debounce,
    min: 0,
    max: 1,
    step: 0.1,
  });
}

function NumericField(props) {
  const { element, property, distribution } = props;

  const commandStack = useService("commandStack");
  const debounce = useService("debounceInput");
  const moddle = useService("moddle");

  const typeDescriptor = moddle.getTypeDescriptor(distribution.$type);

  typeDescriptor.properties.map((property) => {});

  const getValue = () => {
    return distribution.get(property).value;
  };

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: element,
      moddleElement: distribution.get(property),
      properties: {
        value: value || "",
      },
    });
  };

  const validate = (value) => {
    // number
    if (isNaN(value)) {
      return "number expected";
    }

    // uniform
    if (is(distribution, "bsim:uniformDistribution")) {
      const lower = distribution.get("bsim:lower").value;
      const upper = distribution.get("bsim:upper").value;

      if (["bsim:lower"].includes(property)) {
        if (value >= upper) return "expected to be < upper";
      }

      if (["bsim:upper"].includes(property)) {
        if (value <= lower) return "expected to be > lower";
      }
    }

    // triangular
    if (is(distribution, "bsim:triangularDistribution")) {
      const lower = distribution.get("bsim:lower").value;
      const peak = distribution.get("bsim:peak").value;
      const upper = distribution.get("bsim:upper").value;

      if (["bsim:lower"].includes(property)) {
        if (value > peak) return "expected to be <= peak";
        if (value >= upper) return "expected to be < upper";
      }

      if (["bsim:peak"].includes(property)) {
        if (value < lower) return "expected to be >= lower";
        if (value > upper) return "expected to be <= upper";
      }

      if (["bsim:upper"].includes(property)) {
        if (value < peak) return "expected to be >= peak";
        if (value <= lower) return "expected to be > lower";
      }
    }

    // number > 0
    if (
      ["bsim:amount", "bsim:standardDeviation", "bsim:mean"].includes(
        property
      ) &&
      value < 0
    ) {
      return "positive value expected";
    }

    // integer
    if (
      ["bsim:amount", "bsim:order"].includes(property) &&
      Number.parseInt(value) != value
    ) {
      return "integer expected";
    }

    // number >= 0 <= 1
    if (["bsim:probability"].includes(property) && (value < 0 || value > 1)) {
      return "value expected in 0...1";
    }

    // number > 1
    if (["bsim:order"].includes(property) && value < 1) {
      return "value > 1 expected";
    }

    // positive double
    // mean
    if (["bsim:mean"].includes(property) && value < 0) {
      return "positive double";
    }
    return;
  };

  return (
    <TextFieldEntry
      element={element}
      id={property}
      isEdited={isTextFieldEntryEdited}
      label={`${getName(null, property)}: ${getDescr(null, property)}`}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
      validate={validate}
    />
  );
}

// helper ///////////////////

let values = {};
function inflate(oldDistribution, newType, moddle, bpmnFactory) {
  const oldTypeDescriptor = moddle.getTypeDescriptor(oldDistribution.$type);

  oldTypeDescriptor.properties.forEach((property) => {
    values[property.type] = oldDistribution.get(property.type).value;
  });

  const typeDescriptor = moddle.getTypeDescriptor(newType);

  const newDistribution = moddle.create(typeDescriptor);

  if (!is(newDistribution, "bsim:KeyValueDistribution")) {
    typeDescriptor.properties.forEach((property) => {
      newDistribution.set(
        property.name,
        createElement(
          property.type,
          { value: getValueOrDefault(property.type) },
          newDistribution,
          bpmnFactory
        )
      );
    });
  }

  return newDistribution;
}

function getValueOrDefault(propertyType) {
  if (values[propertyType]) {
    return values[propertyType];
  }
  return 0;
}

function compareName(field, anotherField) {
  const [name = "", anotherName = ""] = [field.value, anotherField.value];
  return name === anotherName ? 0 : name > anotherName ? 1 : -1;
}
