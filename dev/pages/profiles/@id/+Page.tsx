import { useParams } from "@/route-tree.gen";
import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Profile"),
  });

  const routeParams = useParams({
    from: "/profiles/@id",
  });

  return (
    <>
      <div>
        <h1>/profiles</h1>
        <div>({JSON.stringify(routeParams)})</div>
      </div>
    </>
  );
}
