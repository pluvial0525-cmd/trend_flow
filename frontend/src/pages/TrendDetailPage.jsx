import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ExternalLink,
    Image as ImageIcon,
    Maximize2,
    Minus,
    Newspaper,
    Play,
    Plus,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getTrendFlowGraph,
    getTrendFlowEvidence,
} from "../api/trendFlowApi";

import {
    getGroupNodes,
    getGroupRelationships,
    getTrendFromSlug,
    parseDateToYearValue,
} from "../utils/trendFlowUtils";

import "../styles/trendDetailPage.css";


/* =========================================================
   NODE TYPE
========================================================= */

function getNodeType(node) {
    const labels =
        node.labels || [];

    const ignored =
        new Set([
            "TrendFlowNode",
        ]);

    return (
        labels.find(
            (label) =>
                !ignored.has(label)
        )
        || "Node"
    );
}


/* =========================================================
   VISUAL GROUP
========================================================= */

function getVisualGroup(node) {
    const type =
        getNodeType(node)
            .toUpperCase();


    if (
        type === "CELEBRITY"
        || type === "DESIGNER"
        || type === "ACTOR"
        || type === "CONSUMERGROUP"
    ) {
        return "person";
    }


    if (
        type === "MEDIA"
        || type === "CONTENT"
    ) {
        return "media";
    }


    if (type === "STYLE") {
        return "style";
    }


    if (
        type === "CONCEPT"
        || type === "PERIOD"
    ) {
        return "concept";
    }


    if (
        type === "BRAND"
        || type === "COMPANY"
    ) {
        return "brand";
    }


    if (
        type === "PRODUCT"
        || type === "COLLECTION"
    ) {
        return "product";
    }


    if (
        type === "MARKET"
        || type === "PLATFORM"
    ) {
        return "market";
    }


    return "other";
}


/* =========================================================
   CENTER TREND ICON
========================================================= */

function TrendCenterIcon({
                             trendId,
                         }) {
    if (
        trendId === "SKINNY"
        || trendId === "LOW_RISE"
    ) {
        return (
            <svg
                viewBox="0 0 64 64"
                className="trend-center-svg"
                aria-hidden="true"
            >
                <path
                    d="
                        M18 8
                        H46
                        L43 28
                        L48 55
                        H37
                        L32 34
                        L27 55
                        H16
                        L21 28
                        Z
                    "
                />

                <path d="M32 9 V34" />

                <path d="M19 15 H45" />

                <path
                    d="M25 9 C25 14 27 17 32 18"
                />
            </svg>
        );
    }


    if (trendId === "UGG") {
        return (
            <svg
                viewBox="0 0 64 64"
                className="trend-center-svg"
                aria-hidden="true"
            >
                <path
                    d="
                        M20 8
                        H40
                        V37
                        C44 39 50 43 53 48
                        V55
                        H15
                        C11 55 9 52 11 48
                        L20 38
                        Z
                    "
                />

                <path d="M20 16 H40" />
                <path d="M20 22 H40" />
            </svg>
        );
    }


    if (trendId === "DUFFLE") {
        return (
            <svg
                viewBox="0 0 64 64"
                className="trend-center-svg"
                aria-hidden="true"
            >
                <path
                    d="
                        M23 9
                        L32 14
                        L41 9
                        L51 18
                        L45 29
                        L43 56
                        H21
                        L19 29
                        L13 18
                        Z
                    "
                />

                <path d="M32 14 V56" />
                <path d="M26 25 H38" />
                <path d="M26 34 H38" />
                <path d="M26 43 H38" />
            </svg>
        );
    }


    return (
        <svg
            viewBox="0 0 64 64"
            className="trend-center-svg"
            aria-hidden="true"
        >
            <path
                d="
                    M22 8
                    L32 14
                    L42 8
                    L52 18
                    L45 27
                    L42 22
                    V35
                    H22
                    V22
                    L19 27
                    L12 18
                    Z
                "
            />

            <path
                d="
                    M25 35
                    H39
                    L43 56
                    H34
                    L32 43
                    L30 56
                    H21
                    Z
                "
            />
        </svg>
    );
}


/* =========================================================
   CENTER NODE
========================================================= */

function findCenterNode(
    nodes,
    trend
) {
    const candidates = {
        SKINNY: [
            "스키니진",
            "스키니 팬츠",
        ],

        UGG: [
            "UGG Boots",
            "UGG",
        ],

        VELOUR: [
            "Velour Tracksuit",
        ],

        LOW_RISE: [
            "Low-Rise",
        ],

        DUFFLE: [
            "Duffle Coat",
        ],
    };


    const names =
        candidates[
            trend.id
            ] || [];


    for (
        const name
        of names
        ) {
        const found =
            nodes.find(
                (node) =>
                    node.name === name
            );

        if (found) {
            return found;
        }
    }


    return (
        nodes.find(
            (node) =>
                getNodeType(node)
                === "Style"
        )
        || nodes[0]
    );
}


/* =========================================================
   DEGREE MAP
========================================================= */

function buildDegreeMap(
    relationships
) {
    const map =
        new Map();


    relationships.forEach(
        (relationship) => {

            if (
                relationship.source_id
            ) {
                map.set(
                    relationship.source_id,
                    (
                        map.get(
                            relationship.source_id
                        )
                        || 0
                    ) + 1
                );
            }


            if (
                relationship.target_id
            ) {
                map.set(
                    relationship.target_id,
                    (
                        map.get(
                            relationship.target_id
                        )
                        || 0
                    ) + 1
                );
            }

        }
    );


    return map;
}


/* =========================================================
   RELATION YEAR
========================================================= */

function getRelationYear(
    relationship
) {
    return parseDateToYearValue(
        relationship.date
        || relationship.year
        || null
    );
}


/* =========================================================
   MEDIAN
========================================================= */

function median(values) {
    if (!values.length) {
        return null;
    }


    const sorted =
        [...values]
            .sort(
                (a, b) =>
                    a - b
            );


    const middle =
        Math.floor(
            sorted.length / 2
        );


    if (
        sorted.length % 2
        === 0
    ) {
        return (
            sorted[
            middle - 1
                ]
            + sorted[
                middle
                ]
        ) / 2;
    }


    return sorted[
        middle
        ];
}


/* =========================================================
   NODE YEAR
========================================================= */

function buildNodeYearMap(
    nodes,
    relationships
) {
    const map =
        new Map();


    nodes.forEach(
        (node) => {

            const years =
                relationships
                    .filter(
                        (relationship) =>
                            relationship.source_id
                            === node.node_id

                            ||

                            relationship.target_id
                            === node.node_id
                    )
                    .map(
                        getRelationYear
                    )
                    .filter(
                        (year) =>
                            year !== null
                    );


            map.set(
                node.node_id,
                median(years)
            );

        }
    );


    return map;
}


/* =========================================================
   STAGES
========================================================= */

const STAGE_PRESETS = {
    SKINNY: [
        {
            key: "2005",
            label: "등장",
            from: 2000,
            to: 2007.5,
            x: 25,
        },

        {
            key: "2009",
            label: "대중 확산",
            from: 2007.5,
            to: 2016,
            x: 43,
        },

        {
            key: "2021",
            label: "전환",
            from: 2016,
            to: 2023.5,
            x: 65,
        },

        {
            key: "2025–2026",
            label: "재등장",
            from: 2023.5,
            to: 2027,
            x: 86,
        },
    ],


    DUFFLE: [
        {
            key: "1990s",
            label: "과거 유행",
            from: 1988,
            to: 2005,
            x: 23,
        },

        {
            key: "2010–2019",
            label: "복고 재등장",
            from: 2005,
            to: 2020,
            x: 43,
        },

        {
            key: "2021",
            label: "재해석",
            from: 2020,
            to: 2023,
            x: 65,
        },

        {
            key: "2024–2025",
            label: "재등장 신호",
            from: 2023,
            to: 2027,
            x: 86,
        },
    ],


    VELOUR: [
        {
            key: "2001–2005",
            label: "과거 전성기",
            from: 1999,
            to: 2010,
            x: 25,
        },

        {
            key: "2019",
            label: "브랜드 재론칭",
            from: 2010,
            to: 2019.7,
            x: 44,
        },

        {
            key: "2020",
            label: "라이프스타일 변화",
            from: 2019.7,
            to: 2020.8,
            x: 65,
        },

        {
            key: "2021",
            label: "Y2K 재조명",
            from: 2020.8,
            to: 2027,
            x: 86,
        },
    ],


    UGG: [
        {
            key: "2004",
            label: "과거 유행",
            from: 2000,
            to: 2015,
            x: 25,
        },

        {
            key: "2021",
            label: "재등장",
            from: 2015,
            to: 2022,
            x: 45,
        },

        {
            key: "2023",
            label: "소비층 확장",
            from: 2022,
            to: 2025,
            x: 66,
        },

        {
            key: "2026",
            label: "사계절 확장",
            from: 2025,
            to: 2027,
            x: 86,
        },
    ],


    LOW_RISE: [
        {
            key: "2000s",
            label: "과거 전성기",
            from: 1998,
            to: 2015,
            x: 22,
        },

        {
            key: "2021",
            label: "재등장 초기",
            from: 2015,
            to: 2021.7,
            x: 43,
        },

        {
            key: "2022",
            label: "대중 확산",
            from: 2021.7,
            to: 2022.7,
            x: 65,
        },

        {
            key: "2022–현재",
            label: "형태 재해석",
            from: 2022.7,
            to: 2027,
            x: 86,
        },
    ],
};


/* =========================================================
   STAGE OVERRIDE
   Low-Rise는 실제 관계연도가 2021~2022에 집중되어 있어
   발표 흐름이 한 덩어리로 보입니다.
   날짜 자체는 바꾸지 않고, 노드의 역할에 따라 시각 단계만 분리합니다.
========================================================= */

function getStageOverride(
    trend,
    node,
    stages
) {
    if (!trend || !node) {
        return null;
    }

    const overrides = {
        LOW_RISE: {
            "Y2K": "2000s",
            "Miu Miu SS22": "2021",
            "Miu Miu": "2022",
            "Zigzag": "2022",
            "Low-Rise Micro Skirt": "2022–현재",
            "Crop Knit": "2022–현재",
        },

        DUFFLE: {
            "School Uniform": "1990s",
            "강다니엘": "2010–2019",
            "Preppy Style": "2021",
            "Oversized Duffle Coat": "2024–2025",
            "Recto": "2024–2025",
        },
    };

    const stageKey =
        overrides[
            trend.id
            ]?.[
            node.name
            ];

    if (!stageKey) {
        return null;
    }

    return (
        stages.find(
            (stage) =>
                stage.key === stageKey
        )
        || null
    );
}


/* =========================================================
   STAGE MATCH
========================================================= */

function findStage(
    year,
    stages
) {
    if (
        year === null
        || year === undefined
    ) {
        return stages[
            Math.floor(
                stages.length / 2
            )
            ];
    }


    return (
        stages.find(
            (stage) =>
                year >= stage.from
                && year < stage.to
        )
        || stages[
        stages.length - 1
            ]
    );
}


/* =========================================================
   NODE TYPE ORDER
========================================================= */

const TYPE_ORDER = {
    person: 1,
    media: 2,
    style: 3,
    concept: 4,
    market: 5,
    brand: 6,
    product: 7,
    other: 8,
};


/* =========================================================
   NODE POSITIONS
========================================================= */

function buildStagePositions(
    nodes,
    relationships,
    trend
) {
    if (!nodes.length) {
        return [];
    }


    const center =
        findCenterNode(
            nodes,
            trend
        );


    if (!center) {
        return [];
    }


    const stages =
        STAGE_PRESETS[
            trend.id
            ];


    const degreeMap =
        buildDegreeMap(
            relationships
        );


    const yearMap =
        buildNodeYearMap(
            nodes,
            relationships
        );


    const years =
        relationships
            .map(
                getRelationYear
            )
            .filter(
                (year) =>
                    year !== null
            );


    const fallbackYear =
        median(years)
        || 2020;


    const grouped =
        new Map();


    stages.forEach(
        (stage) => {
            grouped.set(
                stage.key,
                []
            );
        }
    );


    nodes
        .filter(
            (node) =>
                node.node_id
                !== center.node_id
        )
        .forEach(
            (node) => {

                const year =
                    yearMap.get(
                        node.node_id
                    )
                    ?? fallbackYear;


                const stage =
                    getStageOverride(
                        trend,
                        node,
                        stages
                    )
                    || findStage(
                        year,
                        stages
                    );


                grouped
                    .get(
                        stage.key
                    )
                    .push({
                        ...node,

                        year,

                        stage,

                        degree:
                            degreeMap.get(
                                node.node_id
                            )
                            || 0,

                        visualGroup:
                            getVisualGroup(
                                node
                            ),
                    });

            }
        );


    const positioned =
        [];


    stages.forEach(
        (stage) => {

            const stageNodes =
                grouped
                    .get(
                        stage.key
                    )
                    .sort(
                        (a, b) => {

                            const typeDiff =
                                (
                                    TYPE_ORDER[
                                        a.visualGroup
                                        ]
                                    || 99
                                )
                                -
                                (
                                    TYPE_ORDER[
                                        b.visualGroup
                                        ]
                                    || 99
                                );


                            if (
                                typeDiff !== 0
                            ) {
                                return typeDiff;
                            }


                            return (
                                b.degree
                                - a.degree
                            );
                        }
                    );


            const maxRows =
                5;


            const columns =
                Math.ceil(
                    stageNodes.length
                    / maxRows
                );


            stageNodes.forEach(
                (
                    node,
                    index
                ) => {

                    const column =
                        Math.floor(
                            index / maxRows
                        );


                    const row =
                        index % maxRows;


                    const columnOffset =
                        columns <= 1
                            ? 0
                            : (
                                column
                                - (
                                    columns - 1
                                ) / 2
                            )
                            * 7.2;


                    positioned.push({
                        ...node,

                        x:
                            stage.x
                            + columnOffset,

                        y:
                            29
                            + row * 14.2,

                        isCenter:
                            false,
                    });

                }
            );

        }
    );


    positioned.unshift({
        ...center,

        x: 7,
        y: 54,

        year:
            yearMap.get(
                center.node_id
            )
            ?? fallbackYear,

        degree:
            degreeMap.get(
                center.node_id
            )
            || 0,

        visualGroup:
            "center",

        isCenter:
            true,
    });


    return positioned;
}


/* =========================================================
   PRIMARY RELATIONS
========================================================= */

const PRIMARY_RELATIONS =
    new Set([
        "DESIGNED",
        "FEATURED_STYLE",
        "WORE",
        "PERFORMED",
        "SOLD_ON",
        "SHIFTED_TO",
        "REVIVED_AS",
        "EVIDENCE_OF",
        "RELEASED",
        "SALES_INCREASED",
        "PRESENTED",
        "POPULAR_UNTIL",
        "CAMPAIGNED_FOR",
        "FEATURED_PRODUCT",
    ]);

/* =========================================================
   KEY TREND NODES
   큰 유행 흐름을 대표하는 핵심 사건
========================================================= */

