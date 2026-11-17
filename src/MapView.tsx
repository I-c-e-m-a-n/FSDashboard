import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import { colors, records, type RecordItem } from "./data";
export default function MapView({
  items,
  selected,
  onSelect,
}: {
  items: RecordItem[];
  selected: string | null;
  onSelect: (r: RecordItem) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, {
      scrollWheelZoom: false,
      zoomControl: false,
    });
    map.current = m;
    m.fitBounds(
      L.latLngBounds(records.map((r) => [r.lat, r.lng] as [number, number])),
      { padding: [38, 38], maxZoom: 16 },
    );
    L.control.zoom({ position: "bottomright" }).addTo(m);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    tiles.on("tileerror", () => setFailed(true));
    tiles.addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    layer.current?.clearLayers();
    items.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], {
        title: r.title,
        autoPanOnFocus: false,
        alt: r.title,
        icon: L.divIcon({
          className: "map-pin-wrap",
          html: `<span class="map-pin ${r.id === selected ? "selected" : ""}" style="--pin:${colors[r.category]}">${r.category === "House visits" ? "H" : r.category === "Case management" ? "C" : r.category === "Infrastructure" ? "I" : "E"}${r.priority === "Urgent" ? "<i></i>" : ""}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      });
      marker.on("click", () => onSelect(r));
      marker.addTo(layer.current!);
      // Keep map-container focus from scrolling the page between pointer down/up.
      // Marker keyboard navigation remains available through its normal tabindex.
      const element = marker.getElement();
      if (element) L.DomEvent.on(element, "mousedown", L.DomEvent.stop);
    });
    const target = items.find((r) => r.id === selected);
    if (target)
      map.current?.panTo([target.lat, target.lng], { animate: false });
  }, [items, selected, onSelect]);
  return (
    <div className="map-frame">
      <div
        ref={host}
        className="map"
        role="region"
        aria-label="Interactive Fengshan operations map"
      />
      <div className="map-label">
        <span className="pulse" /> FENGSHAN <small>Singapore</small>
      </div>
      <button
        className="map-reset"
        aria-label="Reset map view"
        onClick={() =>
          map.current?.fitBounds(
            L.latLngBounds(
              records.map((r) => [r.lat, r.lng] as [number, number]),
            ),
            { padding: [38, 38], maxZoom: 16 },
          )
        }
      >
        <LocateFixed size={17} />
      </button>
      {failed && (
        <div className="map-error" role="status">
          Street map unavailable. Operational markers and the records list
          remain available.
        </div>
      )}
      <div className="map-note">
        Illustrative locations · not official boundaries
      </div>
    </div>
  );
}
