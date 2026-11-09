import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getNappletAddress, getNappletCatalogId } from "../../helpers/nostr/napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
import { handlerManifests$ } from "../../services/handler-preference-state";
import { setIntentTargetOpener } from "../../services/napplet-intent-targets";
import NappletIntentChoiceModal from "./intent-choice-modal";

/** Lives inside the router so discovery links and target navigation share its context. */
export default function NappletIntentHost() {
  const { intentChoice, respondIntentChoice } = useNappletShell();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    respondIntentChoice();
  }, [location.key, respondIntentChoice]);
  useEffect(() => {
    setIntentTargetOpener((catalogId) => {
      const event = [...handlerManifests$.value.values()].find(
        (manifest) => getNappletCatalogId(manifest) === catalogId,
      );
      const address = event && getNappletAddress(event);
      if (!address) return false;
      navigate(`/app/${address}`);
      return true;
    });
    return () => {
      setIntentTargetOpener(null);
      respondIntentChoice();
    };
  }, [navigate, respondIntentChoice]);
  return <NappletIntentChoiceModal intentChoice={intentChoice} onRespond={respondIntentChoice} />;
}
