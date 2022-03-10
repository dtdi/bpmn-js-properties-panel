import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { find, map, forEach, isArray, reduce, flatten } from "min-dash";

export function isDisqualified(element, modeling, property) {
  const prop = modeling.getProp(element, property);
  return prop === false;
}

export function isQualified(element, modeling, property) {
  const prop = modeling.getProp(element, property);
  return prop === true;
}

export function hasAutomatedResource(element, modeling) {
  let bsim = getBusinessObject(element).bsim;
  let resource = bsim.get("bsim:resources");
  if (!resource) return false;
  let isAutomatted = false;
  resource.get("bsim:resource").forEach((res) => {
    let prop = modeling.getProp(res.id, "is-automatted");
    if (prop === true) {
      isAutomatted = true;
    }
  });
  return isAutomatted;
}

// Automation pattern
export function getAutomationCandidates(flowElements, modeling) {
  return flowElements.filter((element) => {
    return (
      is(element, "bpmn:Activity") &&
      !isDisqualified(element, modeling, "is-DU-25") &&
      !hasAutomatedResource(element, modeling)
    );
  });
}

// Automation pattern
export function getAutomationActivities(flowElements, modeling) {
  return flowElements
    .filter(
      (element) =>
        is(element, "bpmn:Activity") &&
        isQualified(element, modeling, "may-DU-25") &&
        !hasAutomatedResource(element, modeling)
    )
    .map((element) => {
      const prop = modeling.getProperty(element, "may-DU-25");
      return {
        element: element,
        value: true,
        elements: prop.related || [],
      };
    });
}

// Triage Pattern
export function getPotentialTriageActivities(flowElements, modeling) {
  return flowElements.filter((element) => {
    return (
      is(element, "bpmn:Activity") &&
      !isDisqualified(element, modeling, "is-DU-07")
    );
  });
}

export function getChangeResources(resources, modeling) {
  return resources.filter(
    (element) =>
      is(element, "bsim:dynamicResource") &&
      !isDisqualified(element, modeling, "is-DU-10")
  );
}

export function getTriageActivities(flowElements, modeling) {
  return flowElements
    .filter(
      (element) =>
        is(element, "bpmn:Activity") &&
        isQualified(element, modeling, "is-DU-07")
    )
    .map((element) => {
      const prop = modeling.getProperty(element, "is-DU-07");
      return {
        element: element,
        value: true,
        elements: prop.related || [],
      };
    });
}

function _getName(thing) {
  return getBusinessObject(thing).name || thing.id.id || thing.id;
}
export function getNiceNamesFromContext(context) {
  if (context.shapes) {
    return context.shapes
      ?.map((shape) => {
        return _getName(shape);
      })
      .join(", ");
  } else if (context.elements) {
    return context.elements
      ?.map((shape) => {
        return _getName(shape);
      })
      .join(", ");
  } else if (context.element) {
    return _getName(context.element);
  } else if (context.shape) {
    return _getName(context.shape);
  } else if (context.connection) {
    return _getName(context.connection);
  }
}

export function getStartEvents(flowElements) {
  return flowElements.filter((e) => is(e, "bpmn:StartEvent"));
}
export function getCatchEvents(flowElements) {
  return flowElements.filter((e) => is(e, "bpmn:IntermediateCatchEvent"));
}

function noLabelsButBO(list) {
  return list
    .filter((e) => e.type !== "label")
    .map((e) => getBusinessObject(e));
}

function isJoin(elem) {
  elem = getBusinessObject(elem);
  const { incoming } = elem;
  return incoming && incoming.length > 1;
}

function isBranch(elem) {
  elem = getBusinessObject(elem);
  const { outgoing } = elem;
  return outgoing && outgoing.length > 1;
}

export function getStraightSequences(process) {
  let sinks = getStartEvents(process.flowElements);
  sinks.push(
    ...process.flowElements.filter((elem) => isBranch(elem) || isJoin(elem)),
    ...getCatchEvents(process.flowElements)
  );
  sinks = noLabelsButBO(sinks);

  const simples = flatten(
    map(sinks, (sink) => map(sink.outgoing, simpleSequence))
  ).filter((s) => s.length > 1);
  return simples;
}

