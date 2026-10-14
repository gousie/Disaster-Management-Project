import { useEffect, useState } from "react";
import api from "../api/api";
import type { Disaster } from "../types/Disaster";

function DisasterPage() {

    const [disasters, setDisasters] = useState<Disaster[]>([]);

    const getDisasters = async () => {
        try {
            const res = await api.get<Disaster[]>("/disasters");
            setDisasters(res.data);
        } catch (err) {
            console.error("Error loading disasters:", err);
        }
    };

    useEffect(() => {
        getDisasters();
    }, []);

    return (
        <div>
            <h1>Disaster Management System</h1>

            <button onClick={getDisasters}>
                Load Disasters
            </button>

            {disasters.map((d) => (
                <div key={d.id}>
                    <h2>{d.title}</h2>
                    <p>Type: {d.type}</p>
                    <p>Description: {d.description}</p>
                    <p>Severity: {d.severity}</p>
                    <p>Location: {d.location}</p>
                    <p>Status: {d.status}</p>
                    <hr />
                </div>
            ))}
        </div>
    );
}

export default DisasterPage;