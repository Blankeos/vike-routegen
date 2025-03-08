import { PageRoute, VikeRouteParams } from "@/route-tree.gen";
import { usePageContext } from "vike-solid/usePageContext";

export function useParams<T extends PageRoute>(opts: { from: T }) {
  const pageContext = usePageContext();
  const routeParams = pageContext.routeParams as VikeRouteParams<T>;

  // Handle catch-all routes
  if (routeParams && "*" in routeParams) {
    const catchAllPath = routeParams["*"] as string;
    const segments = catchAllPath.split("/").filter(Boolean);
    return segments as unknown as VikeRouteParams<T>;
  }

  return routeParams;
}
