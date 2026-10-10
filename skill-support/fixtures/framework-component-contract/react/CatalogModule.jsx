import { useEffect, useRef, useState } from "react";
import { mountCatalogModule } from "../shared/catalog-module.js";
import "../shared/catalog-module.css";

export function CatalogModule({ moduleId }) {
  const rootRef = useRef(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    mountCatalogModule(rootRef.current, moduleId, "react")
      .then(() => { if (active) setStatus("ready"); })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [moduleId]);
  return <main ref={rootRef} className="framework-catalog-module" data-component="Catalog Module" data-logical-component={`Catalog/${moduleId}`} data-variant="gallery" data-state={status} />;
}
