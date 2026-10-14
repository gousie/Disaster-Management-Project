import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

interface Disaster {
    id?: number;
    title?: string;
    type?: string;
    description?: string;
    severity?: string;
    location?: string;
    latitude?: number | null;
    longitude?: number | null;
    status?: string;
}

interface DisasterMapProps {
    disasters: Disaster[];
}

function severityClass(severity?: string): string {
    const s = (severity || "").toUpperCase();
    if (s === "CRITICAL") return "marker-severity-critical";
    if (s === "HIGH") return "marker-severity-high";
    if (s === "MEDIUM") return "marker-severity-medium";
    return "marker-severity-low";
}

function createDisasterIcon(severity?: string) {
    const cls = severityClass(severity);

    return L.divIcon({
        className: "disastra-map-marker",
        html: `
            <div class="marker-pulse ${cls}">
                <div class="marker-core">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/>
                        <path d="M12 8v5"/>
                        <path d="M12 17h.01"/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -23],
    });
}

function DisasterMap({ disasters }: DisasterMapProps) {
    const validDisasters = disasters.filter(
        (d) =>
            typeof d.latitude === "number" &&
            Number.isFinite(d.latitude) &&
            typeof d.longitude === "number" &&
            Number.isFinite(d.longitude)
    );

    return (
        <div className="disaster-map-container">
            <MapContainer
                center={[16.3067, 80.4365]}
                zoom={7}
                minZoom={5}
                maxZoom={18}
                scrollWheelZoom={true}
                className="disaster-map"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {validDisasters.map((disaster) => (
                    <Marker
                        key={disaster.id}
                        position={[
                            disaster.latitude as number,
                            disaster.longitude as number,
                        ]}
                        icon={createDisasterIcon(disaster.severity)}
                    >
                        <Popup>
                            <div className="map-popup">
                                <div className="popup-title">
                                    <div className="popup-warning">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
                                            <path d="M12 8v5" />
                                            <path d="M12 17h.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3>
                                            {disaster.title || "Disaster"}
                                        </h3>
                                        <span>
                                            {disaster.status || "ACTIVE"}
                                        </span>
                                    </div>
                                </div>

                                <div className="popup-row">
                                    <strong>Type</strong>
                                    <span>
                                        {disaster.type || "Unknown"}
                                    </span>
                                </div>

                                <div className="popup-row">
                                    <strong>Severity</strong>
                                    <span
                                        className={`popup-severity ${disaster.severity?.toLowerCase()}`}
                                    >
                                        {disaster.severity || "Unknown"}
                                    </span>
                                </div>

                                <div className="popup-row">
                                    <strong>Location</strong>
                                    <span>
                                        {disaster.location || "—"}
                                    </span>
                                </div>

                                {disaster.description && (
                                    <div
                                        className="popup-row"
                                        style={{
                                            marginTop: 8,
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <strong>Details</strong>
                                        <span
                                            style={{
                                                marginTop: 4,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {disaster.description.length > 120
                                                ? disaster.description.slice(
                                                      0,
                                                      120
                                                  ) + "…"
                                                : disaster.description}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="map-live-label">
                <span />
                LIVE INCIDENT MAP
            </div>

            <div className="map-counter">
                <strong>{validDisasters.length}</strong>
                <span>mapped incidents</span>
            </div>

            {validDisasters.length === 0 && (
                <div className="map-empty">
                    <div className="map-empty-icon">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        >
                            <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
                            <path d="M9 3v15" />
                            <path d="M15 6v15" />
                        </svg>
                    </div>
                    <strong>No mapped disasters</strong>
                    <span>
                        Add latitude and longitude when creating a disaster.
                    </span>
                </div>
            )}
        </div>
    );
}

export default DisasterMap;