const KEY_TREND_NODES = {
    SKINNY: {
        /* =====================================================
       LOW-RISE
       과거 → 런웨이 재등장 → 국내 소비 → 형태 재해석
    ===================================================== */

        "Miu Miu SS22": {
            mode: "focus",
            imageUrl: "https://assets.vogue.com/photos/615c89526c8d9e425d98d38f/master/w_2560%2Cc_limit/00012-Miu-Miu-Spring-22-RTW-Paris-credit-gorunway.jpg",
            caption: "Miu Miu 2022 S/S · 골반까지 내려온 마이크로 미니스커트와 크롭 상의",
            source: "Vogue · Miu Miu Spring 2022",
            fit: "cover",
            objectPosition: "center 34%",
            focusLabel: "허리선은 매우 낮게, 상의와 스커트 길이는 매우 짧게 만들어 2000년대 로우라이즈를 한눈에 알아볼 수 있는 새로운 비율로 재해석",
        },

        "Miu Miu": {
            mode: "focus",
            imageUrl: "https://assets.vogue.com/photos/6221ef9df6134a7dbaafcc87/master/w_1600%2Cc_limit/most-in-demand-items-voguebus-Filippo-Fior-Gorunway_com-mar-22-story-inline.jpg",
            caption: "런웨이 이후 매거진·셀럽·SNS로 반복 노출된 Miu Miu SS22 마이크로 미니",
            source: "Vogue Business · Miu Miu SS22 viral trend",
            fit: "cover",
            objectPosition: "center 30%",
            focusLabel: "한 번의 런웨이 룩이 잡지 표지·셀럽 착용·SNS 이미지로 반복되며 '로우라이즈가 다시 돌아왔다'는 인식을 빠르게 확산",
        },

        "Y2K": {
            mode: "compare",
            compareImageUrl: "https://assets.vogue.com/photos/6216adf719dbd67a7ca076fb/master/w_1600%2Cc_limit/MiuMiu_SS22.png",
            compareLabel: "2000년대 핵심 · 낮은 허리선 + 배 노출",
            imageUrl: "https://assets.vogue.com/photos/6221ef9df6134a7dbaafcc87/master/w_1600%2Cc_limit/most-in-demand-items-voguebus-Filippo-Fior-Gorunway_com-mar-22-story-inline.jpg",
            primaryLabel: "2022 재해석 · 마이크로 미니 + 크롭",
            caption: "Y2K의 핵심 비율이 현재 아이템으로 다시 조합됨",
            source: "Vogue / Vogue Business · Y2K & Miu Miu SS22",
            styleSignals: ["낮은 허리선", "배를 드러내는 비율", "짧은 상의와 결합"],
            transformNote: "로우라이즈가 다시 유행한 이유는 과거 바지를 그대로 복제해서가 아니라, Y2K 향수 속에서 '낮은 허리선'이라는 특징을 마이크로 스커트·크롭 상의 같은 현재 아이템과 다시 조합했기 때문입니다.",
        },

        "Low-Rise Micro Skirt": {
            mode: "compare",
            compareImageUrl: "https://assets.vogue.com/photos/6216adf719dbd67a7ca076fb/master/w_1600%2Cc_limit/MiuMiu_SS22.png",
            compareLabel: "과거 로우라이즈 · 팬츠 중심",
            imageUrl: "https://assets.vogue.com/photos/6221ef9df6134a7dbaafcc87/master/w_1600%2Cc_limit/most-in-demand-items-voguebus-Filippo-Fior-Gorunway_com-mar-22-story-inline.jpg",
            primaryLabel: "현재 재해석 · 초저허리 마이크로 스커트",
            caption: "같은 낮은 허리선이 다른 아이템과 비율로 변형",
            source: "Vogue · Miu Miu Spring 2022",
            styleSignals: ["골반선까지 낮아진 허리", "마이크로 길이", "크롭 상의와 세트"],
            transformNote: "재유행은 과거 모습의 완전한 복사가 아닙니다. 로우라이즈의 핵심인 낮은 허리선은 유지하면서 청바지 중심이던 이미지를 마이크로 스커트와 크롭 셋업으로 바꿔 현재적인 형태를 만들었습니다.",
        },

        "Zigzag": {
            mode: "lowRiseMarket",
            caption: "해외 런웨이의 로우라이즈가 국내 검색·상품 노출로 이어지는 소비 확산 단계",
            source: "Neo4j · Zigzag SEARCHED_ON / SALES_INCREASED 관계",
            signals: [
                { label: "1단계", title: "런웨이 화제", text: "Miu Miu 등에서 로우라이즈가 다시 강하게 노출" },
                { label: "2단계", title: "검색 증가", text: "소비자가 로우라이즈 키워드와 유사 상품을 직접 탐색" },
                { label: "3단계", title: "상품 확산", text: "국내 쇼핑 플랫폼에서 관련 실루엣의 노출과 판매가 확대" },
            ],
            focusLabel: "유행이 '보는 패션'에서 '직접 찾고 사는 패션'으로 넘어가는 지점",
        },


        /* =====================================================
           DUFFLE COAT
           스키니진 / UGG와 같은 발표형 구조:
           핵심 노드마다 사진 + 짧은 설명 + 비교 시각자료
        ===================================================== */

        "School Uniform": {
            mode: "focus",
            imageUrl:
                "https://t1.daumcdn.net/news/201901/07/seoul/20190107063102300kbjk.jpg",
            caption:
                "1990년대 학생층의 겨울 아우터로 기억된 더플코트와 이후 교복형 아우터의 변화",
            source:
                "서울신문 · 1990년대 떡볶이 코트 회고 자료",
            fit:
                "cover",
            objectPosition:
                "center 20%",
            focusLabel:
                "토글 단추와 후드가 달린 단정한 코트가 교복 위에 입는 겨울 외투로 반복 노출되며 ‘학생 코트’ 이미지가 강하게 형성됐습니다.",
        },

        "강다니엘": {
            mode: "focus",
            imageUrl:
                "https://kenh14cdn.com/2017/k2-1513140156377.png",
            caption:
                "2017년 공항패션에서 베이지 더플코트를 착용한 강다니엘",
            source:
                "머니투데이·공항패션 보도 / 2017 MAMA 출국 스타일",
            fit:
                "cover",
            objectPosition:
                "center 34%",
            focusLabel:
                "과거 학생복 이미지가 강했던 떡볶이 코트가 아이돌의 공항패션에 등장하면서 ‘복고 학생 코트’가 아니라 다시 입을 수 있는 캐주얼 아우터로 보이기 시작한 사례입니다.",
        },

        "Preppy Style": {
            mode: "compare",
            compareImageUrl:
                "/images/trend/duffle/duffle-classic.png",
            compareLabel:
                "과거 · 학생복 이미지가 강했던 클래식 더플코트",
            compareFit: "cover",
            compareObjectPosition: "center 38%",
            imageUrl:
                "/images/trend/duffle/preppy-modern.png",
            primaryLabel:
                "현재 재해석 · 데님·롱부츠와 섞인 프레피 캐주얼",
            fit: "cover",
            objectPosition: "center 48%",
            caption:
                "토글 단추는 유지하지만, 교복처럼 입기보다 데님과 부츠를 섞어 훨씬 자유로운 일상 스타일로 재해석",
            source:
                "사용자 제공 이미지 · 클래식/현대 더플코트 스타일 비교",
            styleSignals: [
                "토글 디테일 유지",
                "교복 이미지에서 탈피",
                "데님·부츠와 현대적으로 믹스",
            ],
            transformNote:
                "프레피 재해석은 예전 학생복을 그대로 복원하는 것이 아닙니다. 더플코트의 상징인 토글 단추는 남기고 데님·롱부츠·여유 있는 실루엣과 섞으면서 현재의 캐주얼 스타일로 바뀐 점이 핵심입니다.",
        },

        "Oversized Duffle Coat": {
            mode: "compare",
            compareImageUrl:
                "/images/trend/duffle/duffle-classic.png",
            compareLabel:
                "기존 · 짧고 단정한 학생형 떡볶이 코트",
            compareFit: "cover",
            compareObjectPosition: "center 44%",
            imageUrl:
                "/images/trend/duffle/duffle-oversized.png",
            primaryLabel:
                "최근 · 길고 넉넉하게 바뀐 오버사이즈 더플코트",
            fit: "cover",
            objectPosition: "center 55%",
            caption:
                "같은 토글 단추를 사용하지만 기장·어깨·품이 커지면서 학생 코트보다 스트리트 아우터에 가까운 인상으로 변화",
            source:
                "사용자 제공 이미지 · 클래식/오버사이즈 더플코트 비교",
            styleSignals: [
                "짧은 학생형 → 롱 기장",
                "몸에 맞는 핏 → 넉넉한 품",
                "토글 단추는 그대로 유지",
            ],
            transformNote:
                "최근 더플코트의 재등장은 과거 디자인을 그대로 복사한 모습이 아닙니다. 한눈에 알아보는 토글 디테일은 유지하되 길이와 볼륨을 크게 키워 현재 선호하는 오버핏 실루엣으로 변형됐다는 점이 핵심입니다.",
        },

        "Recto": {
            mode: "focus",
            imageUrl:
                "https://cdn.wconcept.com/products/resize/632x843/7202961/26/720296126_1.png",
            caption:
                "최근 국내 디자이너 브랜드·편집숍에서도 다시 판매되는 롱 더플코트",
            source:
                "W Concept · 국내 디자이너 더플코트 상품 사례",
            fit:
                "contain",
            objectPosition:
                "center center",
            focusLabel:
                "마지막 단계는 셀럽 착용만이 아니라 실제 브랜드 상품으로 다시 등장했는지를 보는 구간입니다. 토글·후드 같은 과거 특징을 유지한 더플코트가 현재 상품군에서도 다시 제안되고 있습니다.",
        },

        "Hedi Slimane": {
            phase: "ORIGIN",
            label: "등장",
            yearLabel: "2005",
            meaning:
                "Dior Homme에서 좁고 긴 실루엣이 강하게 제시된 초기 구간입니다.",
            why:
                "록 문화의 마른 비율과 좁은 팬츠가 반복 제시되며 새로운 남성 실루엣으로 주목받기 시작했습니다.",
        },
        "소녀시대": {
            phase: "ADOPTION",
            label: "대중 확산",
            yearLabel: "2009",
            meaning:
                "Gee의 컬러 스키니진이 대중문화와 패션을 강하게 연결한 확산 구간입니다.",
            why:
                "반복적인 무대 노출 뒤 실제 판매가 전년 동기 대비 2배 이상 증가했습니다.",
        },
        "SPAO": {
            phase: "SHIFT",
            label: "실루엣 전환",
            yearLabel: "2021",
            meaning:
                "스키니 중심의 소비가 Wide-Leg처럼 더 여유 있는 실루엣으로 이동한 구간입니다.",
            why:
                "편안함·활동성·여유 있는 핏 선호가 커졌고 SPAO의 와이드 팬츠 판매 증가가 실제 소비 이동으로 나타났습니다.",
        },
        "코르티스": {
            phase: "REVIVAL",
            label: "재등장 신호",
            yearLabel: "2025–2026",
            meaning:
                "젊은 아이돌 스타일링에서 스키니·슬림 팬츠가 다시 노출되는 구간입니다.",
            why:
                "코르티스의 착용이 GQ 등 패션 미디어에서 별도 트렌드 사례로 다뤄지며 재등장 신호가 확장됐습니다.",
        },
        "Modern Slim Silhouette": {
            phase: "TRANSFORM",
            label: "현대적 재해석",
            yearLabel: "2025–2026",
            meaning:
                "과거 초밀착 스키니가 슬림 스트레이트·Bootcut 등으로 변형되는 구간입니다.",
            why:
                "핏은 슬림하지만 상의 볼륨과 소재·비율을 현대적으로 조정해 과거와 다른 방식으로 다시 매치되고 있습니다.",
        },
    },

    VELOUR: {
        "Paris Hilton": {
            phase: "ORIGIN",
            label: "과거 전성기",
            yearLabel: "2001–2005",
            meaning:
                "부드러운 벨벳 계열 소재의 집업 상의와 바지를 한 벌로 입는 ‘벨루어 트랙수트’가 2000년대 셀러브리티 일상복으로 크게 유행하던 시기를 보여줍니다.",
            why:
                "편안한 트레이닝복인데도 몸에 맞는 핏·선명한 색·로고 장식을 갖고 있었고, Paris Hilton을 비롯한 셀러브리티가 일상에서 반복 착용하면서 ‘편하지만 멋있는 옷’으로 인식되기 시작했습니다.",
        },
        "Juicy Couture": {
            phase: "BRAND",
            label: "브랜드 재론칭",
            yearLabel: "2019",
            meaning:
                "과거 벨루어 트랙수트 유행의 중심 브랜드가 다시 시장에 등장하면서 2000년대 스타일을 현재 소비자와 연결하는 재출발 구간입니다.",
            why:
                "Juicy Couture는 벨루어 트랙수트의 대표 브랜드라는 강한 과거 이미지를 가지고 있어, 브랜드 재론칭 자체가 사라졌던 스타일이 다시 노출될 수 있는 연결점이 됩니다.",
        },
        "One-Mile Wear": {
            phase: "SHIFT",
            label: "라이프스타일 변화",
            yearLabel: "2020",
            meaning:
                "벨루어 트랙수트가 단순한 Y2K 복고 아이템을 넘어 편안한 외출복과 원마일웨어 흐름에 다시 맞아 들어간 변화 구간입니다.",
            why:
                "집과 가까운 외출에서 편안함을 중시하는 소비가 커지면서 트랙수트·셋업처럼 활동성과 스타일을 함께 갖춘 옷이 다시 자연스럽게 선택될 환경이 만들어졌습니다.",
        },
        "Jennie": {
            phase: "REVIVAL",
            label: "Y2K 재조명",
            yearLabel: "2021",
            meaning:
                "새로운 세대의 셀러브리티 스타일링을 통해 벨루어 트랙수트가 다시 노출되며 과거 이미지가 현재의 Y2K 패션으로 연결되는 구간입니다.",
            why:
                "과거 세대의 상징이던 벨루어 트랙수트가 Jennie 같은 새로운 세대의 패션 아이콘과 연결되면서 단순한 추억이 아니라 다시 입을 수 있는 스타일로 재해석됩니다.",
        },
        "Y2K": {
            phase: "CONNECTION",
            label: "복고 연결",
            yearLabel: "2021–",
            meaning:
                "벨루어 트랙수트 하나만 독립적으로 돌아온 것이 아니라 2000년대 미학 전체가 다시 소비되는 흐름 속에서 함께 재등장했음을 보여줍니다.",
            why:
                "로우라이즈·크롭트 톱·트랙수트처럼 2000년대 요소들이 함께 재조명되면서 벨루어 트랙수트도 더 큰 Y2K 유행 네트워크 안에서 다시 의미를 얻었습니다.",
        },
    },

    UGG: {
        "임수정": {
            phase: "ORIGIN",
            label: "과거 유행",
            yearLabel: "2004",
            meaning:
                "드라마 속 겨울 스타일과 함께 어그부츠가 강한 이미지로 기억되던 과거 유행 구간입니다.",
            why:
                "따뜻한 양털 부츠가 니트·레그워머 같은 겨울 스타일과 반복 노출되며 국내에서 ‘겨울 어그’의 대표 이미지로 남았습니다.",
        },
        "소연": {
            phase: "REVIVAL",
            label: "재등장",
            yearLabel: "2023",
            meaning:
                "UGG가 소연을 국내 모델로 기용하며 겨울 부츠 중심 이미지를 젊은 세대의 패션 브랜드로 다시 노출한 핵심 구간입니다.",
            why:
                "소연과 함께한 2023 여름 캠페인 이후 10~20대 매출이 직전 기간 대비 6배 증가했고, 이후 FW 캠페인까지 이어지며 재등장이 실제 젊은 소비층 반응으로 연결됐습니다.",
        },
        "10~20대": {
            phase: "ADOPTION",
            label: "소비층 확장",
            yearLabel: "2023",
            meaning:
                "소연 캠페인으로 만들어진 재노출이 실제 젊은 소비층의 구매 반응으로 이어졌는지 확인하는 핵심 확산 노드입니다.",
            why:
                "2023 여름 캠페인 이후 10~20대 매출이 직전 기간 대비 6배 증가했고, Aww Yeah 샌들 판매도 231% 증가해 셀럽 노출이 소비 반응으로 이어진 구간을 보여줍니다.",
        },
        "연준": {
            phase: "EXPANSION",
            label: "남성·계절 확장",
            yearLabel: "2026",
            meaning:
                "연준을 브랜드 앰버서더로 내세우며 여성 겨울 부츠 중심이던 UGG가 남성 라이프스타일 슈즈까지 넓어지는 흐름입니다.",
            why:
                "신세계인터내셔날 발표 기준 2025년 1~9월 남성 제품 매출이 전년 동기 대비 135% 증가했고, 2026 SS에는 클로그·샌들·스니커즈까지 맨즈 제품군을 확대했습니다.",
        },
        "All-Season Fashion": {
            phase: "TRANSFORM",
            label: "사계절 확장",
            yearLabel: "2026",
            meaning:
                "겨울 방한화 중심의 브랜드가 샌들·슬리퍼·클로그까지 확장되며 사계절 패션으로 이동하는 변화입니다.",
            why:
                "2026년 여름 제품 판매가 전체 브랜드 성장을 이끌며 매출이 50% 증가했고, 남성 라인 매출과 행사 기간 검색량도 각각 2배 수준의 증가가 확인됐습니다.",
        },
    },

    LOW_RISE: {
        "Y2K": {
            phase: "PAST",
            label: "과거 전성기",
            yearLabel: "2000s",
            meaning:
                "2000년대에는 허리선이 골반까지 내려오는 로우라이즈 진이 셀럽 일상복과 대중 패션에서 매우 흔한 기본 실루엣으로 소비됐습니다.",
            why:
                "파파라치·리얼리티 TV·뮤직비디오 속 셀럽들이 낮은 허리선의 데님과 짧은 상의를 반복해서 보여주면서 ‘배를 드러내는 낮은 허리선’ 자체가 2000년대 패션의 대표 이미지가 됐습니다.",
        },
        "Miu Miu SS22": {
            phase: "ORIGIN",
            label: "재등장 초기",
            yearLabel: "2021",
            meaning: "Miu Miu 2022 S/S 컬렉션의 초저허리 마이크로 미니스커트와 크롭 상의가 강한 시각적 충격을 만들며 로우라이즈가 다시 패션의 중심에 등장한 구간입니다.",
            why: "2000년대의 낮은 허리선은 그대로 가져왔지만, 교복·오피스웨어처럼 익숙한 셔츠와 니트를 과감하게 잘라낸 비율로 재구성했습니다. 과거 복제품이 아니라 한눈에 알아볼 수 있는 새로운 실루엣이었기 때문에 런웨이 이후 빠르게 화제가 됐습니다.",
        },
        "Miu Miu": {
            phase: "BRAND",
            label: "런웨이 확산",
            yearLabel: "2021–2022",
            meaning: "Miu Miu가 로우라이즈를 한 번의 런웨이 장면에서 끝내지 않고 상품·화보·셀럽 착용으로 반복 노출시키며 세계적인 재유행 이미지로 만든 단계입니다.",
            why: "SS22 마이크로 미니스커트는 패션 매거진 표지와 셀럽·인플루언서 착용으로 반복 노출됐고, 비슷한 크롭·로우웨이스트 조합이 빠르게 확산됐습니다. 즉 브랜드가 과거 Y2K 기억을 현재의 강한 시각 이미지로 다시 연결했습니다.",
        },
        "Zigzag": {
            phase: "RESPONSE",
            label: "국내 소비 확산",
            yearLabel: "2022",
            meaning: "해외 런웨이에서 보이던 로우라이즈가 국내 패션 플랫폼의 검색·상품 노출로 이어지며 실제 소비자가 찾는 스타일로 확장되는 단계입니다.",
            why: "유행이 진짜 확산됐는지는 런웨이 사진보다 소비자가 직접 검색하고 비슷한 상품을 찾기 시작했는지에서 더 잘 드러납니다. Zigzag 노드는 로우라이즈가 국내 쇼핑 시장으로 내려온 흐름을 보여주는 시장 반응 지점입니다.",
        },
        "Low-Rise Micro Skirt": {
            phase: "TRANSFORM",
            label: "형태 재해석",
            yearLabel: "2022–현재",
            meaning: "과거의 로우라이즈 청바지가 그대로 복귀한 것이 아니라, 허리선을 골반까지 낮춘 마이크로 스커트·크롭 상의 같은 새로운 조합으로 변형된 모습을 보여줍니다.",
            why: "재유행의 핵심은 '낮은 허리선'이라는 특징만 남기고 아이템과 비율을 바꾼 것입니다. 그래서 현재의 로우라이즈는 2000년대 청바지 하나가 아니라 스커트·카고·와이드 팬츠 등 여러 형태로 확장될 수 있습니다.",
        },
    },

    DUFFLE: {
        "School Uniform": {
            phase: "PAST",
            label: "과거 유행",
            yearLabel: "1990s",
            meaning:
                "떡볶이 코트가 교복·학생 이미지와 강하게 연결되던 과거 유행의 문화적 배경을 보여주는 핵심 개념 노드입니다.",
            why:
                "더플코트 특유의 토글 단추와 단정한 실루엣이 학생·프레피 이미지와 결합하며 국내에서 익숙한 스타일로 자리 잡았습니다.",
        },
        "강다니엘": {
            phase: "REVIVAL",
            label: "복고 재등장",
            yearLabel: "2019",
            meaning:
                "과거 유행했던 떡볶이 코트가 셀럽 착용을 통해 다시 주목받는 흐름을 보여주는 사례입니다.",
            why:
                "과거의 아이템이 새로운 세대와 셀럽 스타일링을 통해 다시 노출되는 재등장 흐름을 보여줍니다.",
        },
        "Preppy Style": {
            phase: "TRANSFORM",
            label: "재해석",
            yearLabel: "2021",
            meaning:
                "떡볶이 코트가 과거 교복의 복제보다 프레피·레이어드 스타일의 일부로 다시 해석되는 흐름을 보여주는 개념 노드입니다.",
            why:
                "아이템 하나의 복귀가 아니라 니트·셔츠·스커트·와이드 팬츠 등과 결합하며 현대적인 프레피 스타일로 재구성됩니다.",
        },
        "Oversized Duffle Coat": {
            phase: "REVIVAL",
            label: "재등장 신호",
            yearLabel: "2024–2025",
            meaning:
                "최근 더플코트가 과거의 짧고 단정한 학생복 이미지보다 오버사이즈 실루엣으로 변형돼 다시 나타나는 흐름을 보여줍니다.",
            why:
                "같은 토글 디테일을 유지하면서 길이와 볼륨을 키워 현재의 아우터 실루엣과 결합한 것이 핵심 변화입니다.",
        },
        "Recto": {
            phase: "BRAND",
            label: "브랜드 재노출",
            yearLabel: "2024–2025",
            meaning:
                "최근 브랜드 상품군에서 더플코트가 다시 제안되는지를 확인할 수 있는 브랜드 노드입니다.",
            why:
                "재등장 여부를 단순 이미지 유사성만이 아니라 실제 브랜드 제품 출시와 연결해 확인하는 근거가 됩니다.",
        },
    },
};



