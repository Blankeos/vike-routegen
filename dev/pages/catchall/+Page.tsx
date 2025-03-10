import { useParams } from "@/route-tree.gen";
import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Catchall"),
  });

  const routeParams = useParams({
    from: "/catchall/@",
  });

  return (
    <div>
      <h1>/catchall</h1>
      <p>This is a demonstration of "catchall" or "splat" routes.</p>
      <div>{JSON.stringify(routeParams)}</div>
    </div>
  );
}
