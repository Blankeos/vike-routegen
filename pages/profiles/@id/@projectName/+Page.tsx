import getTitle from "@/utils/get-title";
import { createSignal } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Profile"),
  });

  return (
    <>
      <div>Project ... and projectName ...</div>
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
