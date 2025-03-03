import { getRoute } from "@/route-tree.gen";
import getTitle from "@/utils/get-title";
import { createSignal, type FlowProps } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

useMetadata.setGlobalDefaults({
  title: getTitle("Home"),
  description: "Demo showcasing Vike and Solid.",
});

export default function RootLayout(props: FlowProps) {
  return (
    <>
      <div>
        <nav>
          <a href={getRoute("/")}>Home</a>
          <span>{" | "}</span>
          <a href={getRoute("/dashboard")}>Dashboard</a>
          <span>{" | "}</span>
          <a href={getRoute("/profiles/@id", { params: { id: "carlo" } })}>Profiles carlo</a>
          <span>{" | "}</span>
          <a
            href={getRoute("/profiles/@id/@projectName", {
              params: { id: "carlo", projectName: "proj" },
            })}
          >
            PRofilesandProjectname
          </a>
          <span>{" | "}</span>
          <Counter />
        </nav>
        {props.children}
      </div>
    </>
  );
}

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button type="button" onClick={() => setCount((count) => count + 1)}>
      Root Counter {count()}
    </button>
  );
}
