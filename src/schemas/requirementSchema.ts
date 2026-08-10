import { z } from "zod";

export const requirementSchema = z.object({
  projectName: z.string(),

  projectObjective: z.string(),

  actors: z.array(z.string()),

  modules: z.array(z.string()),

  functionalRequirements: z.array(
    z.object({
      id: z.string(),
      module: z.string(),
      actor: z.string(),
      requirement: z.string(),
      acceptanceCriteria: z.string(),
    })
  ),

  nonFunctionalRequirements: z.array(z.string()),

  businessRules: z.array(z.string()),

  validations: z.array(z.string()),

  assumptions: z.array(z.string()),

  dependencies: z.array(z.string()),

  clarificationQuestions: z.array(z.string()),
});

export type RequirementOutput = z.infer<typeof requirementSchema>;