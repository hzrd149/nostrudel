import { Navigate, useParams, useSearchParams } from "react-router-dom";

export default function NappletToolView() {
  const { address } = useParams<{ address: string }>();
  const [searchParams] = useSearchParams();
  const search = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  return <Navigate to={address ? `/app/${address}${search}` : `/app/store${search}`} replace />;
}
