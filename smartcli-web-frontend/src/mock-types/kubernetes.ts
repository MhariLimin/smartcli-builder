export interface K8sContext {
  name: string;
  cluster: string;
  namespace: string;
}

export type K8sHelperType =
  | 'rollout-restart'
  | 'scale'
  | 'logs'
  | 'exec'
  | 'port-forward'
  | 'get'
  | 'describe'
  | 'delete';

export interface K8sHelperParam {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  default?: string;
  options?: string[];
  required: boolean;
}

export interface K8sHelper {
  id: string;
  type: K8sHelperType;
  label: string;
  description: string;
  commandTemplate: string;
  params: K8sHelperParam[];
  isDestructive: boolean;
  docsUrl?: string;
}

export interface K8sWorkflowStep {
  id: string;
  label: string;
  commandTemplate: string;
  params: K8sHelperParam[];
  isDestructive: boolean;
  isDone: boolean;
}
