import getTitle from "@/utils/get-title";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({
    title: getTitle("Profile"),
  });

  return (
    <>
      <div>
        Profiles
      </div>
    </>
  );
}
