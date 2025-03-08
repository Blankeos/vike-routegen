export const pageRoutes = [
  "/",
  "/catchall/@",
  "/dashboard",
  "/dashboard/settings",
  "/profiles/@id",
  "/profiles/@id/@projectName"
] as const;

export type PageRoute = typeof pageRoutes[number];


/* For regular routes with named parameters */
type ExtractNamedParams<T extends string> = T extends `${string}@${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractNamedParams<Rest>]: string }
  : T extends `${string}@${infer Param}`
  ? { [K in Param]: string }
  : {};

/* Combined type for route parameters */
export type VikeRouteParams<T extends PageRoute> =
  IsCatchallRoute<T> extends true
    ? string[]
    : ExtractNamedParams<T>;

/* Conditional type helper for determining if a route is a catchall/splat route */
type IsCatchallRoute<T extends string> = T extends `${string}/@` ? true : false;

/* Conditional type helper for determining if a route has parameters */
type HasParams<T extends string> =
  IsCatchallRoute<T> extends true
    ? true
    : T extends `${string}@${string}`
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
      const fullPath = `${basePath}/${options.params.join('/')}`;

      // Add search parameters if provided
      if (options.search) {
        const searchParams = new URLSearchParams(options.search);
        return `${fullPath}?${searchParams.toString()}`;
      }

      return fullPath;
    }
  }

  // Handle regular routes with named parameters
  let result: string = route;

  if (options?.params && !Array.isArray(options.params)) {
    Object.entries(options.params).forEach(([key, value]) => {
      result = result.replace(`@${key}`, String(value));
    });
  }

  if (options?.search) {
    const searchParams = new URLSearchParams(options.search);
    result += `?${searchParams.toString()}`;
  }

  return result;
}