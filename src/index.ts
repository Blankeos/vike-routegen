import fs from "fs/promises";
import path from "path";
import type { Plugin } from "vite";
import { createRoutegenFileContent } from "./utils";

import { getVikeConfig } from "vike/plugin";
import { getGlobalContextAsync } from "vike/server";

type VikeRouteGenOptions = {
  /** Used for generating the `useParams` hook.
   * - Defaults to 'vike-react/usePageContext' or 'vike-solid/usePageContext' or 'vike-vue/usePageContext' (Based on package.json)
   * - When false, does not create useParams.
   */
  usePageContextImportSource?: string | false;
  /**
   * Defaults to 'route-tree.gen.ts', if 'src' exists, then 'src/route-tree.gen.ts'
   * This is relative to project root (vite.config.ts or vite.config.js)
   */
  outputPath?: string;
};

export default async function vikeRoutegen(
  options?: VikeRouteGenOptions,
): Promise<Plugin> {
  // Declare variables that will be set in configResolved and used in other hooks
  let projectRoot: string;
  let outputFilePath: string;
  let usePageContextImportSource: string = "";
  let uniqueRoutes: string[] = [];

  // Function to extract unique routes from pages object
  function extractUniqueRoutes(pages: Record<string, any>): string[] {
    if (!pages) return [];

    const routes: string[] = [];
    Object.values(pages).forEach((pageValue: any) => {
      const route: string | undefined = pageValue.route as string;
      if (!route) return;

      if (route.endsWith("/*")) {
        routes.push(route.replace("*", "@"));
        return;
      }

      routes.push(route);
    });

    return [...new Set(routes)].sort();
  }

  async function generatePagesList() {
    try {
      const content = createRoutegenFileContent({
        uniqueRoutes,
        usePageContextImportSource,
      });

      await fs.writeFile(outputFilePath, content);
      console.log(
        `\n[vike][routegen] 🌳 Route Tree generated in (${outputFilePath.replace(projectRoot + "/", "./")}).\n`,
      );
    } catch (error) {
      console.error("Error generating route tree:", error);
    }
  }

  // Function to update routes from global context and regenerate if changed
  async function updateRoutesFromGlobalContext() {
    try {
      const globalContext = await getGlobalContextAsync(false);
      const refreshedRoutes = extractUniqueRoutes(globalContext.pages || {});

      // Only update and regenerate if routes have changed
      if (JSON.stringify(refreshedRoutes) !== JSON.stringify(uniqueRoutes)) {
        uniqueRoutes = refreshedRoutes;
        await generatePagesList();
      }
    } catch (error) {
      console.error("Error updating routes from global context:", error);
    }
  }

  return {
    name: "vike-routegen",
    async configResolved(config) {
      // Store the project root for use in other hooks
      projectRoot = config.root;

      // Determine the output file path
      const hasSrcDir = await fs
        .access(path.join(projectRoot, "src"))
        .then(() => true)
        .catch(() => false);

      const defaultOutputFilePath = hasSrcDir
        ? path.join(projectRoot, "src", "route-tree.gen.ts")
        : path.join(projectRoot, "route-tree.gen.ts");

      outputFilePath = options?.outputPath
        ? path.resolve(projectRoot, options.outputPath)
        : defaultOutputFilePath;

      // 🧹 The framework detection could be improved or moved to a separate function
      // Check config plugins to detect framework
      if (
        options?.usePageContextImportSource !== undefined ||
        options?.usePageContextImportSource !== false
      ) {
        if (config.plugins && Array.isArray(config.plugins)) {
          const pluginNames = config.plugins.map((plugin) =>
            typeof plugin === "object" && plugin !== null
              ? plugin.name || ""
              : "",
          );

          const hasReactPlugin = pluginNames.some((name) =>
            name.toLowerCase().includes("react"),
          );
          const hasSolidPlugin = pluginNames.some((name) =>
            name.toLowerCase().includes("solid"),
          );
          const hasVuePlugin = pluginNames.some((name) =>
            name.toLowerCase().includes("vue"),
          );

          if (hasReactPlugin) {
            usePageContextImportSource = "vike-react/usePageContext";
          } else if (hasSolidPlugin) {
            usePageContextImportSource = "vike-solid/usePageContext";
          } else if (hasVuePlugin) {
            usePageContextImportSource = "vike-vue/usePageContext";
          } else {
            usePageContextImportSource = "";
          }
        } else {
          // Fallback if no plugins array is found
          usePageContextImportSource = "";
        }
      }

      // Initial route generation using global context
      try {
        const vikeConfig = getVikeConfig(config);
        uniqueRoutes = extractUniqueRoutes(vikeConfig.pages || {});
      } catch (error) {
        console.warn("[vike][routegen] Could not get initial routes:", error);
        uniqueRoutes = [];
      }
    },

    async buildStart() {
      // Generate routes at build time
      await generatePagesList();
    },

    async handleHotUpdate({ file }) {
      // Don't regenerate if we're editing the generated file itself
      if (path.resolve(file) === outputFilePath) {
        return;
      }

      // Update routes from global context when files change
      await updateRoutesFromGlobalContext();
    },
  };
}
