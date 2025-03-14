import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Home"),
  });

  return (
    <>
      <div>
        <h1>/home</h1>
      </div>
    </>
  );
}
