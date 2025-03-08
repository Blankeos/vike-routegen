import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Settings"),
  });

  return (
    <>
      <div>
        <h1>/settings</h1>
      </div>
    </>
  );
}
