import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "",
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