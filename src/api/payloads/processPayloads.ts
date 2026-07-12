export interface WorkflowNode {
  id:       string;
  type:     string;
  label:    string;
  next?:    string;       // ID of next node
  formId?:  string;       
  [key: string]: unknown;
}

export interface WorkflowContent {
  processId: string;
  version:   number;
  nodes:     WorkflowNode[];
  [key: string]: unknown;
}

export interface DependencyEntry {
  fileId:      string;
  contentType: string;
  [key: string]: unknown;
}

export interface ProcessDependenciesPayload {
  fileId:       string;
  dependencies: DependencyEntry[];
}

function makeInitialStepNode(nextNodeId: string): WorkflowNode {
  return {
    id:    'node_initial',
    type:  'START',           
    label: 'InitialStep',
    next:  nextNodeId,
  };
}

function makeFormStepNode(formFileId: string, nextNodeId: string): WorkflowNode {
  return {
    id:     'node_form',
    type:   'FORM',           
    label:  'FormStep',
    formId: formFileId,       
    next:   nextNodeId,
  };
}

function makeExitNode(): WorkflowNode {
  return {
    id:    'node_exit',
    type:  'END',             
    label: 'exit',
  };
}

export function buildProcessContent(
  processId:  string,
  formFileId: string
): WorkflowContent {
  return {
    processId,
    version: 1,
    nodes: [
      makeInitialStepNode('node_form'),
      makeFormStepNode(formFileId, 'node_exit'),
      makeExitNode(),
    ],
  };
}

export function buildProcessDependencies(
  processId:  string,
  formFileId: string
): ProcessDependenciesPayload {
  return {
    fileId: processId,
    dependencies: [
      {
        fileId:      formFileId,
        contentType: 'application/vnd.aa.form',
      },
    ],
  };
}
