export interface PresetPrompt {
  id: "architecture" | "auth-data" | "design-system" | "onboarding";
  label: string;
  icon: string;
  description: string;
  query: string;
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: "architecture",
    label: "Explain Architecture",
    icon: "Layers",
    description:
      "Layer boundaries, responsibilities, and structural organization",
    query:
      "Explain this repository architecture, detailing each layer's role, directory organization, and cross-layer boundaries.",
  },
  {
    id: "auth-data",
    label: "Where is Auth & Data?",
    icon: "KeyRound",
    description: "Authentication flow, API route endpoints, and state handling",
    query:
      "Where is authentication, data fetching, or server-side API handling located in this codebase? Cite the exact files and lines.",
  },
  {
    id: "design-system",
    label: "Summarize Design Tokens",
    icon: "Palette",
    description: "UI libraries, color tokens, typography, and styling patterns",
    query:
      "Summarize the design system and UI library choices, including component primitives, color palette, and styling conventions.",
  },
  {
    id: "onboarding",
    label: "Generate Onboarding Guide",
    icon: "BookOpen",
    description: "Step-by-step developer walkthrough for new engineers",
    query:
      "Generate a comprehensive onboarding guide for a new engineer joining this project, highlighting key entry points, core components, and conventions.",
  },
];

export const GROUNDED_SYSTEM_PROMPT = `You are Codexel AI, an expert software architecture copilot.
Your answers MUST be strictly grounded in the verified repository facts provided below.

CRITICAL INSTRUCTIONS:
1. ZERO HALLUCINATIONS: Do not assume or invent packages, files, or functions that are not explicitly present in the model facts.
2. SOURCE ATTRIBUTIONS: Every time you mention a file, component, or route, you MUST cite it using the exact format: [filePath:startLine-endLine] or [filePath].
3. FORMATTING: Use clean GitHub Flavored Markdown with bullet points, code blocks where appropriate, and bold highlights for key terminology.
4. TONE: Concise, technical, architect-level clarity. Directly answer the question without fluff.

If a fact is not available in the model facts, explicitly state that it was not detected during static analysis.`;

export function constructGroundedUserPrompt(
  query: string,
  factsMarkdown: string,
): string {
  return `### VERIFIED REPOSITORY FACTS:
${factsMarkdown}

---

### USER QUESTION:
${query}

Please answer the user's question using ONLY the verified facts above. Include exact citation links in format [filePath:startLine-endLine] or [filePath].`;
}
