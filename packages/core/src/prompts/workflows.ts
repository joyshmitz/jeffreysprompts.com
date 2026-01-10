// packages/core/src/prompts/workflows.ts
// Curated workflows - sequences of prompts for specific tasks

export interface WorkflowStep {
  promptId: string;
  description: string;
  optional?: boolean;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  author: string;
  created: string;
}

export const workflows: Workflow[] = [
  {
    id: "new-feature",
    title: "New Feature Development",
    description: "End-to-end workflow for implementing a new feature",
    steps: [
      {
        promptId: "idea-wizard",
        description: "Generate and evaluate improvement ideas",
      },
      {
        promptId: "readme-reviser",
        description: "Update documentation for new feature",
      },
    ],
    author: "Jeffrey Emanuel",
    created: "2025-01-09",
  },
];

export function getWorkflow(id: string): Workflow | undefined {
  return workflows.find((w) => w.id === id);
}
