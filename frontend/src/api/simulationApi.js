import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    timeout: 30000,
});

export async function getRumorSimulation({
                                             population = 300,
                                             starterId = null,
                                         } = {}) {
    const params = {
        population,
    };

    if (starterId) {
        params.starter_id = starterId;
    }

    const response = await api.get(
        "/api/simulation/rumor",
        { params }
    );

    return response.data;
}