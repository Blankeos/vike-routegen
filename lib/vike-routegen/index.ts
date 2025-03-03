import fs from "fs/promises";
import path from "path";
import { Plugin } from "vite";

export default function vikeRoutegen(): Plugin {
  const pagesDir = path.resolve(process.cwd(), "pages");
  const outputFilePath = path.resolve(process.cwd(), "route-tree.gen.ts");

  async function getValidRoutes(dir: string, baseRoute: string = ""): Promise<string[]> {
    const routes: string[] = [];
    const files = await fs.readdir(dir, { withFileTypes: true });

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
        routes.push(routePath);
      }
    }

    return routes;
  }

  async function generatePagesList() {
    try {
      const routes = await getValidRoutes(pagesDir);
      const uniqueRoutes = [...new Set(routes)].sort();

      const content = `export const pageRoutes = ${JSON.stringify(uniqueRoutes, null, 2)} as const;

type PageRoute = typeof pageRoutes[number];

type ExtractRouteParams<T extends string> = T extends \`\${string}@\${infer Param}/\${infer Rest}\`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends \`\${string}@\${infer Param}\`
  ? { [K in Param]: string }
  : {};

export type VikeRouteParams<T extends PageRoute> = ExtractRouteParams<T>;

type HasParams<T extends string> = T extends \`\${string}@\${string}\` ? true : false;

type GetRouteOptions<T extends PageRoute> = HasParams<T> extends true
  ? {
      params: ExtractRouteParams<T>;
      search?: Record<string, string>;
    }
  : {
      params?: ExtractRouteParams<T>;
      search?: Record<string, string>;
    };

export function getRoute<T extends PageRoute>(
  route: T,
  ...args: HasParams<T> extends true
    ? [options: GetRouteOptions<T>]
    : [options?: GetRouteOptions<T>]
): string {
  const options = args[0];
  let result: string = route;

  if (options?.params) {
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
      console.log("\n[vike][routegen] 🌳 Route Tree generated/updated.\n");
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