const DUFFLE_BOTTOM_VISUALS = {
    "School Uniform": {
        title: "왜 ‘떡볶이 코트’가 학생 코트로 기억됐나",
        points: [
            { title: "토글 단추", text: "떡 모양을 닮은 잠금장치가 강한 시각적 특징이 됨" },
            { title: "교복 위 아우터", text: "단정한 실루엣과 보온성 때문에 학생 겨울 외투 이미지와 결합" },
            { title: "1990년대 기억", text: "한 시대의 청소년 패션을 상징하는 아이템으로 남음" },
        ],
    },
    "강다니엘": {
        title: "복고 아이템이 다시 ‘현재 옷’처럼 보인 지점",
        points: [
            { title: "과거 이미지", text: "학생·교복과 강하게 연결된 떡볶이 코트" },
            { title: "셀럽 재노출", text: "아이돌 공항패션에서 더플코트가 다시 등장" },
            { title: "인식 전환", text: "옛날 학생 코트 → 캐주얼 겨울 아우터로 재해석" },
        ],
    },
    "Preppy Style": {
        title: "재등장은 ‘복사’보다 스타일 조합의 변화",
        points: [
            { title: "유지", text: "후드와 토글 단추처럼 한눈에 알아보는 특징" },
            { title: "결합", text: "셔츠·니트·체크·스커트 등 프레피 요소와 레이어드" },
            { title: "결과", text: "교복 이미지가 패션 스타일의 일부로 이동" },
        ],
    },
    "Oversized Duffle Coat": {
        title: "같은 코트인데 왜 지금 느낌이 다른가",
        points: [
            { title: "과거", text: "단정하고 학생복에 가까운 비교적 정형화된 핏" },
            { title: "변화", text: "어깨·품·기장을 키운 오버사이즈 실루엣" },
            { title: "현재", text: "토글은 남기고 전체 비율을 현재 아우터 취향에 맞춤" },
        ],
    },
    "Recto": {
        title: "재유행 신호를 마지막으로 확인하는 방법",
        points: [
            { title: "보는 단계", text: "셀럽·콘텐츠에서 과거 아이템이 다시 노출" },
            { title: "입는 단계", text: "프레피·오버핏 등 현재 스타일로 다시 조합" },
            { title: "사는 단계", text: "브랜드 상품군에서 실제 더플코트가 다시 판매" },
        ],
    },
};

/* =========================================================
   UGG GRAPH FILTER
========================================================= */
const UGG_GRAPH_NODE_NAMES = new Set([
    "UGG Boots", "UGG", "임수정", "소연", "10~20대", "연준",
    "All-Season Fashion", "Aww Yeah", "Classic Mini II", "Disquette",
    "Ozzie Clog", "PeakMod Breed", "Shinsegae International",
    "Korean Fashion Market",
]);

function isVisibleTrendNode(trend, node) {
    if (!trend || !node) return false;
    if (trend.id !== "UGG") return true;
    return UGG_GRAPH_NODE_NAMES.has(node.name);
}


function normalizeNodeName(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();
}


function getKeyNodeMeta(
    trend,
    node
) {
    if (!trend || !node) {
        return null;
    }

    const keyNodes =
        KEY_TREND_NODES[
            trend.id
            ]
        || {};

    if (keyNodes[node.name]) {
        return keyNodes[node.name];
    }

    const normalizedName =
        normalizeNodeName(
            node.name
        );

    const matchedKey =
        Object.keys(
            keyNodes
        ).find(
            (key) =>
                normalizeNodeName(
                    key
                )
                === normalizedName
        );

    return (
        matchedKey
            ? keyNodes[matchedKey]
            : null
    );
}



/* =========================================================
   EVIDENCE HELPERS

   현재 DB에 URL이 없어도 오류 없이 동작.
   나중에 Neo4j 관계 속성에 아래 이름으로 URL 추가 가능.
========================================================= */

function normalizeUrl(
    value
) {
    if (
        !value
        || typeof value
        !== "string"
    ) {
        return null;
    }


    const trimmed =
        value.trim();


    if (
        trimmed.startsWith(
            "http://"
        )
        || trimmed.startsWith(
            "https://"
        )
    ) {
        return trimmed;
    }


    return null;
}


function getRelationResources(
    relationship
) {
    const resources =
        [];


    const candidates = [
        {
            type: "video",
            label:
                "관련 영상",
            url:
                relationship.video_url
                || relationship.videoUrl,
        },

        {
            type: "article",
            label:
                "관련 기사",
            url:
                relationship.article_url
                || relationship.articleUrl,
        },

        {
            type: "image",
            label:
                "관련 이미지",
            url:
                relationship.image_url
                || relationship.imageUrl,
        },

        {
            type: "source",
            label:
                "출처 보기",
            url:
                relationship.source_url
                || relationship.sourceUrl
                || relationship.url,
        },
    ];


    candidates.forEach(
        (candidate) => {

            const url =
                normalizeUrl(
                    candidate.url
                );


            if (!url) {
                return;
            }


            if (
                resources.some(
                    (item) =>
                        item.url === url
                )
            ) {
                return;
            }


            resources.push({
                ...candidate,
                url,
            });

        }
    );


    return resources;
}


/* =========================================================
   RESOURCE ICON
========================================================= */

function ResourceIcon({
                          type,
                      }) {
    if (type === "video") {
        return (
            <Play
                size={15}
            />
        );
    }


    if (type === "image") {
        return (
            <ImageIcon
                size={15}
            />
        );
    }


    if (
        type === "article"
    ) {
        return (
            <Newspaper
                size={15}
            />
        );
    }


    return (
        <ExternalLink
            size={15}
        />
    );
}


/* =========================================================
   PRESENTATION VISUALS

   - Neo4j 관계에 image_url이 있으면 그 이미지를 우선 사용
   - 발표에서 바로 보이도록 핵심 사례는 fallback 이미지 제공
   - 외부 기사 페이지로 이동하지 않고 화면 안에서 자료를 보여줌
========================================================= */

const PRESENTATION_VISUALS = {

    /* =====================================================
       DUFFLE COAT
       핵심 노드별 발표용 이미지
    ===================================================== */

    "School Uniform": {
        mode: "focus",
        imageUrl: "https://t1.daumcdn.net/news/201901/07/seoul/20190107063102300kbjk.jpg",
        caption: "1990년대 학생층의 겨울 아우터로 기억된 떡볶이 코트",
        source: "서울신문 · 1990년대 떡볶이 코트 회고 자료",
        fit: "cover",
        objectPosition: "center 20%",
        focusLabel: "토글 단추와 후드가 달린 단정한 코트가 교복 위 겨울 외투로 반복되며 ‘학생 코트’ 이미지가 강하게 형성됐습니다.",
    },

    "강다니엘": {
        mode: "focus",
        imageUrl: "https://kenh14cdn.com/2017/k2-1513140156377.png",
        caption: "강다니엘의 베이지 더플코트 스타일링",
        source: "공항패션 보도 자료",
        fit: "cover",
        objectPosition: "center 34%",
        focusLabel: "과거 학생복 이미지가 강했던 떡볶이 코트가 셀럽 스타일링을 통해 다시 입을 수 있는 캐주얼 아우터로 보이기 시작한 사례입니다.",
    },

    "Preppy Style": {
        mode: "compare",

        compareImageUrl:
            "/images/trend/duffle/duffle-classic.png",

        compareLabel:
            "과거 · 단정한 학생형 떡볶이 코트",

        compareFit: "cover",

        compareObjectPosition:
            "center 40%",

        imageUrl:
            "/images/trend/duffle/preppy-modern.png",

        primaryLabel:
            "현재 · 프레피 스타일로 재해석",

        fit: "cover",

        objectPosition:
            "center 45%",

        caption:
            "토글 단추와 클래식한 분위기는 유지하면서 데님·부츠·레이어드 스타일과 결합해 현재적인 프레피 룩으로 변화했습니다.",

        source:
            "사용자 제공 이미지 · 과거/현대 더플코트 비교",

        styleSignals: [
            "토글 단추 유지",
            "교복 이미지에서 탈피",
            "데님·부츠와 현대적으로 조합",
        ],

        transformNote:
            "과거 학생 코트를 그대로 복원한 것이 아니라, 더플코트의 상징적인 디테일을 유지하면서 현재의 스타일링 방식과 결합한 것이 핵심입니다.",
    },

    "Oversized Duffle Coat": {
        mode: "compare",

        compareImageUrl:
            "/images/trend/duffle/duffle-classic.png",

        compareLabel:
            "과거 · 단정하고 짧은 학생형 더플코트",

        compareFit:
            "cover",

        compareObjectPosition:
            "center 42%",

        imageUrl:
            "/images/trend/duffle/duffle-oversized.png",

        primaryLabel:
            "최근 · 길고 넉넉한 오버사이즈 더플코트",

        fit:
            "cover",

        objectPosition:
            "center 52%",

        caption:
            "토글 단추는 그대로 남아 있지만 기장과 품이 크게 늘어나면서 학생 코트보다 현대적인 스트리트 아우터에 가까워졌습니다.",

        source:
            "사용자 제공 이미지 · 클래식/오버사이즈 더플코트 비교",

        styleSignals: [
            "짧은 기장 → 롱 기장",
            "단정한 핏 → 오버사이즈",
            "토글 디테일은 유지",
        ],

        transformNote:
            "떡볶이 코트가 그대로 돌아온 것이 아니라 사람들이 기억하는 토글 단추는 유지하면서 현재 선호하는 넉넉한 실루엣으로 형태가 바뀐 것이 핵심입니다.",
    },

    "Recto": {
        mode: "focus",
        imageUrl: "https://cdn.wconcept.com/products/resize/632x843/7202961/26/720296126_1.png",
        caption: "최근 브랜드 상품군에서 다시 제안되는 롱 더플코트",
        source: "W Concept · 국내 디자이너 더플코트 상품 사례",
        fit: "contain",
        objectPosition: "center center",
        focusLabel: "셀럽 노출을 넘어 실제 브랜드 상품으로 다시 판매되는지 확인하는 단계입니다. 토글·후드 같은 과거 특징이 현재 상품군에서도 이어집니다.",
    },


    /* =====================================================
       VELOUR TRACKSUIT
       사진과 시대 비교를 중심으로 구성
    ===================================================== */

    "Paris Hilton": {
        mode: "focus",
        imageUrl:
            "https://di2ponv0v5otw.cloudfront.net/posts/2023/09/04/64f68104ff048465a5549bd8/m_wp_64f6813704166dbf248b8eb4.webp",
        caption:
            "2000년대 셀러브리티 일상복의 상징이 된 벨루어 트랙수트",
        source:
            "Vogue · Paris Hilton / Juicy Couture 회고 자료",
        fit:
            "cover",
        objectPosition:
            "center 38%",
        focusLabel:
            "편안한 트레이닝복에 몸에 맞는 실루엣과 화려한 색을 더하고, 셀러브리티가 반복 착용하면서 ‘일상에서 입는 패션’으로 확산",
    },

    "Juicy Couture": {
        mode: "compare",
        compareImageUrl:
            "https://di2ponv0v5otw.cloudfront.net/posts/2023/09/04/64f68104ff048465a5549bd8/m_wp_64f6813704166dbf248b8eb4.webp",
        compareLabel:
            "과거 · 2000년대 대표 벨루어 셋업",
        imageUrl:
            "https://celebmafia.com/wp-content/uploads/2022/09/josie-canseco-juicy-couture-new-campaign-september-2022-2.jpg",
        primaryLabel:
            "현재 · 다시 출시된 벨루어 스타일",
        caption:
            "과거의 대표 아이템을 현재 소비자에게 다시 연결",
        source:
            "Vogue / Juicy Couture campaign reference",
        styleSignals: [
            "대표 브랜드 이미지 유지",
            "크롭·새로운 실루엣으로 변화",
            "Y2K 유행과 함께 재노출",
        ],
        transformNote:
            "완전히 새로운 옷이 등장한 것이 아니라, 2000년대에 강하게 기억된 브랜드와 소재를 현재 핏과 스타일링으로 다시 보여준 흐름입니다.",
    },

    "One-Mile Wear": {
        mode: "focus",
        imageUrl:
            "https://celebmafia.com/wp-content/uploads/2022/09/josie-canseco-juicy-couture-new-campaign-september-2022-2.jpg",
        caption:
            "편안함과 외출복의 경계가 흐려지며 다시 자연스러워진 셋업 스타일",
        source:
            "Juicy Couture campaign / athleisure styling reference",
        fit:
            "cover",
        objectPosition:
            "center 45%",
        focusLabel:
            "집에서 입는 옷과 외출복의 경계가 흐려지면서, 편안한 상·하의 셋업이 다시 일상복으로 받아들여질 환경이 만들어짐",
    },

    "Jennie": {
        mode: "focus",
        imageUrl:
            "https://awsimages.detik.net.id/community/media/visual/2022/11/24/jennierubyjaneinstagram-9_11.jpeg?w=1200",
        caption:
            "새로운 세대가 다시 소비한 벨루어 Y2K 스타일",
        source:
            "Jennie styling reference · Y2K fashion coverage",
        fit:
            "cover",
        objectPosition:
            "center 35%",
        focusLabel:
            "과거 세대의 상징이던 벨루어 셋업이 새로운 세대의 셀러브리티 스타일링을 통해 다시 ‘현재 옷’처럼 보이기 시작한 지점",
    },

    "Y2K": {
        mode: "compare",
        compareImageUrl:
            "https://di2ponv0v5otw.cloudfront.net/posts/2023/09/04/64f68104ff048465a5549bd8/m_wp_64f6813704166dbf248b8eb4.webp",
        compareLabel:
            "2000년대 · 벨루어 트랙수트",
        imageUrl:
            "https://awsimages.detik.net.id/community/media/visual/2022/11/24/jennierubyjaneinstagram-9_11.jpeg?w=1200",
        primaryLabel:
            "최근 · Y2K 스타일로 재해석",
        caption:
            "벨루어만 혼자 돌아온 것이 아니라 2000년대 요소가 함께 재소비",
        source:
            "Vogue / Y2K styling references",
        styleSignals: [
            "로우라이즈",
            "크롭 상의",
            "벨루어 셋업",
        ],
        transformNote:
            "벨루어 트랙수트는 하나의 독립 유행이라기보다 로우라이즈·크롭 상의 같은 2000년대 요소들이 함께 돌아오는 Y2K 흐름 속에서 다시 주목받았습니다.",
    },

    "Hedi Slimane": {
        mode: "focus",
        imageUrl:
            "https://i.pinimg.com/originals/6a/86/5f/6a865fed58094b33206579544e59108f.jpg",
        caption:
            "좁고 길게 떨어지는 Dior Homme의 Slim Silhouette",
        source:
            "Dior Homme Fall 2005 · Vogue reference",
        fit:
            "contain",
        objectPosition:
            "center center",
        focusLabel:
            "POINT · 좁은 바지 통과 길게 떨어지는 하체 비율",
    },

    "소녀시대": {
        mode: "photoChart",
        imageUrl:
            "https://everythingkcentral.wordpress.com/wp-content/uploads/2013/01/gee-girls-generation.jpg",
        caption:
            "Gee 활동의 컬러 스키니진 반복 노출",
        source:
            "Girls' Generation · Gee / 옥션 판매 보도",
        bars: [
            {
                label: "전년 동기",
                value: 100,
                display: "100",
            },
            {
                label: "2009",
                value: 205,
                display: "200+",
            },
        ],
        chartTitle:
            "컬러 스키니진 판매지수",
        chartNote:
            "전년 동기 대비 2배 이상",
    },

    "Gee": {
        mode: "photoChart",
        imageUrl:
            "https://everythingkcentral.wordpress.com/wp-content/uploads/2013/01/gee-girls-generation.jpg",
        caption:
            "Gee 활동에서 반복 노출된 컬러 스키니진",
        source:
            "Girls' Generation · Gee",
        bars: [
            { label: "전년 동기", value: 100, display: "100" },
            { label: "2009", value: 205, display: "200+" },
        ],
        chartTitle:
            "판매 반응",
        chartNote:
            "전년 동기 대비 2배 이상",
    },

    "컬러 스키니진": {
        mode: "photoChart",
        imageUrl:
            "https://everythingkcentral.wordpress.com/wp-content/uploads/2013/01/gee-girls-generation.jpg",
        caption:
            "소녀시대 Gee의 대표 컬러 스키니진",
        source:
            "Girls' Generation · Gee",
        bars: [
            { label: "전년 동기", value: 100, display: "100" },
            { label: "2009", value: 205, display: "200+" },
        ],
        chartTitle:
            "판매 반응",
        chartNote:
            "전년 동기 대비 2배 이상",
    },

    "SPAO": {
        mode: "shift",
        imageUrl:
            "https://item.elandrs.com/r/image/item/2024-01-17/ba267a75-2c1c-4e14-bd6c-40876c6837cc.jpg?h=&q=100&w=750",
        caption:
            "스키니 이후 소비가 이동한 Wide-Leg 실루엣",
        source:
            "SPAO · Wide Pants / 2021 판매 보도",
        drivers: [
            "편안함",
            "활동성",
            "여유 있는 핏",
        ],
        statPrimary:
            "+190%",
        statSecondary:
            "약 22만 장",
        statLabel:
            "Wide-Leg 판매 증가",
        bars: [
            { label: "전년", value: 100, display: "100" },
            { label: "2021", value: 290, display: "290" },
        ],
        chartNote:
            "전년 대비 +190% · 약 22만 장",
    },

    "코르티스": {
        mode: "gallery",
        imageUrl:
            "https://img.gqkorea.co.kr/gq/2025/11/style_692544f2dc859-1050x1400.jpg",
        galleryImages: [
            "https://img.gqkorea.co.kr/gq/2025/11/style_692544f2dc859-1050x1400.jpg",
            "https://www.harpersbazaar.co.kr/resources/online/online_image/2025/09/15/f43ee13c-8b61-4751-8114-c6e95c2a4dd3.jpeg",
        ],
        caption:
            "코르티스의 실제 Skinny / Slim Fit 스타일링",
        source:
            "GQ Korea · 2025.11 / Harper’s Bazaar Korea · 2025.09",
        mediaSignal:
            "GQ Korea·Harper’s Bazaar Korea가 코르티스의 스키니진 착장을 별도 트렌드 사례로 조명",
        signalTag:
            "미디어 반응",
    },

    /* =====================================================
       UGG BOOTS
       핵심 노드만 사진 + 발표용 시각 포인트 제공
    ===================================================== */

    "임수정": {
        mode: "focus",
        imageUrl:
            "https://www.cosmopolitan.co.kr/resources/online/online_image/2025/11/25/ddfac439-9f87-48eb-8f0e-0d97a3c350ea.jpeg",
        caption:
            "2004년 드라마에서 강하게 기억된 겨울 어그 스타일",
        source:
            "Cosmopolitan Korea · 2004 스타일 회고",
        fit:
            "cover",
        objectPosition:
            "center 46%",
        focusLabel:
            "2004 · 니트·레그워머와 함께 어그부츠가 겨울 스타일의 상징으로 노출",
    },

    "소연": {
        mode: "uggPortrait",
        imageUrl:
            "https://celebmafia.com/wp-content/uploads/2023/05/soyeon-g-i-dle-ugg-korea-2023-4.jpg",
        fallbackImageUrl:
            "https://legacy.kpopping.com/e9/0/SOYEON-x-UGG-FW-2023-Campaign-documents-1.jpeg",
        caption:
            "2023 UGG Korea 모델 소연",
        source:
            "UGG Korea · Shinsegae International · 2023",
        imageLabel:
            "소연 × UGG",
        visualNote:
            "소연 캠페인 이후 10~20대 매출 6배 증가 → 재노출이 실제 소비 반응으로 연결",
    },

    "10~20대": {
        mode: "focus",
        imageUrl:
            "https://image.msscdn.net/thumbnails/mfile_s01/cms-files/653b61894b53c0.68324675.jpg?w=1080",
        caption:
            "젊은 소비층의 UGG 미니부츠 스타일링",
        source:
            "Musinsa · UGG styling editorial · 2023",
        fit:
            "cover",
        objectPosition:
            "center 42%",
        focusLabel:
            "2023 · 소연 캠페인 이후 10~20대 매출 6배 증가 — 재유행이 실제 구매층으로 넘어간 확산 지점",
    },

    "연준": {
        mode: "uggYeonjunCompare",
        imageUrl:
            "https://img.news.3rd-in.co.jp/storage/articles/2026/03/19/ea757aa4-2329-11f1-ad0a-9ca3ba083d71/3434-752-6ed762cafdffa93fc723f33ebd442f1d-2525x1683.webp",
        fallbackImageUrl:
            "https://pbs.twimg.com/media/HDu5SKPaAAAmW-y.jpg",
        productImageUrl:
            "https://images.urbndata.com/is/image/Anthropologie/104023841_016_b?fit=constrain&qlt=80&wid=900",
        caption:
            "YEONJUN × UGG 26SS 맨즈 컬렉션",
        productLabel:
            "UGG 남성 클로그 / 라이프스타일 슈즈",
        source:
            "UGG · Shinsegae International · 2026",
        lines: [
            "남성 제품 매출 2025년 1~9월 전년 동기 대비 +135%",
            "2026 SS: 클로그 · 샌들 · 스니커즈까지 맨즈 컬렉션 확대",
            "연준 캠페인을 통해 ‘여성 겨울부츠’에서 ‘남성 라이프스타일 슈즈’로 소비 대상을 확장",
        ],
    },

    "All-Season Fashion": {
        mode: "uggSeasonCompare",
        winterImageUrl:
            "https://media.au.ugg.com/cdn-cgi/image/fit%3Dscale-down%2Cf%3Dauto%2Cw%3D1600/products/159c965d-9a28-494d-82bf-205273e1355d/1016222-che_1.jpg",
        summerImageUrl:
            "https://images.urbndata.com/is/image/Anthropologie/104023841_016_b?fit=constrain&qlt=80&wid=900",
        summerFallbackUrl:
            "https://4action.s3.eu-west-3.amazonaws.com/2026/02/it/ugg-otzo-ss26-ape.jpg",
        caption:
            "과거 클래식 양털부츠에서 현재 클로그형 UGG로",
        source:
            "UGG Classic Mini II / UGG Otzo Clog · 2026",
        winterLabel:
            "과거 · Classic Mini II",
        summerLabel:
            "현재 · Otzo Clog",
        transformNote:
            "겨울·양털·부츠 중심 → 슬립온·클로그·봄여름까지 확장. 같은 UGG이지만 제품 형태와 착용 계절이 달라졌습니다.",
    },

    "Modern Slim Silhouette": {
        mode: "compare",
        imageUrl:
            "https://cdn.mos.cms.futurecdn.net/sRPHsrjjWkzEUUpsjgcSdV-768-80.jpg",
        caption:
            "초밀착 Skinny에서 여유가 생긴 Modern Slim으로",
        source:
            "Who What Wear / GQ Korea / recent styling references",
        compareImageUrl:
            "https://i.pinimg.com/originals/6a/86/5f/6a865fed58094b33206579544e59108f.jpg",
        compareLabel:
            "2005 · 타이트 스키니",
        primaryLabel:
            "2025 · Slim-Straight",
        styleSignals: [
            "슬림 스트레이트",
            "슬림 부츠컷",
            "오버사이즈 상의 × 슬림 하의",
        ],
        transformNote:
            "과거 실루엣을 그대로 복원하기보다 핏·상의 볼륨·소재를 조정해 재해석",
    },
};


