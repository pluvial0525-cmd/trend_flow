const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "";


// =========================================================
// Trend Flow 전체 그래프 조회
// =========================================================

export async function getTrendFlowGraph() {

    const response = await fetch(
        `${API_BASE_URL}/api/trend-flow`
    );


    if (!response.ok) {

        throw new Error(
            `Trend Flow API 오류: ${response.status}`
        );
    }


    return response.json();
}


// =========================================================
// 선택한 Node의 Evidence 조회
// =========================================================

export async function getTrendFlowEvidence(
    nodeName
) {

    if (!nodeName) {

        throw new Error(
            "Evidence를 조회할 노드 이름이 없습니다."
        );
    }


    const encodedNodeName =
        encodeURIComponent(
            nodeName
        );


    const response = await fetch(
        `${API_BASE_URL}/api/trend-flow/evidence/${encodedNodeName}`
    );


    if (!response.ok) {

        let detail = "";

        try {

            const errorData =
                await response.json();

            detail =
                errorData?.detail
                    ? ` - ${errorData.detail}`
                    : "";

        } catch {

            detail = "";
        }


        throw new Error(
            `Trend Flow Evidence API 오류: ${response.status}${detail}`
        );
    }


    return response.json();
}