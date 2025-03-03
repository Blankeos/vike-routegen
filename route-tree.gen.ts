export const pageRoutes = [
  "/",
  "/dashboard",
  "/dashboard/settings",
  "/profiles/@id",
  "/profiles/@id/@projectName",
] as const;

type PageRoute = (typeof pageRoutes)[number];

type ExtractRouteParams<T extends string> = T extends `${string}@${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${string}@${infer Param}`
    ? { [K in Param]: string }
    : {};

export type VikeRouteParams<T extends PageRoute> = ExtractRouteParams<T>;

type HasParams<T extends string> = T extends `${string}@${string}` ? true : false;

type GetRouteOptions<T extends PageRoute> =
  HasParams<T> extends true
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
  let result = route;

  if (options?.params) {
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

getRoute("/profiles/@id/@projectName", {
  params: {
    id: "123",
    projectName: "123",
  },
});