/* =========================================================
   LOW-RISE PRESENTATION VISUALS
   로우라이즈 전용 시각 자료.
   VELOUR의 Y2K 이미지와 충돌하지 않도록 trend별로 분리합니다.
========================================================= */
const LOW_RISE_PRESENTATION_VISUALS = {
    "Y2K": {
        mode: "compare",

        compareImageUrl:
            "/images/trend/low-rise/y2k-2003.png",

        compareLabel:
            "2003 · 낮은 허리선의 로우라이즈 데님",

        compareFit:
            "cover",

        // 얼굴보다 바지와 허리선이 잘 보이도록 아래쪽을 중심으로 표시
        compareObjectPosition:
            "center 68%",

        imageUrl:
            "/images/trend/low-rise/miu-miu-ss22.png",

        primaryLabel:
            "2022 · 로우라이즈를 마이크로 미니로 재해석",

        fit:
            "cover",

        objectPosition:
            "center 52%",

        caption:
            "2000년대에는 낮은 허리선의 데님이 대표적이었다면, 최근에는 같은 특징을 마이크로 스커트·크롭 상의 같은 새로운 아이템으로 다시 조합했습니다.",

        source:
            "사용자 제공 이미지 · 2000년대 / Miu Miu SS22 비교",

        styleSignals: [
            "낮은 허리선",
            "골반까지 내려간 비율",
            "현재 아이템과 다시 결합",
        ],

        transformNote:
            "로우라이즈의 재유행은 과거 청바지를 그대로 다시 입는 것이 아니라, '낮은 허리선'이라는 핵심 특징을 현재의 스커트·크롭 스타일과 결합하면서 나타난 변화입니다.",
    },

    "Miu Miu SS22": {
        mode: "focus",

        imageUrl:
            "/images/trend/low-rise/miu-miu-ss22.png",

        caption:
            "Miu Miu 2022 S/S · 초저허리 마이크로 미니스커트와 크롭 셔츠",

        source:
            "사용자 제공 이미지 · Miu Miu SS22",

        fit:
            "cover",

        objectPosition:
            "center 48%",

        focusLabel:
            "골반까지 내려온 허리선과 매우 짧은 스커트를 결합하면서, 2000년대 로우라이즈를 그대로 복제하지 않고 강한 새로운 실루엣으로 다시 보여준 장면입니다.",
    },

    "Miu Miu": {
        mode: "compare",
        compareImageUrl:
            "https://assets.vogue.com/photos/6216adf719dbd67a7ca076fb/master/w_1600%2Cc_limit/MiuMiu_SS22.png",
        compareLabel:
            "시작 · SS22 런웨이에서 강한 실루엣 제시",
        imageUrl:
            "https://assets.vogue.com/photos/6221ee144430ce077a64cdcb/master/w_2560%2Cc_limit/most-in-demand-items-voguebus-miu-miu-mar-22-story.jpg",
        primaryLabel:
            "확산 · 캠페인·화보·셀럽·SNS로 반복 노출",
        caption:
            "한 번의 런웨이 룩이 반복 노출되며 로우라이즈 복귀의 대표 이미지가 된 과정",
        source:
            "Miu Miu SS22 Campaign / Vogue Business",
        styleSignals: [
            "런웨이에서 강한 이미지 형성",
            "캠페인·매거진 반복 노출",
            "셀럽·SNS를 통해 대중 인식 확대",
        ],
        transformNote:
            "Miu Miu는 로우라이즈를 한 번의 런웨이 장면으로 끝내지 않았습니다. SS22 캠페인에는 한국 배우 이유미를 포함한 여러 인물이 참여했고, 같은 시즌의 실루엣이 매체와 SNS에서 반복 노출되며 재유행 이미지를 강화했습니다.",
    },

    "Zigzag": {
        mode: "lowRiseMarket",
        caption:
            "국내에서 로우라이즈가 실제 검색과 구매 행동으로 이어진 소비 확산 단계",
        source:
            "지그재그 2022년 1~2월 검색·구매 데이터 / 연합뉴스 2022.03.08",
        stats: [
            { label: "검색량", value: "37배", text: "로우라이즈 검색량 · 전년 동기 대비" },
            { label: "거래액", value: "10배+", text: "로우라이즈 상품 거래액 · 전년 동기 대비" },
        ],
        keywords: [
            "로우라이즈 팬츠",
            "로우라이즈 데님",
            "로우라이즈 스커트",
        ],
        focusLabel:
            "런웨이에서 보이던 스타일이 국내 플랫폼에서 ‘직접 검색하고 구매하는 패션’으로 넘어간 지점",
    },

    "Low-Rise Micro Skirt": {
        mode: "compare",

        compareImageUrl:
            "/images/trend/low-rise/lowrise-2000s.png",

        compareLabel:
            "2000년대 · 로우라이즈 데님 중심",

        compareFit:
            "cover",

        compareObjectPosition:
            "center 68%",

        imageUrl:
            "/images/trend/low-rise/lowrise-current.png",

        primaryLabel:
            "최근 · 로우라이즈를 다른 아이템으로 재해석",

        fit:
            "cover",

        objectPosition:
            "center 52%",

        caption:
            "과거에는 로우라이즈 데님이 대표적이었지만 현재는 낮은 허리선만 유지한 채 스커트·크롭 상의 등 다양한 조합으로 확장되고 있습니다.",

        source:
            "사용자 제공 이미지 · 과거/최근 로우라이즈 비교",

        styleSignals: [
            "낮은 허리선 유지",
            "데님 중심에서 아이템 확장",
            "크롭 상의와 비율 재구성",
        ],

        transformNote:
            "재유행의 핵심은 과거 스타일을 그대로 복사하는 것이 아닙니다. 낮은 허리선이라는 특징은 유지하되 아이템과 상·하의 비율을 바꾸면서 현재적인 스타일로 다시 소비되고 있습니다.",
    },
};


function getEvidenceImage(
    selectedNode,
    evidenceList,
    trendId
) {
    const relationImage =
        evidenceList
            .map(
                (evidence) =>
                    evidence?.properties?.image_url
                    || evidence?.properties?.imageUrl
                    || evidence?.image_url
                    || evidence?.imageUrl
                    || null
            )
            .find(Boolean);

    const preset =
        (trendId === "LOW_RISE"
            ? LOW_RISE_PRESENTATION_VISUALS[selectedNode?.name]
            : null)
        || PRESENTATION_VISUALS[selectedNode?.name]
        || null;

    // LOW_RISE / DUFFLE 핵심 노드는 발표용 전용 이미지를 우선합니다.
    // Neo4j 관계 이미지가 다른 노드의 사진으로 덮어쓰는 문제를 방지합니다.
    if (
        (trendId === "LOW_RISE" && LOW_RISE_PRESENTATION_VISUALS[selectedNode?.name])
        || (trendId === "DUFFLE" && PRESENTATION_VISUALS[selectedNode?.name])
    ) {
        return preset;
    }

    if (relationImage) {
        return {
            ...(preset || {}),
            imageUrl:
            relationImage,
            caption:
                preset?.caption
                || `저장된 ${selectedNode?.name || "Trend"} 시각 자료`,
        };
    }

    return preset;
}


function getSourceLabel(evidence) {
    return (
        evidence?.source_title
        || evidence?.properties?.source_title
        || "근거 자료"
    );
}


/* =========================================================
   PRESENTATION STORY

   1) 노출/등장
   2) 콘텐츠·스타일 연결
   3) 실제 소비 반응

   1-hop + 2-hop Evidence 중 발표에 필요한 3단계만 선택
========================================================= */

const EXPOSURE_RELATIONS = new Set([
    "WORE",
    "PERFORMED",
    "PRESENTED",
    "FEATURED_STYLE",
    "CAMPAIGNED_FOR",
    "LAUNCHED",
    "RELEASED",
    "DESIGNED",
]);

const BRIDGE_RELATIONS = new Set([
    "ASSOCIATED_WITH",
    "STYLE_OF",
    "FEATURED_PRODUCT",
    "REVIVED_AS",
    "SHIFTED_TO",
    "COEXISTS_WITH",
    "POPULAR_IN",
]);

const RESPONSE_RELATIONS = new Set([
    "SOLD_ON",
    "SALES_INCREASED",
    "SEARCHED_ON",
    "EVIDENCE_OF",
]);


function hasMetricEvidence(evidence) {
    return Boolean(
        evidence?.metric
        || evidence?.metric_display_value
        || evidence?.metric_change_text
    );
}


function getStoryStage(evidence) {
    const relation =
        evidence?.relationship || "";

    if (
        hasMetricEvidence(evidence)
        || RESPONSE_RELATIONS.has(relation)
    ) {
        return "response";
    }

    if (BRIDGE_RELATIONS.has(relation)) {
        return "bridge";
    }

    if (EXPOSURE_RELATIONS.has(relation)) {
        return "exposure";
    }

    return evidence?.depth === 1
        ? "exposure"
        : "bridge";
}


function getStoryMeta(stage) {
    if (stage === "exposure") {
        return {
            step: "01",
            eyebrow: "EXPOSURE",
            title: "반복 노출",
        };
    }

    if (stage === "bridge") {
        return {
            step: "02",
            eyebrow: "CONNECTION",
            title: "콘텐츠와 스타일 결합",
        };
    }

    return {
        step: "03",
        eyebrow: "RESPONSE",
        title: "실제 소비 반응",
    };
}


function evidenceQuality(evidence) {
    let score = 0;

    if (hasMetricEvidence(evidence)) {
        score += 100;
    }

    if (evidence?.reaction) {
        score += 20;
    }

    if (evidence?.context) {
        score += 10;
    }

    if (evidence?.source_title) {
        score += 5;
    }

    if (evidence?.depth === 1) {
        score += 3;
    }

    return score;
}


function buildPresentationStory(evidenceList) {
    const stageOrder = [
        "exposure",
        "bridge",
        "response",
    ];

    const picked = [];
    const usedKeys = new Set();

    stageOrder.forEach((stage) => {
        const candidate = [...evidenceList]
            .filter(
                (evidence) =>
                    getStoryStage(evidence) === stage
            )
            .sort(
                (a, b) =>
                    evidenceQuality(b)
                    - evidenceQuality(a)
            )[0];

        if (!candidate) {
            return;
        }

        const key = `${candidate.relationship}-${candidate.source_name}-${candidate.target_name}`;

        if (!usedKeys.has(key)) {
            usedKeys.add(key);
            picked.push(candidate);
        }
    });

    if (picked.length < 3) {
        [...evidenceList]
            .sort(
                (a, b) =>
                    evidenceQuality(b)
                    - evidenceQuality(a)
            )
            .forEach((evidence) => {
                if (picked.length >= 3) {
                    return;
                }

                const key = `${evidence.relationship}-${evidence.source_name}-${evidence.target_name}`;

                if (!usedKeys.has(key)) {
                    usedKeys.add(key);
                    picked.push(evidence);
                }
            });
    }

    return picked.slice(0, 3);
}


function getEvidenceFlowText(evidence) {
    const source =
        evidence?.source_name
        || "Trend";

    const target =
        evidence?.target_name
        || evidence?.related_node_name
        || "Evidence";

    return `${source} → ${target}`;
}


/* =========================================================
   COMPONENT
========================================================= */