function simpleSequence(sink) {
  const elements = [];
  let elem = getNext(sink);
  while (elem && !isBranch(elem) && !isJoin(elem)) {
    elements.push(elem);
    elem = getNext(elem);
  }
  return elements;
}

export function getNext(elem, all) {
  all = all ? true : false;
  elem = getBusinessObject(elem);
  const { outgoing, targetRef } = elem;
  let next;
  if (targetRef) {
    next = targetRef;
  }

  if (outgoing && outgoing.length == 1) {
    next = outgoing[0].targetRef;
  }

  if (all || is(next, "bpmn:Task")) {
    return next;
  }

  return;
}

export function getPrev(elem, all) {
  all = all ? true : false;
  elem = getBusinessObject(elem);
  const { incoming, sourceRef } = elem;
  let prev;
  if (sourceRef) {
    prev = sourceRef;
  }

  if (incoming && incoming.length == 1) {
    prev = incoming[0].sourceRef;
  }

  if (all || is(prev, "bpmn:Task")) {
    return prev;
  }

  return;
}

export function evaluateParallel(sequence) {
  if (!isArray(sequence) || sequence.length === 0) return;

  const times = map(sequence, getBsimTime);

  // does this heuristic make sense?
}

export function isSisoNet(element, type) {
  var bo = getBusinessObject(element);

  return bo && typeof bo.$instanceOf === "function" && bo.$instanceOf(type);
}

/**
 * Flattens an array of nodes in the graph and resolves gateways.
 * Returns only those tasks, that allow for parallel transformation
 * in such a way as that there are at least two components in the sequence.
 * @param {array} list
 */
export function flattenEvenMore(list) {
  const flatten = function (items) {
    const flat = [];

    items.forEach((item) => {
      if (item.hasOwnProperty("elements")) {
        item = item.elements;
      }
      if (Array.isArray(item)) {
        if (item.length >= 2) flat.push(...flatten(item));
      } else {
        flat.push(item);
      }
    });

    return flat;
  };

  list = flatten(list);

  return list;
}

export function getIds(list) {
  return list.map((e) => e.id).filter((e) => e);
}

export function taskIdsInComponent(element) {
  return getIds(tasksInComponent(element));
}

/**
 * Return Siso Nets starting at this element.
 *
 * @param  {djs.model.Base|ModdleElement} element
 *
 */
export function tasksInComponent(element) {
  var tasks = sequencesInComponent(element);

  console.log(sequencesInComponent(element));

  const flatten = function (items) {
    const flat = [];

    items.forEach((item) => {
      if (Array.isArray(item)) {
        flat.push(...flatten(item));
      } else {
        flat.push(item);
      }
    });

    return flat;
  };

  tasks = flatten(tasks);

  return tasks;
}

export function sequencesInComponent(element, branches) {
  branches = branches || [];
  if (_isLoop(branches, element.id)) {
    console.log("findTasks_isLoop", element);
    return;
  }

  const tasks = [];

  let next = element;

  while (next) {
    next = nextActivity(next, branches);

    if (is(next, "bpmn:Gateway")) {
      tasks.push(next);
      break;
    }

    if (isArray(next)) {
      tasks.push(next[0]);
      next = next[1];
      continue;
    }

    if (next) {
      tasks.push(next);
    }
  }

  return tasks;
}

function nextActivity(element, branches) {
  if (_isLoop(branches, element.id)) {
    console.log("nextActivity_isLoop", element);
    return;
  }

  if (is(element, "bpmn:SequenceFlow")) {
    const target = element.targetRef;
    element = target;

    if (is(element, "bpmn:Activity")) {
      return element;
    }
  }

  if (!element.outgoing || element.outgoing.length == 0) {
    return undefined;
  }

  // easy case. straight sequence.
  if (element.incoming && element.incoming.length >= 2) {
    return element;
  }

  // > 1 outgoing flows.
  if (element.outgoing && element.outgoing.length >= 2) {
    branches.push(element.id);
    let components = [];
    let join;
    // otherwise, we treat gateways as one block.
    element.outgoing.forEach((outgoing) => {
      let sequence = sequencesInComponent(outgoing, branches);
      if (is(sequence[sequence.length - 1], element.$type)) {
        const lastId = sequence[sequence.length - 1].id;
        if (!join) join = sequence.pop();
        else if (join.id == lastId) sequence.pop();
      }
      components.push(sequence);
    });

    if (!is(element, "bpmn:ParallelGateway")) {
      components = {
        incoming: [element.incoming],
        outgoing: [join.outgoing],
        elements: components,
      };
    }
    return [components, join.outgoing[0]];
  }

  // easy case. straight sequence.
  if (element.outgoing && element.outgoing.length == 1) {
    return nextActivity(element.outgoing[0], branches);
  }
}

