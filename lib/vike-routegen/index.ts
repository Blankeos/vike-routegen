import fs from "fs/promises";
import path from "path";
import { Plugin } from "vite";

type VikeRouteGenOptions = {
  /** Defaults to 'route-tree.gen.ts', if 'src' exists, then 'src/route-tree.gen.ts' */
  routeTreeFilePath?: string;
};

export default async function vikeRoutegen(options?: VikeRouteGenOptions): Promise<Plugin> {
  const pagesDir = path.resolve(process.cwd(), "pages");

  const defaultOutputFilePath = (await fs.exists(path.join(process.cwd(), "src")))
    ? "src/route-tree.gen.ts"
    : "route-tree.gen.ts";

  const outputFilePath = path.resolve(
    process.cwd(),
    options?.routeTreeFilePath || defaultOutputFilePath
  );

  async function checkIsCatchallRoute(dirPath: string): Promise<boolean> {
    try {
      const routeFilePath = path.join(dirPath, "+route.ts");
      const fileExists = await fs
        .access(routeFilePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) return false;

      const content = await fs.readFile(routeFilePath, "utf-8");
      return content.includes('/*"') || content.includes('/* "');
    } catch (error) {
      return false;
    }
  }

  async function getValidRoutes(dir: string, baseRoute: string = ""): Promise<string[]> {
    const routes: string[] = [];
    const files = await fs.readdir(dir, { withFileTypes: true });

    // Check if the current directory is a catchall route
    const isCatchallRoute = await checkIsCatchallRoute(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory() && !file.name.startsWith("(") && file.name !== "_error") {
        // Handle directories
        if (file.name === "index") {
          routes.push(...(await getValidRoutes(fullPath, baseRoute)));
        } else {
          routes.push(...(await getValidRoutes(fullPath, path.join(baseRoute, file.name))));
        }
      } else if (file.name === "+Page.tsx") {
        // Handle +Page.tsx files
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
      const content = `export const pageRoutes = ${JSON.stringify(uniqueRoutes, null, 2)} as const;

export type PageRoute = typeof pageRoutes[number];


/* For regular routes with named parameters */
type ExtractNamedParams<T extends string> = T extends \`\${string}@\${infer Param}/\${infer Rest}\`
  ? { [K in Param | keyof ExtractNamedParams<Rest>]: string }
  : T extends \`\${string}@\${infer Param}\`
  ? { [K in Param]: string }
  : {};

/* Combined type for route parameters */
export type VikeRouteParams<T extends PageRoute> =
  IsCatchallRoute<T> extends true
    ? string[]
    : ExtractNamedParams<T>;

/* Conditional type helper for determining if a route is a catchall/splat route */
type IsCatchallRoute<T extends string> = T extends \`\${string}/@\` ? true : false;

/* Conditional type helper for determining if a route has parameters */
type HasParams<T extends string> =
  IsCatchallRoute<T> extends true
    ? true
    : T extends \`\${string}@\${string}\`
      ? true
      : false;

/* Type for the options of the getRoute function. */
type GetRouteOptions<T extends PageRoute> = HasParams<T> extends true
  ? IsCatchallRoute<T> extends true
    ? {
        params: string[];
        search?: Record<string, string>;
      }
    : {
        params: ExtractNamedParams<T>;
        search?: Record<string, string>;
      }
  : {
      params?: never;
      search?: Record<string, string>;
    };

/* Typesafe helper to generate a route URL based on Vike pages folder. */
export function getRoute<T extends PageRoute>(
  route: T,
  ...args: HasParams<T> extends true
    ? [options: GetRouteOptions<T>]
    : [options?: GetRouteOptions<T>]
): string {
  const options = args[0];

  // Handle catchall routes
  if (route.endsWith('/@') && options?.params) {
    if (Array.isArray(options.params)) {
      // For catchall routes, join the parameters
      const basePath = route.substring(0, route.length - 2); // Remove the /@
      const fullPath = \`\${basePath}/\${options.params.join('/')}\`;

      // Add search parameters if provided
      if (options.search) {
        const searchParams = new URLSearchParams(options.search);
        return \`\${fullPath}?\${searchParams.toString()}\`;
      }

      return fullPath;
    }
  }

  // Handle regular routes with named parameters
  let result: string = route;

  if (options?.params && !Array.isArray(options.params)) {
    Object.entries(options.params).forEach(([key, value]) => {
      result = result.replace(\`@\${key}\`, String(value));
    });
  }

  if (options?.search) {
    const searchParams = new URLSearchParams(options.search);
    result += \`?\${searchParams.toString()}\`;
  }

  return result;
}`;

      await fs.writeFile(outputFilePath, content);
      console.log(
        `\n[vike][routegen] 🌳 Route Tree generated in (${outputFilePath.replace(process.cwd() + "/", "./")}).\n`
      );
    } catch (error) {
      console.error("Error generating route tree:", error);
    }
  }

  return {
    name: "vike-routegen",
    async buildStart() {
      await generatePagesList();
    },
    async handleHotUpdate({ file }) {
      if (file.startsWith(pagesDir) && !file.endsWith("route-tree.gen.ts")) {
        await generatePagesList();
      }
    },
  };
}