function TrendDetailPage() {
    const navigate = useNavigate();

    const {
        trendId,
    } = useParams();

    const trend =
        getTrendFromSlug(
            trendId
        );


    const [
        data,
        setData,
    ] =
        useState({
            nodes: [],
            relationships: [],
        });


    const [
        selectedNodeId,
        setSelectedNodeId,
    ] =
        useState(null);


    const [
        evidenceData,
        setEvidenceData,
    ] =
        useState(null);


    const [
        evidenceStatus,
        setEvidenceStatus,
    ] =
        useState("idle");


    const [
        zoom,
        setZoom,
    ] =
        useState(1);


    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(
        () => {
            let cancelled =
                false;


            async function load() {
                try {
                    const result =
                        await getTrendFlowGraph();


                    if (cancelled) {
                        return;
                    }


                    setData({
                        nodes:
                            result.nodes
                            || [],

                        relationships:
                            result.relationships
                            || [],
                    });

                } catch (
                    error
                    ) {
                    console.error(
                        "Trend detail load error:",
                        error
                    );
                }
            }


            load();


            return () => {
                cancelled =
                    true;
            };
        },
        []
    );


    /* =====================================================
       GRAPH DATA
    ===================================================== */

    const nodes = useMemo(() => {
        if (!trend) return [];
        return getGroupNodes(data.nodes, data.relationships, trend.id)
            .filter((node) => isVisibleTrendNode(trend, node));
    }, [data.nodes, data.relationships, trend]);

    const relationships = useMemo(() => {
        if (!trend) return [];
        const groupRelationships = getGroupRelationships(data.relationships, trend.id);
        if (trend.id !== "UGG") return groupRelationships;
        const visibleNodeIds = new Set(nodes.map((node) => node.node_id));
        return groupRelationships.filter((relationship) =>
            visibleNodeIds.has(relationship.source_id)
            && visibleNodeIds.has(relationship.target_id)
        );
    }, [data.relationships, nodes, trend]);


    const graphNodes =
        useMemo(
            () => {
                if (!trend) {
                    return [];
                }


                return buildStagePositions(
                    nodes,
                    relationships,
                    trend
                );
            },
            [
                nodes,
                relationships,
                trend,
            ]
        );

    /* =====================================================
       VOICE COMMAND

       상세 페이지 음성 제어

       SELECT_NODE
       → 특정 핵심 노드 선택

       NEXT_NODE
       → 현재 핵심 노드의 다음 노드

       PREVIOUS_NODE
       → 현재 핵심 노드의 이전 노드

       SHOW_ALL
       → 선택 해제 / 전체 그래프
    ===================================================== */

    useEffect(() => {

        function handleVoiceCommand(event) {

            const type =
                event.detail?.type;

            const nodeName =
                event.detail?.nodeName;


            console.log(
                "[TREND DETAIL VOICE EVENT]",
                trend?.id,
                type,
                nodeName
            );


            /* =============================================
               1. 전체 그래프 보기
            ============================================= */

            if (type === "SHOW_ALL") {

                console.log(
                    "[TREND DETAIL VOICE SHOW ALL]",
                    trend?.id
                );

                setSelectedNodeId(null);

                return;
            }


            /* =============================================
               2. 다음 / 이전 핵심 노드

               스키니진 / UGG에서만 사용
            ============================================= */

            if (
                type === "FIRST_NODE"
                ||
                type === "NEXT_NODE"
                ||
                type === "PREVIOUS_NODE"
            ) {

                if (
                    trend?.id !== "SKINNY"
                    &&
                    trend?.id !== "UGG"
                ) {

                    console.log(
                        "[TREND DETAIL VOICE SEQUENCE DISABLED]",
                        trend?.id
                    );

                    return;
                }


                /*
                 * 화면에 존재하는 핵심 노드만 가져온다.
                 *
                 * KEY_TREND_NODES에 정의된 순서를
                 * 그대로 사용한다.
                 */

                /* =============================================
   발표에서 순서대로 보여줄 대표 노드

   스키니진 / UGG만 사용

   중요:
   실제 graphNodes의 name과 일치해야 함
============================================= */

                const VOICE_SEQUENCE_NODES = {

                    SKINNY: [
                        "Hedi Slimane",
                        "소녀시대",
                        "SPAO",
                        "코르티스",
                        "Modern Slim Silhouette",
                    ],

                    UGG: [
                        "임수정",
                        "소연",
                        "10~20대",
                        "연준",
                        "All-Season Fashion",
                    ],
                };


                const sequenceNodeNames =
                    VOICE_SEQUENCE_NODES[
                        trend.id
                        ]
                    || [];


                const normalizeNodeName = (
                    value = ""
                ) =>
                    String(value)
                        .toLowerCase()
                        .replace(/[\s'’"._-]/g, "");


                const keyNodes =
                    sequenceNodeNames
                        .map((nodeName) => {

                            const normalizedTarget =
                                normalizeNodeName(
                                    nodeName
                                );


                            return (
                                graphNodes.find(
                                    (node) =>
                                        normalizeNodeName(
                                            node.name
                                        )
                                        ===
                                        normalizedTarget
                                )
                                ||
                                null
                            );
                        })
                        .filter(Boolean);


                console.log(
                    "[TREND DETAIL ALL NODE NAMES]",
                    trend.id,
                    graphNodes.map(
                        (node) => ({
                            id: node.node_id,
                            name: node.name,
                            label: node.label,
                        })
                    )
                );
                console.log(
                    "[TREND DETAIL SEQUENCE NODES]",
                    trend.id,
                    keyNodes.map(
                        (node) => node.name
                    )
                );


                if (
                    keyNodes.length === 0
                ) {

                    console.log(
                        "[TREND DETAIL KEY NODES EMPTY]",
                        trend.id
                    );

                    return;
                }


                const currentIndex =
                    keyNodes.findIndex(
                        (node) =>
                            node.node_id ===
                            selectedNodeId
                    );


                let nextIndex;


                /* =========================================
                   FIRST
                ========================================= */

                if (
                    type === "FIRST_NODE"
                ) {

                    nextIndex = 0;
                }


                /* =========================================
                   NEXT
                ========================================= */

                else if (
                    type === "NEXT_NODE"
                ) {

                    if (
                        currentIndex === -1
                    ) {

                        nextIndex = 0;

                    } else {

                        nextIndex =
                            (
                                currentIndex + 1
                            )
                            %
                            keyNodes.length;
                    }
                }


                /* =========================================
                   PREVIOUS
                ========================================= */

                else {

                    if (
                        currentIndex === -1
                    ) {

                        nextIndex =
                            keyNodes.length - 1;

                    } else {

                        nextIndex =
                            (
                                currentIndex
                                - 1
                                + keyNodes.length
                            )
                            %
                            keyNodes.length;
                    }
                }


                const targetNode =
                    keyNodes[
                        nextIndex
                        ];


                if (!targetNode) {
                    return;
                }


                console.log(
                    "[TREND DETAIL VOICE SEQUENCE]",
                    type,
                    currentIndex,
                    "->",
                    nextIndex,
                    targetNode.name
                );


                setSelectedNodeId(
                    targetNode.node_id
                );

                return;
            }


            /* =============================================
               3. 특정 노드 직접 선택

               기존 기능 유지
            ============================================= */

            if (!nodeName) {
                return;
            }


            const normalizedTarget =
                String(nodeName)
                    .toLowerCase()
                    .replace(/\s+/g, "");


            const targetNode =
                graphNodes.find(
                    (node) =>
                        String(
                            node.name || ""
                        )
                            .toLowerCase()
                            .replace(/\s+/g, "")
                        === normalizedTarget
                );


            if (!targetNode) {

                console.log(
                    "[TREND DETAIL NODE NOT FOUND]",
                    nodeName
                );

                return;
            }


            console.log(
                "[TREND DETAIL VOICE SELECT]",
                trend?.id,
                targetNode.name
            );


            setSelectedNodeId(
                targetNode.node_id
            );
        }


        window.addEventListener(
            "trend-detail-voice-command",
            handleVoiceCommand
        );


        return () => {

            window.removeEventListener(
                "trend-detail-voice-command",
                handleVoiceCommand
            );
        };

    }, [
        graphNodes,
        trend,
        selectedNodeId,
    ]);

    const nodeMap =
        useMemo(
            () =>
                new Map(
                    graphNodes.map(
                        (node) => [
                            node.node_id,
                            node,
                        ]
                    )
                ),
            [
                graphNodes,
            ]
        );


    const stages =
        trend
            ? STAGE_PRESETS[
                trend.id
                ]
            : [];


    const selectedNode =
        nodeMap.get(
            selectedNodeId
        )
        || null;

    const selectedKeyMeta =
        getKeyNodeMeta(
            trend,
            selectedNode
        );

    /* =====================================================
   SELECTED NODE EVIDENCE LOAD
===================================================== */

    useEffect(
        () => {
            let cancelled =
                false;


            async function loadEvidence() {

                if (!selectedNode) {
                    setEvidenceData(null);
                    setEvidenceStatus("idle");
                    return;
                }


                try {
                    setEvidenceStatus(
                        "loading"
                    );


                    const result =
                        await getTrendFlowEvidence(
                            selectedNode.name
                        );


                    if (cancelled) {
                        return;
                    }


                    setEvidenceData(
                        result
                    );

                    setEvidenceStatus(
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Trend Evidence load error:",
                        error
                    );


                    if (!cancelled) {

                        setEvidenceData(
                            null
                        );

                        setEvidenceStatus(
                            "error"
                        );

                    }
                }
            }


            loadEvidence();


            return () => {
                cancelled =
                    true;
            };
        },
        [
            selectedNode,
        ]
    );


    /* =====================================================
       SELECTED RELATIONSHIPS
    ===================================================== */

    const selectedRelations =
        useMemo(
            () => {
                if (!selectedNodeId) {
                    return [];
                }


                return relationships
                    .filter(
                        (relationship) =>
                            relationship.source_id
                            === selectedNodeId

                            ||

                            relationship.target_id
                            === selectedNodeId
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                getRelationYear(a)
                                || 0
                            )
                            -
                            (
                                getRelationYear(b)
                                || 0
                            )
                    );
            },
            [
                selectedNodeId,
                relationships,
            ]
        );


    const simpleConnectedNodes = useMemo(() => {
        if (!selectedNode || selectedKeyMeta) return [];
        const names = [];
        selectedRelations.forEach((relationship) => {
            const otherId = relationship.source_id === selectedNode.node_id
                ? relationship.target_id
                : relationship.source_id;
            const otherNode = nodeMap.get(otherId);
            if (otherNode && !names.includes(otherNode.name)) names.push(otherNode.name);
        });
        return names.slice(0, 5);
    }, [selectedNode, selectedKeyMeta, selectedRelations, nodeMap]);

    function getSimpleNodeDescription(node) {
        const name = node?.name || "";
        const type = getNodeType(node);

        const trendSpecificDescriptions = {
            VELOUR: {
                "2000s":
                    "벨루어 트랙수트가 셀러브리티 일상복과 Y2K 스타일로 강하게 소비되던 과거 전성기를 표시하는 시기 노드입니다.",
                "Shinsegae International":
                    "국내 유통과 브랜드 재론칭 흐름을 연결하는 기업 노드입니다. 벨루어 트랙수트가 다시 시장에 노출되는 과정을 보조합니다.",
                "Korean Fashion Market":
                    "벨루어 트랙수트의 재등장이 국내 패션 시장과 소비 흐름 속에서 어떻게 받아들여지는지 연결하는 시장 노드입니다.",
            },

            UGG: {
                "Classic Mini II":
                    "UGG의 대표적인 클래식 미니 부츠 제품입니다. 재유행 과정에서도 브랜드의 기존 겨울 부츠 정체성이 유지되고 있음을 보여주는 보조 노드입니다.",
                "Disquette":
                    "슬리퍼와 플랫폼 형태를 결합한 UGG 제품입니다. 전통적인 부츠에서 실내외 겸용·캐주얼 형태로 제품군이 넓어지는 흐름을 보여줍니다.",
                "Aww Yeah":
                    "UGG가 겨울 부츠뿐 아니라 샌들·슬리퍼 계열로 확장되는 흐름을 보여주는 제품입니다. 2023년 젊은 소비층 반응과 함께 본격적인 계절 확장을 설명하는 보조 노드입니다.",
                "Y2K":
                    "2000년대 패션을 다시 소비하는 흐름을 설명하는 개념 노드입니다. 과거 UGG 이미지가 젊은 세대에게 다시 받아들여지는 배경을 연결합니다.",
                "Korean Fashion Market":
                    "UGG의 재유행이 실제 국내 판매와 소비 반응으로 이어지는지를 확인하기 위한 시장 노드입니다.",
                "Ozzie Clog":
                    "부츠가 아닌 클로그 형태로 확장된 UGG 제품입니다. UGG가 겨울 중심 브랜드에서 사계절 라이프스타일 브랜드로 이동하는 흐름을 보여줍니다.",
                "PeakMod Breed":
                    "UGG의 최근 제품 형태가 부츠 이외의 실루엣으로 넓어지는 흐름을 보여주는 제품 노드입니다.",
                "Shinsegae International":
                    "국내 UGG 유통과 판매 데이터를 연결하는 기업 노드입니다. 국내 소비 변화와 제품군 확장을 설명하는 근거 역할을 합니다.",
                "UGG":
                    "UGG 브랜드 노드입니다. 과거 겨울 부츠 이미지에서 젊은 소비층·남성·사계절 제품군으로 확장되는 여러 관계의 중심에 있습니다.",
                "UGG Boots":
                    "어그부츠 트렌드의 중심 스타일 노드입니다. 이 화면의 다른 노드들이 어떤 계기로 연결되는지 확인하는 기준점입니다.",
            },

            LOW_RISE: {
                "Crop Knit":
                    "짧은 니트 상의로, 낮아진 허리선과 함께 배 부분을 드러내 로우라이즈 특유의 비율을 강조하는 보조 스타일 노드입니다.",
                "Korean Fashion Market":
                    "해외 런웨이에서 시작된 로우라이즈 재등장이 국내 소비와 상품 흐름으로 이어지는지를 연결하는 시장 노드입니다.",
                "Low-Rise":
                    "허리선이 골반 가까이 내려오는 스타일입니다. 이 화면의 다른 노드들이 과거 유행부터 현재 재해석까지 어떻게 연결되는지 확인하는 중심 노드입니다.",
            },

            SKINNY: {
                "Slim Silhouette":
                    "스키니진 유행 초기에 강조된 좁고 길게 떨어지는 실루엣을 설명하는 스타일 노드입니다.",
                "Dior Homme AW05":
                    "2005년 Dior Homme 컬렉션으로, 초기 슬림 실루엣이 패션 흐름 속에서 강하게 제시된 시점을 보여주는 컬렉션 노드입니다.",
                "Gee":
                    "소녀시대의 2009년 활동 콘텐츠입니다. 컬러 스키니 스타일이 반복 노출되며 대중적으로 인지되는 과정을 연결합니다.",
                "컬러 스키니진":
                    "2009년 대중 확산 단계에서 눈에 띄게 소비된 스키니진 스타일입니다. 셀럽 노출과 실제 판매 반응 사이를 연결합니다.",
                "Wide-Leg Pants":
                    "스키니 중심 실루엣에서 더 여유 있는 바지 형태로 소비가 이동하는 전환을 보여주는 스타일 노드입니다.",
                "스키니 팬츠":
                    "스키니진과 연결되는 바지 스타일 노드입니다. 유행의 기본 실루엣과 이후 변화 과정을 설명하는 보조 역할을 합니다.",
                "2010년대 중반까지":
                    "스키니진이 장기간 대중적인 바지 실루엣으로 유지된 시기를 표시하는 기간 노드입니다.",
                "Cosmopolitan Korea":
                    "최근 슬림 실루엣과 스키니 관련 스타일을 다시 다루는 미디어 노드입니다.",
                "E-Land Magazine":
                    "최근 스키니·슬림 실루엣 관련 스타일 변화를 다루는 미디어 노드입니다.",
                "MIXXO":
                    "최근 슬림·부츠컷 계열 제품을 실제 상품으로 제안하는 브랜드 노드입니다.",
                "MIXXO Bootcut Denim":
                    "완전히 타이트한 과거 스키니가 아니라 부츠컷 요소를 섞어 재해석된 최근 제품 사례입니다.",
                "MIXXO Slim Straight Denim":
                    "과거 스키니보다 여유를 남긴 슬림 스트레이트 형태의 최근 제품 사례입니다.",
                "Skinny Revival Signal Korea":
                    "국내에서 스키니·슬림 실루엣이 다시 언급되는 흐름을 묶어 보여주는 개념 노드입니다.",
                "옥션":
                    "2009년 컬러 스키니진 판매 반응을 확인하는 시장·플랫폼 근거 노드입니다.",
                "2009 상반기 스키니진 열풍":
                    "소녀시대 활동과 판매 반응이 겹치며 스키니진이 대중적으로 확산된 시기를 요약하는 개념 노드입니다.",
                "소시지룩":
                    "당시 타이트한 하의 스타일을 대중적으로 표현하던 용어와 이미지를 연결하는 개념 노드입니다.",
            },
        };

        const specific =
            trendSpecificDescriptions[trend?.id]?.[name];

        if (specific) {
            return specific;
        }

        const descriptions = {
            Brand:
                "유행을 실제 상품과 캠페인으로 연결하는 브랜드 노드입니다.",
            Company:
                "브랜드 운영·유통·판매 흐름을 연결하는 기업 노드입니다.",
            Product:
                "유행이 실제 제품 형태로 구현되는 모습을 보여주는 제품 노드입니다.",
            Collection:
                "특정 시즌에 제안된 스타일과 제품을 보여주는 컬렉션 노드입니다.",
            Celebrity:
                "셀럽의 착용과 노출을 통해 유행이 대중에게 전달되는 과정을 보여주는 인물 노드입니다.",
            Designer:
                "스타일의 등장과 변화에 영향을 주는 디자이너 노드입니다.",
            Actor:
                "콘텐츠 속 착용과 반복 노출을 통해 유행 이미지를 전달하는 인물 노드입니다.",
            ConsumerGroup:
                "유행이 실제 소비층으로 확산되는 과정을 보여주는 소비자 집단 노드입니다.",
            Media:
                "유행을 기사와 콘텐츠로 확산시키는 미디어 노드입니다.",
            Content:
                "유행이 대중에게 반복 노출되는 콘텐츠 노드입니다.",
            Style:
                "유행의 실루엣과 착장 형태가 어떻게 변화하는지 보여주는 스타일 노드입니다.",
            Concept:
                "유행의 배경이나 변화 의미를 설명하는 개념 노드입니다.",
            Period:
                "유행이 나타나고 지속된 시기를 설명하는 기간 노드입니다.",
            Market:
                "유행이 실제 판매와 소비 반응으로 이어지는지를 보여주는 시장 노드입니다.",
            Platform:
                "검색·판매 등 소비자 반응이 나타나는 플랫폼 노드입니다.",
        };

        return (
            descriptions[type]
            || `${trend.ko} 유행의 전체 흐름을 보조하는 연결 노드입니다.`
        );
    }


    /* =====================================================
       EVIDENCE RESOURCES
    ===================================================== */

    const selectedResources =
        useMemo(
            () => {

                const all =
                    [];


                selectedRelations.forEach(
                    (
                        relationship
                    ) => {

                        const resources =
                            getRelationResources(
                                relationship
                            );


                        resources.forEach(
                            (resource) => {

                                if (
                                    all.some(
                                        (item) =>
                                            item.url
                                            === resource.url
                                    )
                                ) {
                                    return;
                                }


                                all.push({
                                    ...resource,

                                    relationship:
                                    relationship.relationship,

                                    context:
                                    relationship.context,

                                    date:
                                        relationship.date
                                        || relationship.year
                                        || null,
                                });

                            }
                        );

                    }
                );


                return all;
            },
            [
                selectedRelations,
            ]
        );


    /* =====================================================
       STAGE COUNT
    ===================================================== */

    const stageCounts =
        useMemo(
            () => {
                const result = {};


                stages.forEach(
                    (stage) => {
                        result[
                            stage.key
                            ] = 0;
                    }
                );


                graphNodes.forEach(
                    (node) => {

                        if (
                            node.isCenter
                        ) {
                            return;
                        }


                        const stage =
                            node.stage
                            || getStageOverride(
                                trend,
                                node,
                                stages
                            )
                            || findStage(
                                node.year,
                                stages
                            );


                        result[
                            stage.key
                            ] =
                            (
                                result[
                                    stage.key
                                    ]
                                || 0
                            ) + 1;

                    }
                );


                return result;
            },
            [
                graphNodes,
                stages,
                trend,
            ]
        );


    /* =====================================================
       PRESENTATION STORY
       1-hop + 2-hop 중 핵심 3단계만 표시
    ===================================================== */

    const presentationStory =
        useMemo(
            () =>
                buildPresentationStory(
                    evidenceData?.evidence || []
                ),
            [evidenceData]
        );


    const metricEvidence =
        useMemo(
            () =>
                [...(
                    evidenceData?.evidence
                    || []
                )]
                    .filter(
                        hasMetricEvidence
                    )
                    .sort(
                        (a, b) =>
                            evidenceQuality(b)
                            - evidenceQuality(a)
                    )[0]
                || null,
            [evidenceData]
        );


    const selectedVisual =
        useMemo(
            () =>
                getEvidenceImage(
                    selectedNode,
                    evidenceData?.evidence
                    || [],
                    trend?.id
                ),
            [
                selectedNode,
                evidenceData,
            ]
        );


    if (!trend) {
        return (
            <div className="detail-not-found">
                존재하지 않는 패션입니다.
            </div>
        );
    }


    /* =====================================================
       FOCUS
    ===================================================== */

    function relationFocused(
        relationship
    ) {
        if (!selectedNodeId) {
            return false;
        }


        return (
            relationship.source_id
            === selectedNodeId

            ||

            relationship.target_id
            === selectedNodeId
        );
    }


    function nodeFocused(
        nodeId
    ) {
        if (!selectedNodeId) {
            return true;
        }


        if (
            nodeId
            === selectedNodeId
        ) {
            return true;
        }


        return relationships.some(
            (relationship) => {

                if (
                    relationship.source_id
                    === selectedNodeId
                ) {
                    return (
                        relationship.target_id
                        === nodeId
                    );
                }


                if (
                    relationship.target_id
                    === selectedNodeId
                ) {
                    return (
                        relationship.source_id
                        === nodeId
                    );
                }


                return false;
            }
        );
    }


    return (
        <main
            className="trend-detail-page"
            style={{
                "--trend-color":
                trend.color,
            }}
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="trend-detail-header">

                <div className="detail-page-title">

                    <span>
                        08 · TREND NETWORK
                    </span>

                    <strong>
                        {
                            trend.ko
                        }
                    </strong>

                    <small>
                        {
                            trend.en
                        }
                    </small>

                </div>


                <button
                    type="button"
                    className="overview-back"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        navigate("/trend-flow");
                    }}
                >
                    <ArrowLeft size={16} />
                    TREND FLOW
                </button>

            </header>


            <section className="trend-detail-layout">

                {/* =================================================
                    GRAPH
                ================================================= */}

                <article className="detail-graph-panel">

                    <div className="detail-graph-top">

                        <div className="detail-graph-heading">

                            <strong>
                                TREND RELATIONSHIP
                            </strong>

                            <span>
                                시간 흐름에 따라 실제 Neo4j 관계를 탐색합니다.
                            </span>

                        </div>


                        <div className="detail-legend">

                            <span className="legend-person">
                                PERSON
                            </span>

                            <span className="legend-brand">
                                BRAND
                            </span>

                            <span className="legend-media">
                                MEDIA
                            </span>

                            <span className="legend-style">
                                STYLE
                            </span>

                            <span className="legend-concept">
                                CONCEPT
                            </span>

                            <span className="legend-product">
                                PRODUCT
                            </span>

                        </div>


                        <div className="detail-zoom">

                            <button
                                type="button"
                                onClick={() =>
                                    setZoom(
                                        (value) =>
                                            Math.max(
                                                0.75,
                                                value - 0.1
                                            )
                                    )
                                }
                            >
                                <Minus
                                    size={13}
                                />
                            </button>


                            <span>
                                {
                                    Math.round(
                                        zoom * 100
                                    )
                                }%
                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    setZoom(
                                        (value) =>
                                            Math.min(
                                                1.45,
                                                value + 0.1
                                            )
                                    )
                                }
                            >
                                <Plus
                                    size={13}
                                />
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setZoom(1)
                                }
                            >
                                <Maximize2
                                    size={13}
                                />
                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        TIMELINE
                    ================================================= */}

                    <div className="stage-timeline">

                        <div className="stage-timeline-start">
                            TREND
                        </div>


                        <div className="stage-timeline-line" />


                        {stages.map(
                            (stage) => (

                                <div
                                    key={
                                        stage.key
                                    }
                                    className="stage-heading"
                                    style={{
                                        left:
                                            `${stage.x}%`,
                                    }}
                                >

                                    <strong>
                                        {
                                            stage.key
                                        }
                                    </strong>

                                    <span>
                                        {
                                            stage.label
                                        }
                                    </span>

                                </div>

                            )
                        )}


                        <span className="stage-arrow">
                            →
                        </span>

                    </div>


                    {/* =================================================
                        GRAPH CANVAS
                    ================================================= */}

                    <div
                        className="detail-graph-canvas"
                        onClick={() =>
                            setSelectedNodeId(
                                null
                            )
                        }
                    >

                        {stages.map(
                            (stage) => (

                                <div
                                    key={
                                        `guide-${stage.key}`
                                    }
                                    className="stage-column-guide"
                                    style={{
                                        left:
                                            `${stage.x}%`,
                                    }}
                                />

                            )
                        )}


                        <div
                            className="detail-graph-transform"
                            style={{
                                transform:
                                    `scale(${zoom})`,
                            }}
                        >

                            {/* EDGES */}

                            <svg
                                className="detail-edge-layer"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >

                                <defs>

                                    <marker
                                        id="detail-arrow"
                                        markerWidth="5"
                                        markerHeight="5"
                                        refX="4"
                                        refY="2.5"
                                        orient="auto"
                                    >
                                        <path
                                            d="M0,0 L5,2.5 L0,5 Z"
                                            fill="currentColor"
                                        />
                                    </marker>

                                </defs>


                                {relationships.map(
                                    (
                                        relationship,
                                        index
                                    ) => {

                                        const source =
                                            nodeMap.get(
                                                relationship.source_id
                                            );


                                        const target =
                                            nodeMap.get(
                                                relationship.target_id
                                            );


                                        if (
                                            !source
                                            || !target
                                        ) {
                                            return null;
                                        }


                                        const focused =
                                            relationFocused(
                                                relationship
                                            );


                                        const primary =
                                            PRIMARY_RELATIONS.has(
                                                relationship.relationship
                                            );


                                        return (
                                            <line
                                                key={
                                                    `${relationship.source_id}-${relationship.target_id}-${index}`
                                                }

                                                x1={
                                                    source.x
                                                }

                                                y1={
                                                    source.y
                                                }

                                                x2={
                                                    target.x
                                                }

                                                y2={
                                                    target.y
                                                }

                                                className={[
                                                    "detail-edge",

                                                    primary
                                                    && !selectedNodeId
                                                        ? "primary"
                                                        : "",

                                                    focused
                                                        ? "selected"
                                                        : "",

                                                    selectedNodeId
                                                    && !focused
                                                        ? "muted"
                                                        : "",
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(" ")
                                                }

                                                markerEnd={
                                                    focused
                                                        ? "url(#detail-arrow)"
                                                        : undefined
                                                }
                                            />
                                        );

                                    }
                                )}

                            </svg>


                            {/* RELATIONSHIP LABELS */}

                            <div className="detail-edge-label-layer">

                                {relationships.map(
                                    (
                                        relationship,
                                        index
                                    ) => {

                                        const source =
                                            nodeMap.get(
                                                relationship.source_id
                                            );


                                        const target =
                                            nodeMap.get(
                                                relationship.target_id
                                            );


                                        if (
                                            !source
                                            || !target
                                        ) {
                                            return null;
                                        }


                                        const focused =
                                            relationFocused(
                                                relationship
                                            );


                                        const primary =
                                            PRIMARY_RELATIONS.has(
                                                relationship.relationship
                                            );


                                        if (
                                            selectedNodeId
                                            && !focused
                                        ) {
                                            return null;
                                        }


                                        if (
                                            !selectedNodeId
                                            && !primary
                                        ) {
                                            return null;
                                        }


                                        return (
                                            <span
                                                key={
                                                    `relationship-label-${index}`
                                                }

                                                className={
                                                    focused
                                                        ? "detail-edge-label selected"
                                                        : "detail-edge-label"
                                                }

                                                style={{
                                                    left:
                                                        `${(
                                                            source.x
                                                            + target.x
                                                        ) / 2}%`,

                                                    top:
                                                        `${(
                                                            source.y
                                                            + target.y
                                                        ) / 2}%`,
                                                }}
                                            >
                                                {
                                                    relationship.relationship
                                                }
                                            </span>
                                        );

                                    }
                                )}

                            </div>


                            {/* NODES */}

                            {graphNodes.map(
                                (node) => {

                                    const selected =
                                        selectedNodeId
                                        === node.node_id;


                                    const focused =
                                        nodeFocused(
                                            node.node_id
                                        );


                                    const keyMeta =
                                        getKeyNodeMeta(
                                            trend,
                                            node
                                        );


                                    const isKeyNode =
                                        Boolean(
                                            keyMeta
                                        );


                                    return (
                                        <button
                                            key={
                                                node.node_id
                                            }

                                            type="button"

                                            className={[
                                                "detail-graph-node",

                                                `group-${node.visualGroup}`,

                                                node.isCenter
                                                    ? "center"
                                                    : "",

                                                isKeyNode
                                                    ? "key-node"
                                                    : "",

                                                isKeyNode
                                                    ? `key-phase-${keyMeta.phase.toLowerCase()}`
                                                    : "",

                                                selected
                                                    ? "selected"
                                                    : "",

                                                !focused
                                                    ? "dimmed"
                                                    : "",
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(" ")
                                            }

                                            style={{
                                                left:
                                                    `${node.x}%`,

                                                top:
                                                    `${node.y}%`,
                                            }}

                                            onClick={
                                                (
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    setSelectedNodeId(
                                                        node.node_id
                                                    );
                                                }
                                            }
                                        >

                                            <span className="graph-node-circle">

                                                {node.isCenter && (

                                                    <TrendCenterIcon
                                                        trendId={
                                                            trend.id
                                                        }
                                                    />

                                                )}

                                            </span>


                                            <strong>
                                                {
                                                    node.name
                                                }
                                            </strong>

                                            {isKeyNode && (
                                                <span className="key-node-phase">
                                                    {keyMeta.label}
                                                </span>
                                            )}



                                            <small>
                                                {
                                                    getNodeType(
                                                        node
                                                    )
                                                }
                                            </small>


                                            {!node.isCenter
                                                && node.year && (

                                                    <em>
                                                        {
                                                            Math.round(
                                                                node.year
                                                            )
                                                        }
                                                    </em>

                                                )}

                                        </button>
                                    );

                                }
                            )}

                        </div>

                    </div>


                    <footer className="detail-graph-footer">

                        <span>
                            <strong>
                                {
                                    nodes.length
                                }
                            </strong>

                            {" "}NODES
                        </span>


                        <span>
                            <strong>
                                {
                                    relationships.length
                                }
                            </strong>

                            {" "}RELATIONSHIPS
                        </span>


                        <span>
                            연도 → 흐름
                        </span>


                        <span>
                            Node 클릭 → Evidence 탐색
                        </span>

                    </footer>

                </article>


                {/* =================================================
                    RIGHT EVIDENCE PANEL
                    발표용: 시각자료 + 핵심 근거, 외부 이동 없음
                ================================================= */}

                <aside className="detail-inspector">

                    {selectedNode ? (

                        selectedKeyMeta ? (

                            <div
                                className="evidence-panel presentation-evidence-panel no-scroll-evidence v3-panel"
                                style={
                                    (trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE")
                                        ? {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            height: "100%",
                                            minHeight: 0,
                                            overflow: "hidden",
                                        }
                                        : undefined
                                }
                            >

                                {/* =================================================
                                1. HEADER
                            ================================================= */}
                                <div className="v3-header">

                                    <div className="inspector-node-header presentation-node-header">
                                    <span
                                        className={
                                            `inspector-node-dot group-${getVisualGroup(
                                                selectedNode
                                            )}`
                                        }
                                    />

                                        <div>
                                            <h2>
                                                {selectedNode.name}
                                            </h2>

                                            <p className="inspector-type">
                                                {getNodeType(selectedNode)}
                                            </p>
                                        </div>
                                    </div>

                                </div>


                                {/* =================================================
                                2. PHASE + WHY
                                잘리지 않는 짧은 설명
                            ================================================= */}
                                {selectedKeyMeta && (
                                    <section
                                        className="v3-context-card"
                                        style={
                                            (trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE")
                                                ? {
                                                    flex: "0 0 auto",
                                                    minHeight: 0,
                                                    height: "auto",
                                                    overflow: "hidden",
                                                }
                                                : undefined
                                        }
                                    >

                                        <div className="v3-context-top v3-context-top-clean">

                                            <strong>
                                                {selectedKeyMeta.yearLabel}
                                                {" · "}
                                                {selectedKeyMeta.label}
                                            </strong>

                                        </div>


                                        <p className="v3-meaning">
                                            {selectedKeyMeta.meaning}
                                        </p>


                                        {selectedKeyMeta.why && (
                                            <div className="v3-why">

                                                <strong className="v3-why-title">
                                                    변화의 이유
                                                </strong>

                                                <strong>
                                                    {selectedKeyMeta.why}
                                                </strong>

                                            </div>
                                        )}

                                    </section>
                                )}


                                {/* =================================================
                                3. VISUAL EVIDENCE
                                노드별로 가장 알맞은 시각 자료 표시
                            ================================================= */}
                                {selectedVisual ? (

                                    <section
                                        className="v3-visual-card"
                                        style={
                                            (trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE")
                                                ? {
                                                    flex: "0 0 auto",
                                                    height: "auto",
                                                    minHeight: 0,
                                                    maxHeight: "none",
                                                    overflow: "hidden",
                                                }
                                                : undefined
                                        }
                                    >

                                        {/* ---------------- HEDI / 일반 Focus ---------------- */}
                                        {selectedVisual.mode === "focus" && (
                                            (trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE") ? (

                                                <div
                                                    className="v3-velour-focus-visual"
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        overflow: "visible",
                                                        borderRadius: "12px",
                                                        minHeight: "0",
                                                        height: "auto",
                                                    }}
                                                >

                                                    <div
                                                        className="v3-velour-focus-image"
                                                        style={{
                                                            width: "100%",
                                                            height: "190px",
                                                            overflow: "hidden",
                                                            background: "#0b1018",
                                                        }}
                                                    >
                                                        <img
                                                            src={selectedVisual.imageUrl}
                                                            alt={selectedVisual.caption}
                                                            loading="eager"
                                                            onError={(event) => {
                                                                if (
                                                                    selectedVisual.fallbackImageUrl
                                                                ) {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src =
                                                                        selectedVisual.fallbackImageUrl;
                                                                }
                                                            }}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                display: "block",
                                                                objectFit:
                                                                    selectedVisual.fit
                                                                    || "cover",
                                                                objectPosition:
                                                                    selectedVisual.objectPosition
                                                                    || "center",
                                                            }}
                                                        />
                                                    </div>

                                                    <div
                                                        className="v3-velour-focus-copy"
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns: "82px 1fr",
                                                            gap: "8px 12px",
                                                            alignItems: "start",
                                                            padding: "10px 12px 11px",
                                                            background: "rgba(15, 22, 34, 0.96)",
                                                            minHeight: 0,
                                                            height: "auto",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: trend.id === "LOW_RISE" ? "#84e25b" : "#ff67ae",
                                                                fontSize: "11px",
                                                                fontWeight: 800,
                                                                letterSpacing: "0.08em",
                                                            }}
                                                        >
                                                            시각 포인트
                                                        </span>

                                                        <strong
                                                            style={{
                                                                color: "#ffffff",
                                                                fontSize: "15px",
                                                                lineHeight: 1.45,
                                                                whiteSpace: "normal",
                                                                wordBreak: "keep-all",
                                                                overflow: "visible",
                                                            }}
                                                        >
                                                            {
                                                                selectedVisual.focusLabel
                                                                || selectedVisual.caption
                                                            }
                                                        </strong>

                                                        <span
                                                            style={{
                                                                color: "#8ea0ba",
                                                                fontSize: "10px",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            사진 설명
                                                        </span>

                                                        <small
                                                            style={{
                                                                color: "#b7c3d4",
                                                                fontSize: "11px",
                                                                lineHeight: 1.35,
                                                                whiteSpace: "normal",
                                                                wordBreak: "keep-all",
                                                                overflow: "visible",
                                                            }}
                                                        >
                                                            {selectedVisual.caption}
                                                        </small>
                                                    </div>

                                                </div>

                                            ) : (

                                                <div className="v3-focus-visual">

                                                    <div className="v3-focus-image">
                                                        <img
                                                            src={selectedVisual.imageUrl}
                                                            alt={selectedVisual.caption}
                                                            loading="eager"
                                                            onError={(event) => {
                                                                if (
                                                                    selectedVisual.fallbackImageUrl
                                                                ) {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src =
                                                                        selectedVisual.fallbackImageUrl;
                                                                }
                                                            }}
                                                            style={{
                                                                objectFit:
                                                                    selectedVisual.fit
                                                                    || "cover",

                                                                objectPosition:
                                                                    selectedVisual.objectPosition
                                                                    || "center",
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="v3-focus-copy">
                                                    <span>
                                                        시각 포인트
                                                    </span>

                                                        <strong>
                                                            {
                                                                selectedVisual.focusLabel
                                                                || selectedVisual.caption
                                                            }
                                                        </strong>

                                                        <small>
                                                            {selectedVisual.source}
                                                        </small>
                                                    </div>

                                                </div>

                                            )
                                        )}



                                        {/* ---------------- UGG : 소연 ---------------- */}
                                        {selectedVisual.mode === "uggPortrait" && (
                                            <div className="v3-ugg-portrait">

                                                <div className="v3-ugg-portrait-image">
                                                    <img
                                                        src={selectedVisual.imageUrl}
                                                        alt={selectedVisual.caption}
                                                        loading="eager"
                                                        onError={(event) => {
                                                            if (
                                                                selectedVisual.fallbackImageUrl
                                                            ) {
                                                                event.currentTarget.onerror = null;
                                                                event.currentTarget.src =
                                                                    selectedVisual.fallbackImageUrl;
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div className="v3-ugg-portrait-copy">
                                                <span>
                                                    {selectedVisual.imageLabel}
                                                </span>

                                                    <strong>
                                                        {selectedVisual.visualNote}
                                                    </strong>

                                                    <small>
                                                        {selectedVisual.source}
                                                    </small>
                                                </div>

                                            </div>
                                        )}


                                        {/* ---------------- UGG : 연준 + 남성 제품 ---------------- */}
                                        {selectedVisual.mode === "uggYeonjunCompare" && (
                                            <div className="v3-ugg-yeonjun-compare">

                                                <div className="v3-ugg-yeonjun-visuals">

                                                    <div className="v3-ugg-yeonjun-person">
                                                        <img
                                                            src={selectedVisual.imageUrl}
                                                            alt={selectedVisual.caption}
                                                            loading="eager"
                                                            onError={(event) => {
                                                                if (
                                                                    selectedVisual.fallbackImageUrl
                                                                ) {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src =
                                                                        selectedVisual.fallbackImageUrl;
                                                                }
                                                            }}
                                                        />

                                                        <span>
                                                        {selectedVisual.caption}
                                                    </span>
                                                    </div>

                                                    <div className="v3-ugg-yeonjun-product">
                                                        <img
                                                            src={selectedVisual.productImageUrl}
                                                            alt={selectedVisual.productLabel}
                                                            loading="eager"
                                                        />

                                                        <span>
                                                        {selectedVisual.productLabel}
                                                    </span>
                                                    </div>

                                                </div>

                                                <div className="v3-ugg-yeonjun-copy">

                                                    {selectedVisual.lines.map(
                                                        (line) => (
                                                            <p key={line}>
                                                                {line}
                                                            </p>
                                                        )
                                                    )}

                                                    <small>
                                                        {selectedVisual.source}
                                                    </small>

                                                </div>

                                            </div>
                                        )}


                                        {/* ---------------- UGG : 사계절 비교 ---------------- */}
                                        {selectedVisual.mode === "uggSeasonCompare" && (
                                            <div className="v3-ugg-season">

                                                <div className="v3-ugg-season-images">

                                                    <div>
                                                        <img
                                                            src={
                                                                selectedVisual.winterImageUrl
                                                            }
                                                            alt={
                                                                selectedVisual.winterLabel
                                                            }
                                                            loading="eager"
                                                            onError={(event) => {
                                                                event.currentTarget.onerror = null;
                                                                event.currentTarget.src =
                                                                    "https://www.cosmopolitan.co.kr/resources/online/online_image/2025/11/25/ddfac439-9f87-48eb-8f0e-0d97a3c350ea.jpeg";
                                                            }}
                                                        />
                                                    </div>

                                                    <i>
                                                        →
                                                    </i>

                                                    <div>
                                                        <img
                                                            src={
                                                                selectedVisual.summerImageUrl
                                                            }
                                                            alt={
                                                                selectedVisual.summerLabel
                                                            }
                                                            loading="eager"
                                                            onError={(event) => {
                                                                if (
                                                                    selectedVisual.summerFallbackUrl
                                                                ) {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src =
                                                                        selectedVisual.summerFallbackUrl;
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                </div>

                                                <div className="v3-ugg-season-labels">
                                                    <strong>
                                                        {
                                                            selectedVisual.winterLabel
                                                        }
                                                    </strong>

                                                    <strong>
                                                        {
                                                            selectedVisual.summerLabel
                                                        }
                                                    </strong>
                                                </div>

                                                <p>
                                                    {
                                                        selectedVisual.transformNote
                                                    }
                                                </p>

                                            </div>
                                        )}


                                        {/* ---------------- LOW-RISE : 국내 소비 확산 ---------------- */}
                                        {selectedVisual.mode === "lowRiseMarket" && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "10px",
                                                    padding: "12px",
                                                    background: "rgba(12,18,27,.96)",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr auto 1fr",
                                                        alignItems: "stretch",
                                                        gap: "9px",
                                                    }}
                                                >
                                                    {(selectedVisual.stats ?? []).map((stat, index) => (
                                                        <React.Fragment key={stat.label}>
                                                            <div
                                                                style={{
                                                                    minHeight: "108px",
                                                                    padding: "11px",
                                                                    borderRadius: "10px",
                                                                    border: "1px solid rgba(132,226,91,.38)",
                                                                    background: "rgba(132,226,91,.055)",
                                                                }}
                                                            >
                                                                <span style={{ color: "#84e25b", fontSize: "10px", fontWeight: 900 }}>
                                                                    {stat.label}
                                                                </span>
                                                                <strong style={{ display: "block", marginTop: "4px", color: "#fff", fontSize: "24px", lineHeight: 1 }}>
                                                                    {stat.value}
                                                                </strong>
                                                                <p style={{ margin: "7px 0 0", color: "#b8c5d6", fontSize: "11px", lineHeight: 1.4, wordBreak: "keep-all" }}>
                                                                    {stat.text}
                                                                </p>
                                                            </div>
                                                            {index === 0 && (
                                                                <div style={{ display: "flex", alignItems: "center", color: "#84e25b", fontSize: "22px", fontWeight: 900 }}>→</div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                    {(selectedVisual.keywords ?? []).map((keyword) => (
                                                        <span
                                                            key={keyword}
                                                            style={{
                                                                padding: "5px 8px",
                                                                borderRadius: "999px",
                                                                border: "1px solid rgba(132,226,91,.3)",
                                                                background: "rgba(132,226,91,.05)",
                                                                color: "#dce7f3",
                                                                fontSize: "10px",
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div
                                                    style={{
                                                        padding: "10px 12px",
                                                        borderRadius: "9px",
                                                        background: "rgba(132,226,91,.08)",
                                                        border: "1px solid rgba(132,226,91,.24)",
                                                    }}
                                                >
                                                    <span style={{ color: "#84e25b", fontSize: "10px", fontWeight: 900 }}>소비 확산 포인트</span>
                                                    <strong style={{ display: "block", marginTop: "4px", color: "#fff", fontSize: "13px", lineHeight: 1.4 }}>
                                                        {selectedVisual.focusLabel}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}


                                        {/* ---------------- 소녀시대 : 사진만 ---------------- */}
                                        {selectedVisual.mode === "photoChart" && (
                                            <div className="v3-photo-only">

                                                <div className="v3-photo-only-image">
                                                    <img
                                                        src={selectedVisual.imageUrl}
                                                        alt={selectedVisual.caption}
                                                        loading="eager"
                                                    />

                                                    <span>
                                                    {selectedVisual.caption}
                                                </span>
                                                </div>

                                            </div>
                                        )}


                                        {/* ---------------- SPAO : 전환 이유 + 수치 ---------------- */}
                                        {selectedVisual.mode === "shift" && (
                                            <div className="v3-shift-visual">

                                                <div className="v3-shift-image">
                                                    <img
                                                        src={selectedVisual.imageUrl}
                                                        alt={selectedVisual.caption}
                                                        loading="eager"
                                                    />
                                                </div>


                                                <div className="v3-shift-data">

                                                <span className="v3-shift-eyebrow">
                                                    왜 바뀌었을까?
                                                </span>


                                                    <div className="v3-driver-list">
                                                        {selectedVisual.drivers.map(
                                                            (driver) => (
                                                                <span key={driver}>
                                                                {driver}
                                                            </span>
                                                            )
                                                        )}
                                                    </div>


                                                    <div className="v3-shift-stat">

                                                        <small>
                                                            {
                                                                selectedVisual.statLabel
                                                            }
                                                        </small>

                                                        <div className="v3-shift-stat-numbers">
                                                            <strong>
                                                                {
                                                                    selectedVisual.statPrimary
                                                                }
                                                            </strong>

                                                            <em>
                                                                {
                                                                    selectedVisual.statSecondary
                                                                }
                                                            </em>
                                                        </div>

                                                        <p className="v3-shift-chart-note">
                                                            하단 DATA SIGNAL에서 판매 변화를 그래프로 비교
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>
                                        )}


                                        {/* ---------------- 코르티스 : 실제 착장 + 미디어 반응 ---------------- */}
                                        {selectedVisual.mode === "gallery" && (
                                            <div className="v3-gallery-visual">

                                                <div className="v3-gallery-images">

                                                    {selectedVisual.galleryImages.map(
                                                        (imageUrl, index) => (

                                                            <img
                                                                src={imageUrl}
                                                                alt={
                                                                    `${selectedNode.name} skinny styling ${index + 1}`
                                                                }
                                                                loading="eager"
                                                                key={imageUrl}
                                                            />

                                                        )
                                                    )}

                                                </div>


                                                <div className="v3-media-signal">

                                                <span>
                                                    {
                                                        selectedVisual.signalTag
                                                        || "MEDIA SIGNAL"
                                                    }
                                                </span>

                                                    <strong>
                                                        {
                                                            selectedVisual.mediaSignal
                                                        }
                                                    </strong>

                                                </div>

                                            </div>
                                        )}


                                        {/* ---------------- Modern Slim : 과거 vs 현재 + 조합 ---------------- */}
                                        {selectedVisual.mode === "compare" && (
                                            (trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE") ? (

                                                <div
                                                    className="v3-velour-compare"
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                        padding: "9px 10px 10px",
                                                        minHeight: "0",
                                                        height: "auto",
                                                        overflow: "hidden",
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns: "1fr 34px 1fr",
                                                            gap: "8px",
                                                            alignItems: "center",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: "7px",
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    height: "175px",
                                                                    borderRadius: "10px",
                                                                    overflow: "hidden",
                                                                    background: "#0b1018",
                                                                    border: "1px solid rgba(255,255,255,.08)",
                                                                }}
                                                            >
                                                                <img
                                                                    src={selectedVisual.compareImageUrl}
                                                                    alt={selectedVisual.compareLabel}
                                                                    loading="eager"
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        display: "block",
                                                                        objectFit: selectedVisual.compareFit || "cover",
                                                                        objectPosition: selectedVisual.compareObjectPosition || "center",
                                                                    }}
                                                                />
                                                            </div>

                                                            <strong
                                                                style={{
                                                                    color: "#ffffff",
                                                                    fontSize: "13px",
                                                                    lineHeight: 1.3,
                                                                    textAlign: "center",
                                                                    minHeight: "30px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    padding: "0 4px",
                                                                    overflow: "visible",
                                                                    whiteSpace: "normal",
                                                                    wordBreak: "keep-all",
                                                                }}
                                                            >
                                                                {selectedVisual.compareLabel}
                                                            </strong>
                                                        </div>


                                                        <i
                                                            style={{
                                                                color: trend.id === "LOW_RISE" ? "#84e25b" : "#ff67ae",
                                                                fontSize: "24px",
                                                                fontStyle: "normal",
                                                                fontWeight: 900,
                                                                textAlign: "center",
                                                            }}
                                                        >
                                                            →
                                                        </i>


                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: "7px",
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    height: "175px",
                                                                    borderRadius: "10px",
                                                                    overflow: "hidden",
                                                                    background: "#0b1018",
                                                                    border: "1px solid rgba(255,255,255,.08)",
                                                                }}
                                                            >
                                                                <img
                                                                    src={selectedVisual.imageUrl}
                                                                    alt={selectedVisual.primaryLabel}
                                                                    loading="eager"
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        display: "block",
                                                                        objectFit: selectedVisual.fit || "cover",
                                                                        objectPosition: selectedVisual.objectPosition || "center",
                                                                    }}
                                                                />
                                                            </div>

                                                            <strong
                                                                style={{
                                                                    color: "#ffffff",
                                                                    fontSize: "13px",
                                                                    lineHeight: 1.3,
                                                                    textAlign: "center",
                                                                    minHeight: "30px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    padding: "0 4px",
                                                                    overflow: "visible",
                                                                    whiteSpace: "normal",
                                                                    wordBreak: "keep-all",
                                                                }}
                                                            >
                                                                {selectedVisual.primaryLabel}
                                                            </strong>
                                                        </div>

                                                    </div>


                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "8px",
                                                            overflow: "visible",
                                                            minHeight: 0,
                                                        }}
                                                    >
                                                        {selectedVisual.styleSignals.map(
                                                            (signal) => (
                                                                <span
                                                                    key={signal}
                                                                    style={{
                                                                        padding: "6px 9px",
                                                                        borderRadius: "999px",
                                                                        border: trend.id === "LOW_RISE" ? "1px solid rgba(132,226,91,.42)" : "1px solid rgba(255,103,174,.38)",
                                                                        color: trend.id === "LOW_RISE" ? "#dfffd2" : "#ffd7ea",
                                                                        fontSize: "11px",
                                                                        fontWeight: 800,
                                                                        background: trend.id === "LOW_RISE" ? "rgba(132,226,91,.07)" : "rgba(255,103,174,.07)",
                                                                        whiteSpace: "normal",
                                                                        lineHeight: 1.25,
                                                                    }}
                                                                >
                                                                    {signal}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>


                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            marginTop: "2px",
                                                            padding: "8px 10px",
                                                            borderRadius: "9px",
                                                            background: "rgba(255,255,255,.035)",
                                                            color: "#e8eef7",
                                                            fontSize: "12px",
                                                            lineHeight: 1.4,
                                                            minHeight: "0",
                                                            overflow: "visible",
                                                            whiteSpace: "normal",
                                                            wordBreak: "keep-all",
                                                        }}
                                                    >
                                                        {selectedVisual.transformNote}
                                                    </p>

                                                </div>

                                            ) : (

                                                <div className="v3-modern-visual">

                                                    <div className="v3-modern-compare">

                                                        <div>
                                                            <img
                                                                src={
                                                                    selectedVisual.compareImageUrl
                                                                }
                                                                alt={
                                                                    selectedVisual.compareLabel
                                                                }
                                                                loading="eager"
                                                            />

                                                            <span>
                                                            {
                                                                selectedVisual.compareLabel
                                                            }
                                                        </span>
                                                        </div>


                                                        <i>
                                                            →
                                                        </i>


                                                        <div>
                                                            <img
                                                                src={
                                                                    selectedVisual.imageUrl
                                                                }
                                                                alt={
                                                                    selectedVisual.primaryLabel
                                                                }
                                                                loading="eager"
                                                            />

                                                            <span>
                                                            {
                                                                selectedVisual.primaryLabel
                                                            }
                                                        </span>
                                                        </div>

                                                    </div>


                                                    <div className="v3-style-signals">

                                                        {selectedVisual.styleSignals.map(
                                                            (signal) => (
                                                                <span key={signal}>
                                                                {signal}
                                                            </span>
                                                            )
                                                        )}

                                                    </div>


                                                    <p>
                                                        {
                                                            selectedVisual.transformNote
                                                        }
                                                    </p>

                                                </div>

                                            )
                                        )}


                                        {/* ---------------- mode 없는 일반 이미지 ---------------- */}
                                        {!selectedVisual.mode && (
                                            <div className="v3-basic-image">
                                                <img
                                                    src={selectedVisual.imageUrl}
                                                    alt={selectedVisual.caption}
                                                    loading="eager"
                                                />

                                                <strong>
                                                    {selectedVisual.caption}
                                                </strong>
                                            </div>
                                        )}


                                        <footer className="v3-visual-source">
                                        <span>
                                            {(trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE")
                                                ? "시각 자료"
                                                : "VISUAL EVIDENCE"
                                            }
                                        </span>

                                            <small>
                                                {(trend.id === "VELOUR" || trend.id === "LOW_RISE" || trend.id === "DUFFLE")
                                                    ? "자료 · "
                                                    : "SOURCE · "
                                                }
                                                {
                                                    selectedVisual.source
                                                    || "Graph evidence"
                                                }
                                            </small>
                                        </footer>

                                    </section>

                                ) : (

                                    <section className="v3-visual-card v3-no-image">

                                    <span>
                                        GRAPH EVIDENCE
                                    </span>

                                        <strong>
                                            {selectedNode.name}
                                        </strong>

                                        <p>
                                            {
                                                presentationStory[0]
                                                    ? getEvidenceFlowText(
                                                        presentationStory[0]
                                                    )
                                                    : trend.ko
                                            }
                                        </p>

                                    </section>

                                )}


                                {/* =================================================
                                4. FLOW SUMMARY
                                여러 카드가 아니라 박스 하나에 전체 흐름 표시
                            ================================================= */}
                                {trend.id !== "UGG"
                                    && trend.id !== "VELOUR"
                                    && trend.id !== "LOW_RISE"
                                    && trend.id !== "DUFFLE" && (
                                        <section className="v3-flow-summary">

                                            <div className="v3-flow-heading v3-flow-heading-clean">

                                                <strong>
                                                    핵심 관계
                                                </strong>

                                            </div>


                                            {evidenceStatus === "loading" && (
                                                <p className="v3-flow-message">
                                                    Evidence를 불러오는 중입니다.
                                                </p>
                                            )}


                                            {evidenceStatus === "error" && (
                                                <p className="v3-flow-message">
                                                    Evidence를 불러오지 못했습니다.
                                                </p>
                                            )}


                                            {evidenceStatus === "success"
                                                && presentationStory.length > 0 && (

                                                    <div className="v3-flow-routes">

                                                        {presentationStory
                                                            .slice(0, 3)
                                                            .map(
                                                                (evidence, index) => {

                                                                    const stage =
                                                                        getStoryStage(
                                                                            evidence
                                                                        );

                                                                    const meta =
                                                                        getStoryMeta(
                                                                            stage
                                                                        );

                                                                    return (
                                                                        <div
                                                                            className="v3-flow-route"
                                                                            key={
                                                                                `${evidence.relationship}-${evidence.source_name}-${evidence.target_name}-${index}`
                                                                            }
                                                                        >

                                                            <span>
                                                                {
                                                                    String(
                                                                        index + 1
                                                                    ).padStart(
                                                                        2,
                                                                        "0"
                                                                    )
                                                                }
                                                            </span>


                                                                            <div>
                                                                                <small>
                                                                                    {
                                                                                        meta.eyebrow
                                                                                    }
                                                                                </small>

                                                                                <strong>
                                                                                    {
                                                                                        getEvidenceFlowText(
                                                                                            evidence
                                                                                        )
                                                                                    }
                                                                                </strong>
                                                                            </div>


                                                                            <em>
                                                                                {
                                                                                    evidence.relationship
                                                                                }
                                                                            </em>

                                                                        </div>
                                                                    );
                                                                }
                                                            )}

                                                    </div>
                                                )}


                                            {evidenceStatus === "success"
                                                && presentationStory.length === 0 && (

                                                    <p className="v3-flow-message">
                                                        핵심 Evidence가 없습니다.
                                                    </p>

                                                )}


                                            {presentationStory[0] && (
                                                <div className="v3-flow-source">

                                                    <Newspaper size={12} />

                                                    <span>
                                            근거 · {
                                                        getSourceLabel(
                                                            presentationStory[0]
                                                        )
                                                    }
                                        </span>

                                                </div>
                                            )}

                                        </section>
                                    )}


                                {/* =================================================
                                5. BOTTOM VISUAL SIGNAL
                                빈 공간을 노드별 시각자료 영역으로 활용
                            ================================================= */}

                                {trend.id === "LOW_RISE"
                                && selectedNode.name === "Y2K" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(132,226,91,.48)",
                                        }}
                                    >
                                        <div className="v3-bottom-title">
                                            <strong>로우라이즈는 무엇이 다시 돌아온 걸까?</strong>
                                        </div>
                                        <div className="v3-signal-flow">
                                            <div>
                                                <strong>2000년대</strong>
                                                <span>낮은 허리선 데님 + 짧은 상의가 대표 Y2K 비율로 정착</span>
                                            </div>
                                            <i style={{ color: "#84e25b" }}>→</i>
                                            <div>
                                                <strong>2021–2022</strong>
                                                <span>Miu Miu가 낮은 허리선을 마이크로 미니와 크롭 니트로 재제시</span>
                                            </div>
                                            <i style={{ color: "#84e25b" }}>→</i>
                                            <div className="v3-signal-result">
                                                <strong>현재</strong>
                                                <span>스커트·카고·와이드 팬츠까지 ‘낮은 허리선’ 자체가 확장</span>
                                            </div>
                                        </div>
                                    </section>

                                ) : trend.id === "LOW_RISE"
                                && selectedNode.name === "Miu Miu SS22" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(132,226,91,.48)",
                                        }}
                                    >
                                        <div className="v3-bottom-title">
                                            <strong>왜 이 컬렉션이 전환점이 됐나</strong>
                                        </div>
                                        <div className="v3-point-grid">
                                            <div>
                                                <b>900회/일</b>
                                                <span>2022년 3월 당시 Lyst의 Miu Miu SS22 마이크로 미니 온라인 검색</span>
                                            </div>
                                            <div>
                                                <b>+127%</b>
                                                <span>Paloma Elsesser의 i-D 표지 공개 뒤 Miu Miu 탐색 증가</span>
                                            </div>
                                            <div>
                                                <b>품절</b>
                                                <span>미니스커트·크롭 스웨터가 Miu Miu 매장과 주요 온라인 채널에서 빠르게 소진</span>
                                            </div>
                                        </div>
                                    </section>

                                ) : trend.id === "LOW_RISE"
                                && selectedNode.name === "Miu Miu" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(132,226,91,.48)",
                                        }}
                                    >
                                        <div className="v3-bottom-title">
                                            <strong>런웨이 한 장면이 세계적 이미지가 된 과정</strong>
                                        </div>
                                        <div className="v3-signal-flow">
                                            <div>
                                                <strong>런웨이</strong>
                                                <span>초저허리 마이크로 미니라는 즉시 알아볼 수 있는 실루엣 제시</span>
                                            </div>
                                            <i style={{ color: "#84e25b" }}>→</i>
                                            <div>
                                                <strong>매거진·셀럽</strong>
                                                <span>표지·화보·인플루언서 착용으로 같은 룩이 반복 노출</span>
                                            </div>
                                            <i style={{ color: "#84e25b" }}>→</i>
                                            <div className="v3-signal-result">
                                                <strong>대중 인식</strong>
                                                <span>‘로우라이즈가 다시 돌아왔다’는 대표 이미지로 굳어짐</span>
                                            </div>
                                        </div>
                                    </section>

                                ) : trend.id === "LOW_RISE"
                                && selectedNode.name === "Zigzag" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(132,226,91,.48)",
                                        }}
                                    >
                                        <div className="v3-bottom-title">
                                            <strong>국내에서 실제 소비 행동으로 이어졌나?</strong>
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr auto 1fr",
                                                alignItems: "stretch",
                                                gap: "10px",
                                                marginTop: "8px",
                                            }}
                                        >
                                            <div className="v3-compare-card emphasized">
                                                <small>2022년 1~2월 · 전년 동기 대비</small>
                                                <strong style={{ fontSize: "25px", color: "#84e25b" }}>37배 ↑</strong>
                                                <span>‘로우라이즈’ 검색량</span>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    color: "#84e25b",
                                                    fontSize: "22px",
                                                    fontWeight: 900,
                                                }}
                                            >
                                                →
                                            </div>

                                            <div className="v3-compare-card emphasized">
                                                <small>2022년 1~2월 · 전년 동기 대비</small>
                                                <strong style={{ fontSize: "25px", color: "#84e25b" }}>10배+ ↑</strong>
                                                <span>로우라이즈 상품 거래액</span>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "9px",
                                                padding: "9px 11px",
                                                borderRadius: "9px",
                                                border: "1px solid rgba(132,226,91,.25)",
                                                background: "rgba(132,226,91,.06)",
                                            }}
                                        >
                                            <small style={{ color: "#84e25b", fontWeight: 900 }}>실제 검색 키워드</small>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "6px",
                                                    marginTop: "6px",
                                                }}
                                            >
                                                {["로우라이즈 팬츠", "로우라이즈 데님", "로우라이즈 스커트"].map((keyword) => (
                                                    <span
                                                        key={keyword}
                                                        style={{
                                                            padding: "5px 8px",
                                                            borderRadius: "999px",
                                                            border: "1px solid rgba(255,255,255,.13)",
                                                            background: "rgba(255,255,255,.04)",
                                                            color: "#dce7f3",
                                                            fontSize: "10px",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                ) : trend.id === "LOW_RISE"
                                && selectedNode.name === "Low-Rise Micro Skirt" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(132,226,91,.48)",
                                        }}
                                    >
                                        <div className="v3-bottom-title">
                                            <strong>재등장은 ‘복사’가 아니라 형태 변화</strong>
                                        </div>
                                        <div className="v3-point-grid">
                                            <div>
                                                <b>과거</b>
                                                <span>로우라이즈 진·팬츠가 대표 아이템</span>
                                            </div>
                                            <div>
                                                <b>유지된 특징</b>
                                                <span>골반까지 내려가는 낮은 허리선</span>
                                            </div>
                                            <div>
                                                <b>현재</b>
                                                <span>마이크로 스커트·카고·와이드 팬츠 등 여러 형태로 확장</span>
                                            </div>
                                        </div>
                                    </section>

                                ) : trend.id === "VELOUR"
                                && selectedNode.name === "Paris Hilton" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>왜 2000년대에 유행했나</strong>
                                        </div>

                                        <div className="v3-point-grid">
                                            <div>
                                                <b>셀러브리티 노출</b>
                                                <span>공항·쇼핑·일상 사진에서 반복적으로 착용되며 눈에 익숙해짐</span>
                                            </div>

                                            <div>
                                                <b>편안한 셋업</b>
                                                <span>트레이닝복의 편안함에 몸에 맞는 핏과 화려한 색을 결합</span>
                                            </div>

                                            <div>
                                                <b>시대 이미지</b>
                                                <span>‘꾸민 듯 편한 옷’이라는 2000년대 셀럽 라이프스타일의 상징으로 자리잡음</span>
                                            </div>
                                        </div>

                                    </section>

                                ) : trend.id === "VELOUR"
                                && selectedNode.name === "Juicy Couture" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>사라졌던 브랜드가 다시 보이기 시작한 과정</strong>
                                        </div>

                                        <div className="v3-signal-flow">
                                            <div>
                                                <strong>2000년대</strong>
                                                <span>벨루어 트랙수트의 대표 브랜드로 강하게 기억됨</span>
                                            </div>

                                            <i>→</i>

                                            <div>
                                                <strong>재등장</strong>
                                                <span>브랜드가 다시 시장에 등장하면서 과거 이미지도 함께 재노출</span>
                                            </div>

                                            <i>→</i>

                                            <div className="v3-signal-result">
                                                <strong>현재 소비층</strong>
                                                <span>Y2K 유행과 만나 과거 아이템을 새롭게 소비</span>
                                            </div>
                                        </div>

                                    </section>

                                ) : trend.id === "VELOUR"
                                && selectedNode.name === "One-Mile Wear" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>왜 다시 입기 편한 옷이 되었나</strong>
                                        </div>

                                        <div className="v3-style-transform-grid">
                                            <div>
                                                <small>첫 번째</small>
                                                <strong>편안함</strong>
                                                <span>활동하기 쉽고 오래 입기 편한 옷에 대한 선호 증가</span>
                                            </div>

                                            <div>
                                                <small>두 번째</small>
                                                <strong>일상복</strong>
                                                <span>집에서 입던 편안한 옷이 가까운 외출까지 자연스럽게 연결</span>
                                            </div>

                                            <div>
                                                <small>세 번째</small>
                                                <strong>상·하의 셋업</strong>
                                                <span>한 번에 코디가 완성되는 실용성이 다시 장점으로 작용</span>
                                            </div>

                                            <div className="v3-transform-result">
                                                <small>결과</small>
                                                <strong>복고 + 실용성</strong>
                                                <span>추억만이 아니라 실제로 다시 입을 이유가 생김</span>
                                            </div>
                                        </div>

                                    </section>

                                ) : trend.id === "VELOUR"
                                && selectedNode.name === "Jennie" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>새로운 세대에게 다시 유행처럼 보인 과정</strong>
                                        </div>

                                        <div className="v3-signal-flow">
                                            <div>
                                                <strong>과거의 상징</strong>
                                                <span>2000년대 셀러브리티의 대표적인 일상복</span>
                                            </div>

                                            <i>→</i>

                                            <div>
                                                <strong>새로운 셀럽</strong>
                                                <span>젊은 세대가 익숙한 패션 아이콘을 통해 다시 노출</span>
                                            </div>

                                            <i>→</i>

                                            <div className="v3-signal-result">
                                                <strong>Y2K 재유행</strong>
                                                <span>과거 복장이 아니라 현재 스타일로 다시 받아들여짐</span>
                                            </div>
                                        </div>

                                    </section>

                                ) : trend.id === "VELOUR"
                                && selectedNode.name === "Y2K" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>벨루어만 혼자 돌아온 것이 아니다</strong>
                                        </div>

                                        <div className="v3-point-grid">
                                            <div>
                                                <b>2000년대 감성</b>
                                                <span>당시 음악·셀럽·패션 이미지가 함께 다시 소비됨</span>
                                            </div>

                                            <div>
                                                <b>Y2K 재유행</b>
                                                <span>로우라이즈·크롭 상의·미니백 등 여러 요소가 동시에 재등장</span>
                                            </div>

                                            <div>
                                                <b>벨루어 트랙수트</b>
                                                <span>큰 복고 흐름 안에서 다시 자연스럽게 주목받음</span>
                                            </div>
                                        </div>

                                    </section>

                                ) : trend.id === "DUFFLE"
                                && DUFFLE_BOTTOM_VISUALS[selectedNode.name] ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                            borderColor: "rgba(160,112,255,.48)",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>
                                                {DUFFLE_BOTTOM_VISUALS[selectedNode.name].title}
                                            </strong>
                                        </div>

                                        <div className="v3-point-grid">
                                            {DUFFLE_BOTTOM_VISUALS[selectedNode.name].points.map(
                                                (point) => (
                                                    <div key={point.title}>
                                                        <b>{point.title}</b>
                                                        <span>{point.text}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                    </section>

                                ) : selectedNode.name === "소녀시대"
                                && selectedVisual?.bars ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>실제 판매 반응</strong>
                                        </div>

                                        <div className="v3-bottom-evidence-grid">

                                            <div className="v3-compare-card">
                                                <small>전년 동기</small>
                                                <strong>100</strong>
                                                <span>기준 지수</span>
                                            </div>

                                            <div className="v3-compare-arrow">
                                                →
                                            </div>

                                            <div className="v3-compare-card emphasized">
                                                <small>2009</small>
                                                <strong>200+</strong>
                                                <span>판매지수</span>
                                            </div>

                                            <div className="v3-bottom-kpi v3-bottom-kpi-clean">
                                                <small>일평균 판매량</small>
                                                <strong>약 2,000벌</strong>
                                                <em>전년 동기 대비 2배 이상</em>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "SPAO" ? (

                                    <section
                                        className="v3-bottom-signal v3-bottom-visual"
                                        style={{
                                            flex: "0 0 auto",
                                            minHeight: 0,
                                            height: "auto",
                                            overflow: "hidden",
                                            paddingTop: "9px",
                                            paddingBottom: "9px",
                                        }}
                                    >

                                        <div className="v3-bottom-title">
                                            <strong>Wide-Leg 소비 이동</strong>
                                        </div>

                                        <div className="v3-bottom-evidence-grid">

                                            <div className="v3-compare-card">
                                                <small>전년</small>
                                                <strong>100</strong>
                                                <span>기준 지수</span>
                                            </div>

                                            <div className="v3-compare-arrow">
                                                →
                                            </div>

                                            <div className="v3-compare-card emphasized">
                                                <small>2021</small>
                                                <strong>290</strong>
                                                <span>판매지수</span>
                                            </div>

                                            <div className="v3-bottom-kpi v3-bottom-kpi-clean">
                                                <small>Wide-Leg 판매 증가</small>
                                                <strong>+190%</strong>
                                                <em>누적 약 22만 장</em>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "Hedi Slimane" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>2005 Slim Silhouette</strong>
                                        </div>

                                        <div className="v3-point-grid">

                                            <div>
                                                <b>좁은 바지통</b>
                                                <span>
                                                좁은 바지 통
                                            </span>
                                            </div>

                                            <div>
                                                <b>길게 떨어지는 비율</b>
                                                <span>
                                                길게 떨어지는 하체 비율
                                            </span>
                                            </div>

                                            <div>
                                                <b>록 스타일</b>
                                                <span>
                                                마른 록 스타일과 결합
                                            </span>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "코르티스" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>최근 재노출 과정</strong>
                                        </div>

                                        <div className="v3-signal-flow">

                                            <div>
                                                <strong>
                                                    아이돌 착장
                                                </strong>
                                                <span>
                                                Skinny / Slim Fit
                                            </span>
                                            </div>

                                            <i>→</i>

                                            <div>
                                                <strong>
                                                    패션 미디어 조명
                                                </strong>
                                                <span>
                                                GQ · Harper’s Bazaar
                                            </span>
                                            </div>

                                            <i>→</i>

                                            <div className="v3-signal-result">
                                                <strong>
                                                    재등장 신호
                                                </strong>
                                                <span>
                                                재유행 확정 X
                                            </span>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "Modern Slim Silhouette" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>현재 스타일링 조합</strong>
                                        </div>

                                        <div className="v3-style-transform-grid">

                                            <div>
                                                <small>FIT</small>
                                                <strong>
                                                    슬림 스트레이트
                                                </strong>
                                                <span>
                                                초밀착보다 여유
                                            </span>
                                            </div>

                                            <div>
                                                <small>SHAPE</small>
                                                <strong>
                                                    슬림 부츠컷
                                                </strong>
                                                <span>
                                                밑단 실루엣 변화
                                            </span>
                                            </div>

                                            <div>
                                                <small>STYLING</small>
                                                <strong>
                                                    오버사이즈 상의 × 슬림 하의
                                                </strong>
                                                <span>
                                                상의 볼륨과 대비
                                            </span>
                                            </div>

                                            <div className="v3-transform-result">
                                                <small>RESULT</small>
                                                <strong>
                                                    과거 그대로 복귀 X
                                                </strong>
                                                <span>
                                                현재 비율로 재해석
                                            </span>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "임수정" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>2004 겨울 유행의 기억</strong>
                                        </div>

                                        <div className="v3-point-grid">

                                            <div>
                                                <b>DRAMA</b>
                                                <span>드라마 속 반복 노출</span>
                                            </div>

                                            <div>
                                                <b>WINTER</b>
                                                <span>양털 부츠 = 겨울 방한화 이미지</span>
                                            </div>

                                            <div>
                                                <b>MEMORY</b>
                                                <span>2000년대 Y2K 겨울 스타일로 기억</span>
                                            </div>

                                        </div>

                                    </section>

                                ) : selectedNode.name === "소연" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>왜 핵심 단계인가</strong>
                                        </div>

                                        <div className="v3-ugg-key-flow">

                                            <div>
                                                <small>01 · 재노출</small>
                                                <strong>소연 × UGG</strong>
                                                <span>2023 국내 모델·캠페인</span>
                                            </div>

                                            <i>→</i>

                                            <div className="highlight">
                                                <small>02 · 소비 반응</small>
                                                <strong>10~20대 매출 6배</strong>
                                                <span>직전 기간 대비 +560%</span>
                                            </div>

                                            <i>→</i>

                                            <div>
                                                <small>03 · 제품 반응</small>
                                                <strong>Aww Yeah +231%</strong>
                                                <span>여름 샌들 판매 증가</span>
                                            </div>

                                        </div>

                                        <p className="v3-ugg-relation-note">
                                            Graph 연결 · 소연 → UGG → 10~20대
                                        </p>

                                    </section>

                                ) : selectedNode.name === "10~20대" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>왜 10~20대가 핵심인가</strong>
                                        </div>

                                        <div className="v3-ugg-consumer-grid">

                                            <div className="v3-ugg-consumer-copy">
                                                <strong>
                                                    셀럽 재노출이 실제 소비로 넘어간 지점
                                                </strong>

                                                <p>
                                                    소연 캠페인 이후 10~20대 매출이
                                                    직전 기간 대비 6배 증가하면서,
                                                    재유행이 단순 이미지 노출이 아니라
                                                    실제 젊은 구매층으로 확산됐음을 보여줍니다.
                                                </p>
                                            </div>

                                            <div className="v3-ugg-stat-big">
                                                <small>10~20대 매출</small>
                                                <strong>6배</strong>
                                                <span>+560%</span>
                                            </div>

                                            <div className="v3-ugg-stat-big">
                                                <small>Aww Yeah 판매</small>
                                                <strong>+231%</strong>
                                                <span>2023 여름 캠페인 이후</span>
                                            </div>

                                        </div>

                                        <p className="v3-ugg-relation-note">
                                            Graph 연결 · 소연의 캠페인 노출 → UGG → 젊은 소비층 확산
                                        </p>

                                    </section>

                                ) : selectedNode.name === "연준" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>남성 카테고리 확장</strong>
                                        </div>

                                        <div className="v3-ugg-yeonjun-bottom">

                                            <div>
                                                <small>2025 1~9월 남성 제품 매출</small>
                                                <strong>+135%</strong>
                                                <span>전년 동기 대비</span>
                                            </div>

                                            <div>
                                                <small>2026 SS 제품군</small>
                                                <strong>클로그 · 샌들 · 스니커즈</strong>
                                                <span>겨울부츠 밖으로 카테고리 확장</span>
                                            </div>

                                        </div>

                                        <p className="v3-ugg-relation-note">
                                            연준은 ‘남성도 신는 UGG’로 소비 대상을 넓히는 단계의 대표 노드입니다.
                                        </p>

                                    </section>

                                ) : selectedNode.name === "All-Season Fashion" ? (

                                    <section className="v3-bottom-signal v3-bottom-visual">

                                        <div className="v3-bottom-title">
                                            <strong>사계절 브랜드로 확장된 근거</strong>
                                        </div>

                                        <div className="v3-ugg-season-stats">

                                            <div>
                                                <small>브랜드 매출</small>
                                                <strong>+50%</strong>
                                                <span>여름 제품 판매가 성장 견인</span>
                                            </div>

                                            <div>
                                                <small>남성 라인</small>
                                                <strong>2배</strong>
                                                <span>전년 동기 대비</span>
                                            </div>

                                            <div>
                                                <small>검색 반응</small>
                                                <strong>2배</strong>
                                                <span>행사 기간 전주 대비</span>
                                            </div>

                                        </div>

                                        <p className="v3-ugg-relation-note">
                                            겨울 양털부츠 → 샌들·슬리퍼·클로그 → 남녀가 신는 사계절 라이프스타일 브랜드
                                        </p>

                                    </section>

                                ) : metricEvidence ? (

                                    <section className="v3-bottom-signal">

                                        <div>
                                            <span>DATA SIGNAL</span>

                                            <small>
                                                {
                                                    metricEvidence.metric
                                                    || "수치 근거"
                                                }
                                            </small>
                                        </div>

                                        <strong>
                                            {
                                                metricEvidence.metric_display_value
                                                || "확인"
                                            }
                                        </strong>

                                        <em>
                                            {
                                                metricEvidence.metric_change_text
                                                || getEvidenceFlowText(
                                                    metricEvidence
                                                )
                                            }
                                        </em>

                                    </section>

                                ) : (

                                    selectedKeyMeta && (
                                        <section className="v3-bottom-signal v3-trend-only">

                                            <div>
                                                <span>TREND SIGNAL</span>
                                                <small>현재 판단</small>
                                            </div>

                                            <strong>
                                                {selectedKeyMeta.label}
                                            </strong>

                                            <em>
                                                관계 + 시각 근거 기반
                                            </em>

                                        </section>
                                    )

                                )}

                            </div>

                        ) : (
                            <div className="simple-node-panel">

                                <div className="simple-node-header">
                                    <span
                                        className={
                                            `simple-node-dot group-${getVisualGroup(
                                                selectedNode
                                            )}`
                                        }
                                    />

                                    <div>
                                        <h2>
                                            {selectedNode.name}
                                        </h2>

                                        <small>
                                            {getNodeType(selectedNode)}
                                            {selectedNode.year
                                                ? ` · ${Math.round(selectedNode.year)}`
                                                : ""
                                            }
                                        </small>
                                    </div>
                                </div>


                                <section className="simple-node-description-card">

                                    <strong>
                                        이 노드는 어떤 역할인가?
                                    </strong>

                                    <p>
                                        {getSimpleNodeDescription(selectedNode)}
                                    </p>

                                </section>


                                {selectedRelations.length > 0 && (
                                    <section className="simple-node-relation-list">

                                        <strong>
                                            그래프 연결
                                        </strong>

                                        {selectedRelations
                                            .slice(0, 3)
                                            .map(
                                                (relationship) => {
                                                    const source =
                                                        nodeMap.get(
                                                            relationship.source_id
                                                        );

                                                    const target =
                                                        nodeMap.get(
                                                            relationship.target_id
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                relationship.relationship_id
                                                                || `${relationship.source_id}-${relationship.type}-${relationship.target_id}`
                                                            }
                                                            className="simple-node-relation-row"
                                                        >
                                                            <span>
                                                                {source?.name || "Node"}
                                                            </span>

                                                            <b>
                                                                {relationship.type || "RELATED"}
                                                            </b>

                                                            <span>
                                                                {target?.name || "Node"}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                            )
                                        }

                                    </section>
                                )}


                                {simpleConnectedNodes.length > 0 && (
                                    <p className="simple-node-summary">
                                        연결된 노드 · {simpleConnectedNodes.join(" · ")}
                                    </p>
                                )}

                            </div>
                        )

                    ) : (

                        <div className="inspector-default presentation-default">
                            <span className="inspector-eyebrow">
                                TREND SUMMARY
                            </span>

                            <div className="inspector-main-trend">
                                <span className="inspector-main-icon">
                                    <TrendCenterIcon trendId={trend.id} />
                                </span>

                                <div>
                                    <h2>{trend.ko}</h2>
                                    <small>{trend.en}</small>
                                </div>
                            </div>

                            <p className="inspector-intro presentation-default-intro">
                                음성으로 핵심 Node를 선택하면 이 영역에
                                대표 이미지, 유행 흐름, 판매·검색 반응 등
                                발표에 필요한 근거만 간결하게 표시됩니다.
                            </p>

                            <div className="inspector-divider" />

                            <strong className="inspector-section-title presentation-time-title">
                                TIME FLOW
                            </strong>

                            <div className="inspector-stage-list presentation-stage-list">
                                {stages.map(
                                    (stage) => (
                                        <div
                                            key={stage.key}
                                            className="inspector-stage"
                                        >
                                            <i />
                                            <div>
                                                <strong>{stage.key}</strong>
                                                <span>{stage.label}</span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                    )}

                </aside>

            </section>

        </main>
    );
}


export default TrendDetailPage;