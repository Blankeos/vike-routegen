import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Dashboard"),
  });

  return (
    <>
      <div>
        <h1>/dashboard</h1>
      </div>
    </>
  );
}
