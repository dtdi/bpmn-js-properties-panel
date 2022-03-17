import { Group, ListGroup } from "@bpmn-io/properties-panel";

import { findIndex } from "min-dash";

import { mutate as arrayMove } from "array-move";

import {
  DurationSelectionProps,
  BsimConfigurationProps,
  BsimDefinitionProps,
  TimeTableProps,
  ResourceDataProps,
  GatewaySplitProps,
  SequenceSplitProps,
  EventArrivalProps,
  ArrivalRateProps,
  TaskResourceProps,
  DataObjectFieldProps,
} from "./properties";

const LOW_PRIORITY = 500;

const BSIM_GROUPS = [
  ArrivalRateGroup,
  DurationGroup,
  SetupDurationGroup,
  SimulationPropertiesGroup,
  DefinitionPropertiesGroup,
  TimeTablePropertiesGroup,
  ResourcePropertiesGroup,
  GatewayPropertiesGroup,
  EventArrivalGroup,
  TaskResourcePropertiesGroup,
  DataObjectFieldGroup,
];

/**
 * Provides `camunda` namespace properties.
 *
 * @example
 * ```javascript
 * import BpmnModeler from 'bpmn-js/lib/Modeler';
 * import {
 *   BpmnPropertiesPanelModule,
 *   BpmnPropertiesProviderModule,
 *   BsimPropertiesProviderModule
 * } from 'bpmn-js-properties-panel';
 *
 * const modeler = new BpmnModeler({
 *   container: '#canvas',
 *   propertiesPanel: {
 *     parent: '#properties'
 *   },
 *   additionalModules: [
 *     BpmnPropertiesPanelModule,
 *     BpmnPropertiesProviderModule,
 *     BsimPropertiesProviderModule
 *   ]
 * });
 * ```
 */
export default class BsimPropertiesProvider {
  constructor(propertiesPanel, injector) {
    propertiesPanel.registerProvider(LOW_PRIORITY, this);

    this._injector = injector;
  }

  getGroups(element) {
    return (groups) => {
      // (1) add BSIM specific groups
      groups = groups.concat(this._getGroups(element));

      // (2) update existing groups with Camunda Platform specific properties
      updateGeneralGroup(groups, element);
      updateErrorGroup(groups, element);
      updateEscalationGroup(groups, element);
      updateMultiInstanceGroup(groups, element);

      // (3) move groups given specific priorities
      moveImplementationGroup(groups);

      return groups;
    };
  }

  _getGroups(element) {
    const groups = BSIM_GROUPS.map((createGroup) =>
      createGroup(element, this._injector)
    );

    // contract: if a group returns null, it should not be displayed at all
    return groups.filter((group) => group !== null);
  }
}

BsimPropertiesProvider.$inject = ["propertiesPanel", "injector"];

/**
 * This ensures the <Implementation> group always locates after <Documentation>
 */
function moveImplementationGroup(groups) {
  const documentationGroupIdx = findGroupIndex(groups, "documentation");

  if (documentationGroupIdx < 0) {
    return;
  }

  return moveGroup(groups, "Bsim__Implementation", documentationGroupIdx + 1);
}

function updateGeneralGroup(groups, element) {
  const generalGroup = findGroup(groups, "general");

  if (!generalGroup) {
    return;
  }
}

function updateErrorGroup(groups, element) {
  const errorGroup = findGroup(groups, "error");

  if (!errorGroup) {
    return;
  }

  const { entries } = errorGroup;

  ErrorProps({ element, entries });
}

function updateMultiInstanceGroup(groups, element) {
  const multiInstanceGroup = findGroup(groups, "multiInstance");

  if (!multiInstanceGroup) {
    return;
  }

  const { entries } = multiInstanceGroup;

  MultiInstanceProps({ element, entries });
}

function updateEscalationGroup(groups, element) {
  const escalationGroup = findGroup(groups, "escalation");

  if (!escalationGroup) {
    return;
  }

  const { entries } = escalationGroup;

  EscalationProps({ element, entries });
}

function DurationGroup(element) {
  const group = {
    label: "Duration",
    id: "Bsim__Duration",
    component: Group,
    entries: [...DurationSelectionProps({ element, type: "bsim:duration" })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function EventArrivalGroup(element) {
  const group = {
    label: "Simulation Event Arrival",
    id: "Bsim__EventArrival",
    component: Group,
    entries: [...EventArrivalProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function DataObjectFieldGroup(element, injector) {
  const group = {
    label: "Simulation Data Fields",
    id: "Bsim__DataFields",
    component: ListGroup,
    ...DataObjectFieldProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function SetupDurationGroup(element) {
  const group = {
    label: "Setup Duration",
    id: "Bsim__SetupDuration",
    component: Group,
    entries: [
      ...DurationSelectionProps({ element, type: "bsim:setUpDuration" }),
    ],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function DefinitionPropertiesGroup(element) {
  const group = {
    label: "Simulation Definition",
    id: "Bsim__Definition",
    component: Group,
    entries: [...BsimDefinitionProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function SimulationPropertiesGroup(element) {
  const group = {
    label: "Simulation Configuration",
    id: "Bsim__Configuration",
    component: Group,
    entries: [...BsimConfigurationProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function TimeTablePropertiesGroup(element, injector) {
  const group = {
    label: "Simulation Timetables",
    id: "Bsim__TimeTables",
    component: ListGroup,
    ...TimeTableProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function ResourcePropertiesGroup(element, injector) {
  const group = {
    label: "Simulation Resources",
    id: "Bsim__Resources",
    component: ListGroup,
    ...ResourceDataProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function ArrivalRateGroup(element, injector) {
  const group = {
    label: "Arrival Rate",
    id: "Bsim__ArrivalRate",
    component: Group,
    entries: [
      ...ArrivalRateProps({
        element,
        type: "bsim:arrivalRate",
        injector,
      }),
    ],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function GatewayPropertiesGroup(element) {
  const group = {
    label: "Simulation Splits",
    id: "Bsim__Split",
    component: Group,
    entries: [
      ...GatewaySplitProps({ element }),
      ...SequenceSplitProps({ element }),
    ],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function TaskResourcePropertiesGroup(element, injector) {
  const group = {
    label: "Simulation Resources",
    id: "Bsim__Resources",
    component: ListGroup,
    ...TaskResourceProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

// helper /////////////////////

function findGroup(groups, id) {
  return groups.find((g) => g.id === id);
}

function findGroupIndex(groups, id) {
  return findIndex(groups, (g) => g.id === id);
}

function moveGroup(groups, id, position) {
  const groupIndex = findGroupIndex(groups, id);

  if (position < 0 || groupIndex < 0) {
    return;
  }

  return arrayMove(groups, groupIndex, position);
}
