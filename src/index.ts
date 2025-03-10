import fs from "fs/promises";
import path from "path";
import { Plugin } from "vite";
import { createRoutegenFileContent } from "./utils";

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
  let pagesDir: string;
  let outputFilePath: string;
  let usePageContextImportSource: string = "";

  // Helper functions
  async function checkIsCatchallRoute(dirPath: string): Promise<boolean> {
    try {
      // Check for +route.ts
      let routeFilePath = path.join(dirPath, "+route.ts");
      let fileExists = await fs
        .access(routeFilePath)
        .then(() => true)
        .catch(() => false);

      // If +route.ts doesn't exist, check for route.js
      if (!fileExists) {
        routeFilePath = path.join(dirPath, "route.js");
        fileExists = await fs
          .access(routeFilePath)
          .then(() => true)
          .catch(() => false);
      }

      if (!fileExists) return false;

      const content = await fs.readFile(routeFilePath, "utf-8");
      return content.includes('/*"') || content.includes('/* "');
    } catch (_error) {
      return false;
    }
  }

  async function getValidRoutes(
    dir: string,
    baseRoute: string = "",
  ): Promise<string[]> {
    const routes: string[] = [];
    const files = await fs.readdir(dir, { withFileTypes: true });

    // Check if the current directory is a catchall route
    const isCatchallRoute = await checkIsCatchallRoute(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (
        file.isDirectory() &&
        !file.name.startsWith("(") &&
        file.name !== "_error"
      ) {
        // Handle directories
        if (file.name === "index") {
          routes.push(...(await getValidRoutes(fullPath, baseRoute)));
        } else {
          routes.push(
            ...(await getValidRoutes(
              fullPath,
              path.join(baseRoute, file.name),
            )),
          );
        }
      } else if (file.name === "+Page.tsx" || file.name === "+Page.vue") {
        // Handle +Page.tsx or +Page.vue files
        // Always add leading slash for routes
        const routePath = baseRoute === "" ? "/" : `/${baseRoute}`;

        // Add as catchall route if needed
        if (isCatchallRoute) {
          routes.push(`${routePath}/@`);
        } else {
          routes.push(routePath);
        }
      }
    }

    return routes;
  }

  async function generatePagesList() {
    try {
      const routes = await getValidRoutes(pagesDir);
      const uniqueRoutes = [...new Set(routes)].sort();
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

  return {
    name: "vike-routegen",
    async configResolved(config) {
      // Store the project root for use in other hooks
      projectRoot = config.root;

      // Find pages directory
      const srcPagesPath = path.join(projectRoot, "src", "pages");
      const rootPagesPath = path.join(projectRoot, "pages");

      if (
        await fs
          .access(srcPagesPath)
          .then(() => true)
          .catch(() => false)
      ) {
        pagesDir = srcPagesPath;
      } else if (
        await fs
          .access(rootPagesPath)
          .then(() => true)
          .catch(() => false)
      ) {
        pagesDir = rootPagesPath;
      } else {
        // Try to find a pages directory recursively (limited to reasonable depth)
        async function findPagesDir(
          dir: string,
          depth = 0,
        ): Promise<string | null> {
          if (depth > 3) return null; // Avoid searching too deep

          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            // Check if this directory contains a pages directory
            const pagesEntry = entries.find(
              (entry) => entry.isDirectory() && entry.name === "pages",
            );

            if (pagesEntry) {
              return path.join(dir, "pages");
            }

            // Search subdirectories
            for (const entry of entries) {
              if (entry.isDirectory()) {
                const result = await findPagesDir(
                  path.join(dir, entry.name),
                  depth + 1,
                );
                if (result) return result;
              }
            }
          } catch {
            // Skip inaccessible directories
          }

          return null;
        }

        const foundPagesDir = await findPagesDir(projectRoot);
        if (!foundPagesDir) {
          console.warn(
            "[vike][routegen] No pages directory found. Using default path 'pages'",
          );
          pagesDir = path.join(projectRoot, "pages");
        } else {
          pagesDir = foundPagesDir;
        }
      }

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

      // Initial route generation
      // await generatePagesList();
    },

    async buildStart() {
      // We can now call generatePagesList here since it uses variables set in configResolved
      await generatePagesList();
    },

    async handleHotUpdate({ file }) {
      if (
        pagesDir &&
        file.startsWith(pagesDir) &&
        !file.endsWith("route-tree.gen.ts")
      ) {
        // We can now regenerate routes when files change
        await generatePagesList();
      }
    },
  };
}
