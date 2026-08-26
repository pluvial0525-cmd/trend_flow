// =========================================================
// 발표 페이지 순서
// =========================================================
//
// 중요:
// 실제 발표 순서가 바뀌면 이 배열의 순서만 수정하면 됩니다.
//
// =========================================================

export const PRESENTATION_ROUTES = [
    "/",
    "/trend-intro",
    "/trend-city",
    "/graph-structure",
    "/cypher",
    "/path-traversal",
    "/rdb-vs-graph",
    "/trend-flow",
    "/trend-analysis",
    "/centrality",
    "/trend-signal",
    "/trend-patterns",
    "/trend-image-analysis",
    "/trend-graphrag",
    "/trend-insight",
];


// =========================================================
// 다음 페이지
// =========================================================

export function getNextRoute(currentPath) {

    const currentIndex =
        PRESENTATION_ROUTES.indexOf(
            currentPath
        );


    // 등록되지 않은 페이지
    if (currentIndex === -1) {
        return null;
    }


    // 마지막 페이지
    if (
        currentIndex ===
        PRESENTATION_ROUTES.length - 1
    ) {
        return null;
    }


    return PRESENTATION_ROUTES[
    currentIndex + 1
        ];
}


// =========================================================
// 이전 페이지
// =========================================================

export function getPreviousRoute(currentPath) {

    const currentIndex =
        PRESENTATION_ROUTES.indexOf(
            currentPath
        );


    // 등록되지 않은 페이지
    if (currentIndex === -1) {
        return null;
    }


    // 첫 페이지
    if (currentIndex === 0) {
        return null;
    }


    return PRESENTATION_ROUTES[
    currentIndex - 1
        ];
}