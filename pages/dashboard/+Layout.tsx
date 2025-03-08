import { getRoute } from "@/route-tree.gen";
import { type FlowProps } from "solid-js";

export default function DashboardLayout(props: FlowProps) {
  return (
    <div>
      <br />
      <aside>
        <a href={getRoute("/dashboard")}>/dashboard</a>
        <span>{" | "}</span>
        <a href={getRoute("/dashboard/settings")}>/settings</a>
        <span>{" | "}</span>
      </aside>
      {props.children}
    </div>
  );
}
