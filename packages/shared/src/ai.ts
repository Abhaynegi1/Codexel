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