function _isLoop(branches, id) {
  if (find(branches, id)) {
    return true;
  } else {
    return false;
  }
}

export function getBsimTime(bsim) {
  bsim = getBsimObject(bsim);
  const { duration } = bsim;
  if (!is(bsim, "bsim:task") || !duration) return;
  const { distribution: dis, timeUnit } = duration;
  let val = 0;
  if (dis.hasOwnProperty("mean")) {
    val = dis.mean.value;
  } else if (dis.$type === "bsim:constantDistribution") {
    val = dis.constantValue.value;
  } else if (dis.$type === "bsim:binomialDistribution") {
    val = Number(dis.probability.value) * Number(dis.amount.value);
  } else if (dis.$type === "bsim:triangularDistribution") {
    val =
      (Number(dis.lower.value) +
        Number(dis.peak.value) +
        Number(dis.upper.value)) /
      3;
  } else if (dis.$type === "bsim:uniformDistribution") {
    val = (Number(dis.lower.value) + Number(dis.upper.value)) / 2;
  }

  //const d = Duration.fromObject({ [timeUnit.toLowerCase()]: val }).as(
  //    "minutes"
  //);
  const d = val;

  return d;
}

/**
 * Return the bsim object for a given element.
 *
 * @param  {djs.model.Base|ModdleElement} element
 *
 * @return {ModdleElement}
 */
export function getBsimObject(element) {
  element = getBusinessObject(element);
  return (element && element.bsim) || element;
}

export function ensureModdleProperty(elem, type, moddle) {
  if (type === "bsim:duration") {
    return (
      (elem.duration && is(elem.duration, type)) ||
      elem.set(
        "duration",
        moddle.create(type, {
          timeUnit: "MINUTES",
          distribution: moddle.create("bsim:normalDistribution", {
            mean: moddle.create("bsim:mean", { value: 20 }),
            standardDeviation: moddle.create("bsim:standardDeviation", {
              value: 5,
            }),
          }),
        })
      )
    );
  } else if (type === "bsim:arrivalRate") {
    return (
      (elem.arrivalRate && is(elem.arrivalRate, type)) ||
      elem.set(
        "arrivalRate",
        moddle.create(type, {
          timeUnit: "MINUTES",
          distribution: moddle.create("bsim:normalDistribution", {
            mean: moddle.create("bsim:mean", { value: 20 }),
            standardDeviation: moddle.create("bsim:standardDeviation", {
              value: 5,
            }),
          }),
        })
      )
    );
  } else if (type === "bsim:setUpDuration") {
    return (
      (elem.setUpDuration && is(elem.setUpDuration, type)) ||
      elem.set("setUpDuration", moddle.create(type))
    );
  } else if (type === "bsim:tasks") {
    return (elem.tasks && isArray(elem.tasks)) || elem.set("tasks", []);
  } else if (type === "bsim:gateways") {
    if (!elem.gateways || !isArray(elem.gateways)) {
      elem.set("bsim:gateways", []);
      return;
    } else {
      return;
    }
  } else if (type === "bsim:timetables") {
    if (!elem.timetables || !isArray(elem.timetables)) {
      elem.set("bsim:timetables", []);
      return;
    } else {
      return;
    }
  } else if (type === "bsim:resourceData") {
    if (!elem.resourceData || !isArray(elem.resourceData)) {
      elem.set("bsim:resourceData", []);
      return;
    } else {
      return;
    }
  } else if (type === "bsim:eventProbability") {
    if (!elem.get("bsim:eventProbability")) {
      elem.set("bsim:eventProbability", "1");
    }
  }
}
