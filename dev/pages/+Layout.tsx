import { getRoute } from "@/route-tree.gen";
import getTitle from "@/utils/get-title";
import { type FlowProps } from "solid-js";
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
          <a href={getRoute("/")}>/home</a>
          <span>{" | "}</span>
          <a href={getRoute("/dashboard")}>/dashboard</a>
          <span>{" | "}</span>
          <a href={getRoute("/profiles/@id", { params: { id: "carlo" } })}>/profiles/@id</a>
          <span>{" | "}</span>
          <a
            href={getRoute("/profiles/@id/@projectName", {
              params: { id: "carlo", projectName: "proj" },
            })}
          >
            /profiles/@id/@projectName
          </a>
          <span>{" | "}</span>
          <a
            href={getRoute("/catchall/@", {
              params: {
                "@": "/123/123",
              },
            })}
          >
            /catchall/@
          </a>
          <span>{" | "}</span>
        </nav>
        {props.children}
      </div>
    </>
  );
}
