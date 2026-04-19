export type MethodCategory =
  | 'prioritization'
  | 'estimation'
  | 'discovery'
  | 'strategy'
  | 'decision'
  | 'design-testing';

export type DrillType =
  | 'rice'
  | 'mom-test'
  | 'moscow'
  | 'kano'
  | 't-shirt'
  | 'wsjf'
  | 'jtbd'
  | 'pre-mortem'
  | 'five-whys'
  | 'pr-faq';

export interface MethodExample {
  title: string;
  body: string;
}

export interface Method {
  id: string;
  name: string;
  category: MethodCategory;
  tldr: string;
  isCommon?: boolean;
  formula?: string;
  whenToUse: string;
  whenNotToUse?: string;
  benefits: string[];
  limitations: string[];
  pitfalls?: string[];
  example?: MethodExample;
  relatedScenarios?: string[];
  drill?: DrillType;
}

export const CATEGORY_META: Record<
  MethodCategory,
  { label: string; color: string; description: string }
> = {
  prioritization: {
    label: 'Prioritization',
    color: 'bg-blue-100 text-blue-900 border-blue-200',
    description: 'Ordering backlog items against capacity and competing value',
  },
  estimation: {
    label: 'Estimation',
    color: 'bg-purple-100 text-purple-900 border-purple-200',
    description: 'Sizing work relative to each other and to calendar time',
  },
  discovery: {
    label: 'Discovery',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    description: 'Learning about users, problems, and opportunities',
  },
  strategy: {
    label: 'Strategy',
    color: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Setting direction, outcomes, and alignment',
  },
  decision: {
    label: 'Decision-Making',
    color: 'bg-rose-100 text-rose-900 border-rose-200',
    description: 'Clarifying roles, reversibility, and commitment',
  },
  'design-testing': {
    label: 'Design & Testing',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    description: 'Validating demand and shape before committing engineering',
  },
};
