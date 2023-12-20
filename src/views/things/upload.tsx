import STLViewer from "../../components/stl-viewer";
import VerticalPageLayout from "../../components/vertical-page-layout";

export default function ThingUploadView() {
  return (
    <VerticalPageLayout>
      <STLViewer aspectRatio={16 / 9} url="https://tonybox.net/objects/keystone/keystone.stl" />
    </VerticalPageLayout>
  );
}
