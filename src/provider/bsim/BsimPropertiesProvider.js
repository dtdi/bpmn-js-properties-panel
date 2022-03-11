import { Group, ListGroup } from "@bpmn-io/properties-panel";

import { findIndex } from "min-dash";

import { mutate as arrayMove } from "array-move";

import { DurationSelectionProps } from "./properties";

const LOW_PRIORITY = 500;

const BSIM_GROUPS = [StartInitiatorGroup, DurationGroup, SetupDurationGroup];

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

function ErrorsGroup(element, injector) {
  const group = {
    label: "Errors",
    id: "Bsim__Errors",
    component: ListGroup,
    ...ErrorsProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function UserAssignmentGroup(element) {
  const group = {
    label: "User assignment",
    id: "Bsim__UserAssignment",
    component: Group,
    entries: [...UserAssignmentProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function ScriptGroup(element) {
  const group = {
    label: "Script",
    id: "Bsim__Script",
    component: Group,
    entries: [...ScriptTaskProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function CallActivityGroup(element) {
  const group = {
    label: "Called element",
    id: "Bsim__CallActivity",
    component: Group,
    entries: [...CallActivityProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function ConditionGroup(element) {
  const group = {
    label: "Condition",
    id: "Bsim__Condition",
    component: Group,
    entries: [...ConditionProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function StartInitiatorGroup(element, injector) {
  const group = {
    label: "Arrival Rate",
    id: "Bsim__ArrivalRate",
    component: Group,
    entries: [
      ...DurationSelectionProps({
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

function ExternalTaskGroup(element) {
  const group = {
    label: "External task",
    id: "Bsim__ExternalTask",
    component: Group,
    entries: [...ExternalTaskPriorityProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function AsynchronousContinuationsGroup(element) {
  const group = {
    label: "Asynchronous continuations",
    id: "Bsim__AsynchronousContinuations",
    component: Group,
    entries: [...AsynchronousContinuationsProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function JobExecutionGroup(element) {
  const group = {
    label: "Job execution",
    id: "Bsim__JobExecution",
    component: Group,
    entries: [...JobExecutionProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function CandidateStarterGroup(element) {
  const group = {
    label: "Candidate starter",
    id: "Bsim__CandidateStarter",
    component: Group,
    entries: [...CandidateStarterProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function FieldInjectionGroup(element, injector) {
  const group = {
    label: "Field injections",
    id: "Bsim__FieldInjection",
    component: ListGroup,
    ...FieldInjectionProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function HistoryCleanupGroup(element) {
  const group = {
    label: "History cleanup",
    id: "Bsim__HistoryCleanup",
    component: Group,
    entries: [...HistoryCleanupProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function TasklistGroup(element) {
  const group = {
    label: "Tasklist",
    id: "Bsim__Tasklist",
    component: Group,
    entries: [...TasklistProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function InMappingGroup(element, injector) {
  const group = {
    label: "In mappings",
    id: "Bsim__InMapping",
    component: ListGroup,
    ...InMappingProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function InMappingPropagationGroup(element) {
  const group = {
    label: "In mapping propagation",
    id: "Bsim__InMappingPropagation",
    component: Group,
    entries: [...InMappingPropagationProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function OutMappingGroup(element, injector) {
  const group = {
    label: "Out mappings",
    id: "Bsim__OutMapping",
    component: ListGroup,
    ...OutMappingProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function OutMappingPropagationGroup(element) {
  const group = {
    label: "Out mapping propagation",
    id: "Bsim__OutMappingPropagation",
    component: Group,
    entries: [...OutMappingPropagationProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function ProcessVariablesGroup(element, injector) {
  const group = {
    label: "Process variables",
    id: "Bsim__ProcessVariables",
    component: ListGroup,
    ...ProcessVariablesProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function FormDataGroup(element, injector) {
  const group = {
    label: "Form fields",
    id: "Bsim__FormData",
    component: ListGroup,
    ...FormDataProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function BusinessKeyGroup(element) {
  const group = {
    label: "Business key",
    id: "Bsim__BusinessKey",
    component: Group,
    entries: [...BusinessKeyProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function FormGroup(element) {
  const group = {
    label: "Forms",
    id: "Bsim__Form",
    component: Group,
    entries: [...FormProps({ element })],
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}

function ExecutionListenerGroup(element, injector) {
  const group = {
    label: "Execution listeners",
    id: "Bsim__ExecutionListener",
    component: ListGroup,
    ...ExecutionListenerProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function TaskListenerGroup(element, injector) {
  const group = {
    label: "Task listeners",
    id: "Bsim__TaskListener",
    component: ListGroup,
    ...TaskListenerProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function InputGroup(element, injector) {
  const group = {
    label: "Inputs",
    id: "Bsim__Input",
    component: ListGroup,
    ...InputProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function OutputGroup(element, injector) {
  const group = {
    label: "Outputs",
    id: "Bsim__Output",
    component: ListGroup,
    ...OutputProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function ConnectorInputGroup(element, injector) {
  const group = {
    label: "Connector inputs",
    id: "Bsim__ConnectorInput",
    component: ListGroup,
    ...ConnectorInputProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function ConnectorOutputGroup(element, injector) {
  const group = {
    label: "Connector outputs",
    id: "Bsim__ConnectorOutput",
    component: ListGroup,
    ...ConnectorOutputProps({ element, injector }),
  };

  if (group.items) {
    return group;
  }

  return null;
}

function ExtensionPropertiesGroup(element, injector) {
  const group = {
    label: "Extension properties",
    id: "Bsim__ExtensionProperties",
    component: ListGroup,
    ...ExtensionPropertiesProps({ element, injector }),
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
