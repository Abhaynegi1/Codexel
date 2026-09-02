import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface DetectedLibraries {
  uiPrimitiveLibrary?: string;
  iconLibrary?: string;
  animationLibrary?: string;
}

const UI_PRIMITIVE_RULES: Array<{ pattern: RegExp | string; name: string }> = [
  { pattern: /@radix-ui\//, name: "Radix UI Primitives" },
  { pattern: /@headlessui\//, name: "Headless UI" },
  { pattern: /@chakra-ui\//, name: "Chakra UI" },
  { pattern: /@mui\//, name: "Material UI (MUI)" },
  { pattern: "antd", name: "Ant Design" },
  { pattern: /@mantine\//, name: "Mantine" },
  { pattern: /@nextui-org\//, name: "NextUI / HeroUI" },
  { pattern: "semantic-ui-react", name: "Semantic UI React" },
];

const ICON_RULES: Array<{ pattern: RegExp | string; name: string }> = [
  { pattern: "lucide-react", name: "Lucide React" },
  { pattern: /@heroicons\//, name: "Heroicons" },
  { pattern: "react-icons", name: "React Icons" },
  { pattern: /@tabler\/icons/, name: "Tabler Icons" },
  { pattern: "phosphor-react", name: "Phosphor Icons" },
  { pattern: /@radix-ui\/react-icons/, name: "Radix Icons" },
  { pattern: "feather-icons-react", name: "Feather Icons" },
];

const ANIMATION_RULES: Array<{ pattern: RegExp | string; name: string }> = [
  { pattern: "framer-motion", name: "Framer Motion" },
  { pattern: "motion", name: "Motion (Framer)" },
  { pattern: "gsap", name: "GSAP (GreenSock)" },
  { pattern: "animejs", name: "Anime.js" },
  { pattern: "tailwindcss-animate", name: "tailwindcss-animate" },
  { pattern: "react-spring", name: "React Spring" },
  { pattern: "@react-spring/", name: "React Spring" },
];

function matchesRule(pkgName: string, pattern: RegExp | string): boolean {
  if (typeof pattern === "string") {
    return pkgName === pattern || pkgName.startsWith(pattern);
  }
  return pattern.test(pkgName);
}

/**
 * Detects UI primitive libraries, icon packs, and animation libraries from package.json manifests.
 */
export async function detectDesignLibraries(
  workspacePath: string,
): Promise<DetectedLibraries> {
  const result: DetectedLibraries = {};

  try {
    const pkgPath = path.join(workspacePath, "package.json");
    const raw = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    const depNames = Object.keys(allDeps);

    // 1. UI Primitive
    for (const rule of UI_PRIMITIVE_RULES) {
      if (depNames.some((d) => matchesRule(d, rule.pattern))) {
        result.uiPrimitiveLibrary = rule.name;
        break;
      }
    }

    // 2. Icon Library
    for (const rule of ICON_RULES) {
      if (depNames.some((d) => matchesRule(d, rule.pattern))) {
        result.iconLibrary = rule.name;
        break;
      }
    }

    // 3. Animation Library
    for (const rule of ANIMATION_RULES) {
      if (depNames.some((d) => matchesRule(d, rule.pattern))) {
        result.animationLibrary = rule.name;
        break;
      }
    }
  } catch {
    // If package.json doesn't exist or is invalid, return empty
  }

  return result;
}
