const API_BASE_URL = "http://127.0.0.1:8000";


export async function analyzeTrend(question) {
    const response = await fetch(
        `${API_BASE_URL}/api/graphrag/analyze`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                question,
            }),
        }
    );


    if (!response.ok) {
        let detail =
            "GraphRAG 분석 중 오류가 발생했습니다.";

        try {
            const errorData =
                await response.json();

            detail =
                errorData.detail ||
                detail;

        } catch {
            // 응답이 JSON이 아니어도 기본 메시지 사용
        }


        const error =
            new Error(detail);

        error.status =
            response.status;

        throw error;
    }


    return await response.json();
}