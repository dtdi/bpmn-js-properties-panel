import { is } from "bpmn-js/lib/util/ModelUtil";

import { useService } from "../../../hooks";
import { getBsimObject } from "../utils/BsimUtil";

export function ArrivalRateProps(props) {
  const { element } = props;

  if (!isArrivalRate(element)) {
    return [];
  }
  const entries = [];

  entries.push({
    id: "timeUnit",
    component: TimeUnit,
    isEdited: isSelectEntryEdited,
  });

  entries.push(...DistributionProps({ element }));

  return entries;
}

function TimeUnit(props) {
  const { element } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const bsimObject = getBsimObject(element);
  const arrivaRate = bsimObject.get("bsim:arrivalRate");

  const getValue = () => {
    return arrivaRate.get("bsim:timeUnit");
  };

  const setValue = (value) => {
    // (1) Remove formalExpression if <none> is selected
    if (value === "") {
      updateCondition(element, commandStack, undefined);
    } else {
      // (2) Create and set formalExpression element containing the conditionExpression
      const attributes = {
        body: "",
        language: value === "script" ? "" : undefined,
      };
      const formalExpressionElement = createFormalExpression(
        element,
        attributes,
        bpmnFactory
      );

      updateCondition(element, commandStack, formalExpressionElement);
    }
  };

  const getOptions = () => [
    { value: "", label: translate("<none>") },
    { value: "HOURS", label: translate("HOURS") },
    { value: "MINUTES", label: translate("MINUTES") },
    { value: "DAYS", label: translate("DAYS") },
    { value: "SECONDS", label: translate("SECONDS") },
    { value: "MICROSECONDS", label: translate("MICROSECONDS") },
    { value: "MILLISECONDS", label: translate("MILLISECONDS") },
    { value: "NANOSECONDS", label: translate("NANOSECONDS") },
  ];

  return SelectEntry({
    element,
    id: "timeUnit",
    label: translate("Time Unit"),
    getValue,
    setValue,
    getOptions,
  });
}

function DistributionProps(props) {
  const { element } = props;

  const entries = [];
  const bsimObject = getBsimObject(element);
  const arrivaRate = bsimObject.get("bsim:arrivalRate");
  const distribution = arrivaRate.get("bsim:distribution");
  const distributionType = getDistributionType(distribution);

  entries.push({
    id: "distributionType",
    component: DistributionType,
    isEdited: isSelectEntryEdited,
  });

  if (distributionType == "bsim:normalDistribution") {
    entries.push(
      {
        id: "meanValue",
        component: Mean,
        isEdited: isTextFieldEntryEdited,
      },
      {
        id: "standardDeviation",
        component: StandardDeviation,
        isEdited: isTextFieldEntryEdited,
      }
    );
  }
  return entries;
}

function DistributionType(props) {
  const { element } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const moddle = useService("moddle");

  const getOptions = () => {
    return moddle
      .getPackage("bsim")
      .types.filter((e) => e.superClass?.includes("Distribution"))
      .map((e) => {
        return {
          value: e.name,
          label: e.meta?.displayName || translate(e.name),
        };
      });
  };

  const bsimObject = getBsimObject(element);
  const arrivaRate = bsimObject.get("bsim:arrivalRate");

  const getValue = () => {
    return arrivaRate.get("bsim:timeUnit");
  };

  const setValue = (value) => {
    // (1) Remove formalExpression if <none> is selected
    if (value === "") {
      updateCondition(element, commandStack, undefined);
    } else {
      // (2) Create and set formalExpression element containing the conditionExpression
      const attributes = {
        body: "",
        language: value === "script" ? "" : undefined,
      };
      const formalExpressionElement = createFormalExpression(
        element,
        attributes,
        bpmnFactory
      );

      updateCondition(element, commandStack, formalExpressionElement);
    }
  };

  return SelectEntry({
    element,
    id: "distributionType",
    label: translate("Distribution Type"),
    description: getDescr(null, "bsim:Distribution"),
    getValue,
    setValue,
    getOptions,
  });
}

function Mean(props) {
  const { element } = props;

  const commandStack = useService("commandStack");
  const translate = useService("translate");
  const debounce = useService("debounceInput");

  const bsimObject = getBsimObject(element);
  const arrivaRate = bsimObject.get("bsim:arrivalRate");
  const distribution = arrivaRate.get("bsim:distribution");

  const getValue = () => {
    return distribution.get("bsim:mean").value;
  };

  const setValue = (value) => {
    commandStack.execute("element.updateModdleProperties", {
      element: element,
      moddleElement: getConditionExpression(element),
      properties: {
        "camunda:resource": value || "",
      },
    });
  };

  return TextFieldEntry({
    element,
    id: "mean",
    label: translate("Mean"),
    getValue,
    setValue,
    debounce,
  });
}

// helper ///////////////////

function isArrivalRate(element) {
  return (
    is(element, "bsim:Initiator") && !is(element.parent, "bpmn:SubProcess")
  );
}

function getDistributionType(distribution) {
  return distribution.$type;
}

function getProperty(property, type) {
  const moddle = useService("moddle", injector);

  if (!type) {
    type = this.elemStr;
  }

  if (!property) {
    return moddle.getTypeDescriptor(type);
  }
  const Type = moddle.getType(type);
  return moddle.getPropertyDescriptor(Type, property);
}

function getDescr(property, type) {
  return getMetaProp(property, type, "description");
}

function getMetaProp(property, type, value) {
  const meta = getProperty(property, type)?.meta || {};
  return meta[value] || null;
}

function getName(property, type) {
  return (
    getProperty(property, type)?.meta?.displayName ||
    property // insert a space before all caps
      .replace(/([A-Z])/g, " $1")
      // uppercase the first character
      .replace(/^./, function (str) {
        return str.toUpperCase();
      })
  );
}
