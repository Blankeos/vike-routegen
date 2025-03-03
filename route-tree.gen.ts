export const pageRoutes = [
  "/",
  "/dashboard",
  "/dashboard/settings",
  "/profiles/@id",
  "/profiles/@id/@projectName"
] as const;

type PageRoute = typeof pageRoutes[number];

type ExtractRouteParams<T extends string> = T extends `${string}@${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${string}@${infer Param}`
  ? { [K in Param]: string }
  : {};

export type VikeRouteParams<T extends PageRoute> = ExtractRouteParams<T>;

export function getRoute<T extends PageRoute>(
  route: T,
  ...args: ExtractRouteParams<T> extends Record<string, never> ? [] : [ExtractRouteParams<T>]
): string {
  const [params] = args;
  if (!params) return route;
  let result = route;
  Object.entries(params || {}).forEach(([key, value]) => {
    result = result.replace(`@${key}`, String(value));
  });
  return result;
}