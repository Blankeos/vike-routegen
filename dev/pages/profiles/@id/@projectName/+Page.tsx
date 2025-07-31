import { useParams } from "@/route-tree.gen";
import getTitle from "@/utils/get-title";
import { createSignal } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Profile with Project"),
  });

  const routeParams = useParams({
    from: "/profiles/@id/@projectName",
  });

  return (
    <>
      <div>
        <h1>/profiles</h1>
        <div>({JSON.stringify(routeParams())})</div>
      </div>
    </>
  );
}

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button type="button" onClick={() => setCount((count) => count + 1)}>
      Counter {count()}
    </button>
  );
}
