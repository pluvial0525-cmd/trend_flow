import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    Flame,
    RefreshCw,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import "../styles/trendPatternPage.css";


// =========================================================
// PATTERN DATA
// =========================================================

const PATTERN_DATA = {

    // =====================================================
    // 지속형
    // =====================================================

    steady: {
        id:
            "steady",

        title:
            "지속형",

        trend:
            "UGG Boots",

        icon:
        Clock3,

        subtitle:
            "대중화 이후 소비층과 제품군이 확장되며 꾸준히 이어지는 흐름",

        description:
            "UGG는 2000년대 겨울 부츠로 대중적인 인기를 얻었습니다. 이후 젊은 소비층의 새로운 스타일링과 다시 연결됐고, 슬리퍼·클로그·플랫폼 등 다양한 형태로 제품군이 확장되면서 일시적인 유행을 넘어 꾸준히 소비되는 제품으로 자리 잡았습니다.",

        keyword:
            "대중화 → 소비층 확장 → 제품군 확장",

        flowTitle:
            "UGG는 유행을 넘어 대중적인 제품으로 자리 잡았습니다.",

        stages: [
            {
                period:
                    "2000s",

                title:
                    "겨울 부츠로 대중화",

                image:
                    "/images/trend/pattern/ugg-2000s.png",
            },

            {
                period:
                    "재연결",

                title:
                    "젊은 소비층으로 확장",

                image:
                    "/images/trend/pattern/ugg-modern.png",
            },

            {
                period:
                    "현재",

                title:
                    "다양한 제품군으로 확장",

                image:
                    "/images/trend/pattern/ugg-current-products.png",
            },
        ],

        finalText:
            "겨울 부츠로 대중적인 인기를 얻은 뒤 젊은 소비층과 다시 연결되고 제품군까지 다양해지면서, 일시적인 유행을 넘어 꾸준히 소비되는 패션 제품으로 자리 잡았습니다.",
    },


    // =====================================================
    // 급등 · 소멸형
    // =====================================================

    spike: {
        id:
            "spike",

        title:
            "급등·소멸형",

        trend:
            "벨루어 트랙수트",

        icon:
        Flame,

        subtitle:
            "셀럽을 중심으로 빠르게 확산됐지만 대중적 유행은 오래 이어지지 않은 흐름",

        description:
            "벨루어 트랙수트는 2000년대 셀럽과 연예인들의 반복적인 착용을 통해 화려한 패션 이미지로 빠르게 주목받았습니다. 하지만 시간이 지나면서 대중의 관심은 편안하고 실용적인 스포츠웨어로 이동했고, 벨루어 트랙수트의 대중적인 유행은 점차 약해졌습니다. 다만 무대 의상이나 시상식, 특정 스타일링에서는 지금도 하나의 패션 스타일로 활용되고 있습니다.",

        keyword:
            "셀럽 확산 → 대중 관심 감소 → 특정 영역에 잔존",

        flowTitle:
            "강한 셀럽 유행은 약해졌지만 하나의 패션 스타일로 남았습니다.",

        stages: [
            {
                period:
                    "2000s",

                title:
                    "셀럽 착용으로 대중적 관심",

                image:
                    "/images/trend/pattern/velour-2000s.png",
            },

            {
                period:
                    "유행 확산",

                title:
                    "화려한 셀럽 패션으로 확산",

                image:
                    "/images/trend/pattern/velour-peak.png",
            },

            {
                period:
                    "이후",

                title:
                    "편안한 스포츠웨어 선호 확대",

                image:
                    "/images/trend/pattern/velour-after.png",
            },
        ],

        finalText:
            "셀럽과 연예인들의 착용으로 큰 관심을 얻었지만 화려한 스타일이 대중적인 유행으로 오래 이어지지는 않았습니다. 다만 시상식·무대 의상·특정 스타일링처럼 화려한 연출이 필요한 패션 영역에서는 지금도 하나의 스타일로 남아 있습니다.",
    },


    // =====================================================
    // 재등장형
    // 스키니진 → 로우라이즈 변경
    // =====================================================

    revival: {
        id:
            "revival",

        title:
            "재등장형",

        trend:
            "로우라이즈",

        icon:
        RefreshCw,

        subtitle:
            "과거의 유행이 약해진 뒤 새로운 세대와 스타일을 통해 다시 등장하는 흐름",

        description:
            "로우라이즈는 2000년대 낮은 허리선과 허리를 드러내는 스타일을 중심으로 Y2K 패션의 대표적인 실루엣으로 대중화됐습니다. 이후 패션의 실루엣과 소비자 취향이 다양하게 변화하면서 로우라이즈의 대중적인 영향력은 점차 감소했습니다. 하지만 최근 Y2K 트렌드가 다시 주목받으면서 과거의 형태를 그대로 반복하기보다 와이드핏·레이어링·벨트 스타일링 등 다양한 방식으로 재해석된 로우라이즈가 다시 등장하고 있습니다.",

        keyword:
            "2000년대 대중화 → 관심 감소 → 새로운 형태로 재등장",

        flowTitle:
            "로우라이즈는 새로운 실루엣과 스타일로 재해석되며 다시 등장하고 있습니다.",

        stages: [
            {
                period:
                    "2000s",

                title:
                    "로우라이즈 패션 대중화",

                image:
                    "/images/trend/pattern/lowrise-2000s.jpg",
            },

            {
                period:
                    "2010s",

                title:
                    "로우라이즈의 대중적 영향력 감소",

                image:
                    "/images/trend/pattern/lowrise-2010s.png",
            },

            {
                period:
                    "최근",

                title:
                    "다양한 로우라이즈 스타일로 재등장",

                image:
                    "/images/trend/pattern/lowrise-modern.png",
            },
        ],

        finalText:
            "로우라이즈는 2000년대 대중화된 뒤 한동안 관심이 감소했지만, 최근 Y2K 트렌드와 함께 와이드핏·레이어링 등 현대적인 실루엣으로 재해석되며 다시 등장하고 있습니다.",
    },
};


// =========================================================
// PATTERN ORDER
// =========================================================

const PATTERN_ORDER = [
    "steady",
    "spike",
    "revival",
];


// =========================================================
// GOOGLE TREND SERIES
// 실제 trend_interest_merged.json의 key 사용
// =========================================================

const PATTERN_CHART_SERIES = [
    {
        patternId:
            "steady",

        key:
            "ugg",

        label:
            "UGG",
    },

    {
        patternId:
            "spike",

        key:
            "velour",

        label:
            "벨루어",
    },

    {
        patternId:
            "revival",

        key:
            "lowrise",

        label:
            "로우라이즈",
    },
];


// =========================================================
// CHART
// =========================================================

const PATTERN_CHART = {
    width:
        1000,

    height:
        250,

    left:
        45,

    right:
        20,

    top:
        15,

    bottom:
        34,
};


const PATTERN_TICKS = [
    2004,
    2008,
    2012,
    2016,
    2020,
    2024,
    2026,
];


// =========================================================
// IMAGE
// =========================================================

function PatternImage({
                          src,
                          alt,
                      }) {

    const [
        failed,
        setFailed,
    ] =
        useState(false);


    if (failed) {

        return (
            <div className="pattern-image-fallback">

                이미지 없음

            </div>
        );
    }


    return (
        <img
            src={
                src
            }
            alt={
                alt
            }
            className="pattern-flow-image"
            onError={() =>
                setFailed(
                    true
                )
            }
        />
    );
}


// =========================================================
// PAGE
// =========================================================

function TrendPatternPage() {

    const navigate =
        useNavigate();


    // =====================================================
    // SELECTED PATTERN
    // =====================================================

    const [
        selectedPattern,
        setSelectedPattern,
    ] =
        useState(
            "steady"
        );


    // =====================================================
    // TREND DATA
    // =====================================================

    const [
        trendData,
        setTrendData,
    ] =
        useState([]);


    const [
        chartLoading,
        setChartLoading,
    ] =
        useState(true);


    // =====================================================
    // CURRENT PATTERN
    // =====================================================

    const current =
        useMemo(
            () =>
                PATTERN_DATA[
                    selectedPattern
                    ],
            [
                selectedPattern,
            ]
        );


    const CurrentIcon =
        current.icon;


    // =========================================================
// VOICE COMMAND
// =========================================================

    useEffect(
        () => {

            function handlePatternVoiceCommand(
                event
            ) {

                const type =
                    event.detail?.type;


                console.log(
                    "[TREND PATTERN VOICE]",
                    type,
                    event.detail?.command
                );


                // =============================================
                // 지속형
                // =============================================

                if (
                    type ===
                    "SELECT_STEADY"
                ) {

                    setSelectedPattern(
                        "steady"
                    );

                    return;
                }


                // =============================================
                // 급등 · 소멸형
                // =============================================

                if (
                    type ===
                    "SELECT_SPIKE"
                ) {

                    setSelectedPattern(
                        "spike"
                    );

                    return;
                }


                // =============================================
                // 재등장형
                // =============================================

                if (
                    type ===
                    "SELECT_REVIVAL"
                ) {

                    setSelectedPattern(
                        "revival"
                    );
                }
            }


            window.addEventListener(
                "trend-pattern-voice-command",
                handlePatternVoiceCommand
            );


            return () => {

                window.removeEventListener(
                    "trend-pattern-voice-command",
                    handlePatternVoiceCommand
                );
            };

        },
        []
    );

    // =====================================================
    // GOOGLE TREND DATA LOAD
    // =====================================================

    useEffect(
        () => {

            async function loadTrendData() {

                try {

                    const response =
                        await fetch(
                            "/data/trends/trend_interest_merged.json"
                        );


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            `Trend data load failed: ${response.status}`
                        );
                    }


                    const json =
                        await response.json();


                    setTrendData(
                        json.data
                        || []
                    );

                } catch (
                    error
                    ) {

                    console.error(
                        "[PATTERN TREND DATA ERROR]",
                        error
                    );

                } finally {

                    setChartLoading(
                        false
                    );
                }
            }


            loadTrendData();

        },
        []
    );


    // =====================================================
    // NORMALIZE DATE
    // =====================================================

    const chartData =
        useMemo(
            () => {

                return trendData.map(
                    (
                        row
                    ) => {

                        const year =
                            Number(
                                row.date
                                    ?.slice(
                                        0,
                                        4
                                    )
                            );


                        const month =
                            Number(
                                row.date
                                    ?.slice(
                                        5,
                                        7
                                    )
                            );


                        return {
                            ...row,

                            numericDate:
                                year
                                +
                                (
                                    month - 1
                                )
                                / 12,
                        };
                    }
                );

            },
            [
                trendData,
            ]
        );


    // =====================================================
    // MIN YEAR
    // =====================================================

    const xMin =
        useMemo(
            () => {

                if (
                    chartData.length
                    === 0
                ) {

                    return 2004;
                }


                return Math.min(
                    ...chartData.map(
                        (
                            item
                        ) =>
                            item.numericDate
                    )
                );

            },
            [
                chartData,
            ]
        );


    // =====================================================
    // MAX YEAR
    // =====================================================

    const xMax =
        useMemo(
            () => {

                if (
                    chartData.length
                    === 0
                ) {

                    return 2026;
                }


                return Math.max(
                    ...chartData.map(
                        (
                            item
                        ) =>
                            item.numericDate
                    )
                );

            },
            [
                chartData,
            ]
        );


    // =====================================================
    // INNER SIZE
    // =====================================================

    const chartInnerWidth =
        PATTERN_CHART.width
        -
        PATTERN_CHART.left
        -
        PATTERN_CHART.right;


    const chartInnerHeight =
        PATTERN_CHART.height
        -
        PATTERN_CHART.top
        -
        PATTERN_CHART.bottom;


    // =====================================================
    // X SCALE
    // =====================================================

    function scalePatternX(
        value
    ) {

        const range =
            xMax
            -
            xMin
            ||
            1;


        return (
            PATTERN_CHART.left
            +
            (
                value
                -
                xMin
            )
            /
            range
            *
            chartInnerWidth
        );
    }


    // =====================================================
    // Y SCALE
    // =====================================================

    function scalePatternY(
        value
    ) {

        return (
            PATTERN_CHART.top
            +
            (
                100
                -
                value
            )
            /
            100
            *
            chartInnerHeight
        );
    }


    // =====================================================
    // BUILD PATH
    // =====================================================

    function buildPatternPath(
        key
    ) {

        let path =
            "";


        let drawing =
            false;


        chartData.forEach(
            (
                row
            ) => {

                const value =
                    row[
                        key
                        ];


                if (
                    value
                    === null
                    ||
                    value
                    === undefined
                ) {

                    drawing =
                        false;

                    return;
                }


                const x =
                    scalePatternX(
                        row.numericDate
                    );


                const y =
                    scalePatternY(
                        Number(
                            value
                        )
                    );


                if (
                    !drawing
                ) {

                    path +=
                        `M ${x} ${y}`;


                    drawing =
                        true;

                } else {

                    path +=
                        ` L ${x} ${y}`;
                }
            }
        );


        return path;
    }


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="trend-pattern-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="pattern-header">

                <button
                    type="button"
                    className="pattern-back"
                    onClick={() =>
                        navigate(
                            "/trend-flow"
                        )
                    }
                >

                    <ArrowLeft
                        size={
                            17
                        }
                    />

                    그래프로 돌아가기

                </button>


                <div className="pattern-title">

                    <span>
                        TREND PATTERN
                    </span>

                    <h1>
                        유행의 흐름은 어떤 구조일까?
                    </h1>

                </div>

            </header>


            {/* =================================================
                TOP
            ================================================= */}

            <section className="pattern-top-layout">


                {/* =============================================
                    LEFT
                ============================================= */}

                <aside className="pattern-side-tabs">

                    {
                        PATTERN_ORDER.map(
                            (
                                patternId
                            ) => {

                                const item =
                                    PATTERN_DATA[
                                        patternId
                                        ];


                                const Icon =
                                    item.icon;


                                const active =
                                    selectedPattern
                                    ===
                                    patternId;


                                return (
                                    <button
                                        type="button"
                                        key={
                                            patternId
                                        }
                                        className={
                                            active
                                                ? `side-pattern-tab ${patternId} active`
                                                : `side-pattern-tab ${patternId}`
                                        }
                                        onClick={() =>
                                            setSelectedPattern(
                                                patternId
                                            )
                                        }
                                    >

                                        <span>

                                            <Icon
                                                size={
                                                    18
                                                }
                                            />

                                        </span>


                                        <div>

                                            <strong>
                                                {
                                                    item.title
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    item.trend
                                                }
                                            </small>

                                        </div>

                                    </button>
                                );
                            }
                        )
                    }

                </aside>


                {/* =============================================
                    CENTER GRAPH
                ============================================= */}

                <article className="pattern-graph-panel">

                    <div className="panel-heading">

                        <div>

                            <span>
                                GOOGLE TRENDS · KOREA
                            </span>

                            <h2>
                                검색 관심도 기반 유행 흐름 비교
                            </h2>

                        </div>


                        <div className="pattern-chart-legend">

                            {
                                PATTERN_CHART_SERIES.map(
                                    (
                                        series
                                    ) => {

                                        const active =
                                            selectedPattern
                                            ===
                                            series.patternId;


                                        return (
                                            <button
                                                key={
                                                    series.key
                                                }
                                                type="button"
                                                className={
                                                    `
                                                    pattern-chart-legend-item
                                                    ${series.patternId}
                                                    ${
                                                        active
                                                            ? "active"
                                                            : ""
                                                    }
                                                    `
                                                }
                                                onClick={() =>
                                                    setSelectedPattern(
                                                        series.patternId
                                                    )
                                                }
                                            >

                                                <i />

                                                {
                                                    series.label
                                                }

                                            </button>
                                        );
                                    }
                                )
                            }

                        </div>

                    </div>


                    <div className="pattern-interest-chart-wrap">

                        <div className="pattern-chart-y">

                            검색 관심도

                            <span>
                                ↑
                            </span>

                        </div>


                        <div className="pattern-interest-chart-stage">

                            {
                                chartLoading
                                    ? (

                                        <div className="pattern-chart-loading">

                                            검색 관심도 데이터를 불러오는 중...

                                        </div>

                                    )
                                    : (

                                        <svg
                                            viewBox={
                                                `0 0 ${PATTERN_CHART.width} ${PATTERN_CHART.height}`
                                            }
                                            preserveAspectRatio="none"
                                        >


                                            {/* =========================
                                                GRID
                                            ========================= */}

                                            {
                                                [
                                                    0,
                                                    25,
                                                    50,
                                                    75,
                                                    100,
                                                ].map(
                                                    (
                                                        value
                                                    ) => {

                                                        const y =
                                                            scalePatternY(
                                                                value
                                                            );


                                                        return (
                                                            <g
                                                                key={
                                                                    `grid-${value}`
                                                                }
                                                            >

                                                                <line
                                                                    x1={
                                                                        PATTERN_CHART.left
                                                                    }
                                                                    x2={
                                                                        PATTERN_CHART.width
                                                                        -
                                                                        PATTERN_CHART.right
                                                                    }
                                                                    y1={
                                                                        y
                                                                    }
                                                                    y2={
                                                                        y
                                                                    }
                                                                    className="pattern-chart-grid"
                                                                />


                                                                <text
                                                                    x={
                                                                        PATTERN_CHART.left
                                                                        -
                                                                        9
                                                                    }
                                                                    y={
                                                                        y
                                                                        +
                                                                        3
                                                                    }
                                                                    textAnchor="end"
                                                                    className="pattern-chart-axis-label"
                                                                >

                                                                    {
                                                                        value
                                                                    }

                                                                </text>

                                                            </g>
                                                        );
                                                    }
                                                )
                                            }


                                            {/* =========================
                                                YEAR
                                            ========================= */}

                                            {
                                                PATTERN_TICKS.map(
                                                    (
                                                        year
                                                    ) => {

                                                        const x =
                                                            scalePatternX(
                                                                year
                                                            );


                                                        return (
                                                            <g
                                                                key={
                                                                    `year-${year}`
                                                                }
                                                            >

                                                                <line
                                                                    x1={
                                                                        x
                                                                    }
                                                                    x2={
                                                                        x
                                                                    }
                                                                    y1={
                                                                        PATTERN_CHART.top
                                                                    }
                                                                    y2={
                                                                        PATTERN_CHART.top
                                                                        +
                                                                        chartInnerHeight
                                                                    }
                                                                    className="pattern-chart-year-line"
                                                                />


                                                                <text
                                                                    x={
                                                                        x
                                                                    }
                                                                    y={
                                                                        PATTERN_CHART.height
                                                                        -
                                                                        8
                                                                    }
                                                                    textAnchor="middle"
                                                                    className="pattern-chart-year-label"
                                                                >

                                                                    {
                                                                        year
                                                                    }

                                                                </text>

                                                            </g>
                                                        );
                                                    }
                                                )
                                            }


                                            {/* =========================
                                                REAL DATA SERIES
                                            ========================= */}

                                            {
                                                PATTERN_CHART_SERIES.map(
                                                    (
                                                        series
                                                    ) => {

                                                        const active =
                                                            selectedPattern
                                                            ===
                                                            series.patternId;


                                                        return (
                                                            <path
                                                                key={
                                                                    series.key
                                                                }
                                                                d={
                                                                    buildPatternPath(
                                                                        series.key
                                                                    )
                                                                }
                                                                className={
                                                                    `
                                                                    pattern-interest-line
                                                                    ${series.patternId}
                                                                    ${
                                                                        active
                                                                            ? "selected"
                                                                            : "muted"
                                                                    }
                                                                    `
                                                                }
                                                            />
                                                        );
                                                    }
                                                )
                                            }

                                        </svg>

                                    )
                            }


                            <div className="pattern-chart-note">

                                상대적 검색 관심도 · 절대 검색량이 아님

                            </div>

                        </div>

                    </div>

                </article>


                {/* =============================================
                    RIGHT DESCRIPTION
                ============================================= */}

                <aside
                    className={
                        `pattern-description ${selectedPattern}`
                    }
                >

                    <div className="description-title">

                        <span>

                            <CurrentIcon
                                size={
                                    22
                                }
                            />

                        </span>


                        <div>

                            <small>
                                {
                                    current.trend
                                }
                            </small>

                            <h2>
                                {
                                    current.title
                                }
                            </h2>

                        </div>

                    </div>


                    <strong className="description-main">

                        {
                            current.subtitle
                        }

                    </strong>


                    <p>

                        {
                            current.description
                        }

                    </p>


                    <div className="description-key">

                        <span>
                            관계 흐름
                        </span>

                        <strong>
                            {
                                current.keyword
                            }
                        </strong>

                    </div>

                </aside>

            </section>


            {/* =================================================
                IMAGE FLOW
            ================================================= */}

            <section className="pattern-image-panel">

                <div className="image-panel-heading">

                    <div>

                        <span>
                            VISUAL FLOW
                        </span>

                        <h2>
                            {
                                current.flowTitle
                            }
                        </h2>

                    </div>

                </div>


                <div className="pattern-image-flow">

                    {
                        current.stages.map(
                            (
                                stage,
                                index
                            ) => (

                                <div
                                    className="pattern-image-group"
                                    key={
                                        `${selectedPattern}-${stage.period}`
                                    }
                                >

                                    <article className="pattern-image-card">

                                        <div
                                            className={
                                                stage.images
                                                    ? "pattern-image-media double"
                                                    : "pattern-image-media"
                                            }
                                        >

                                            {
                                                stage.images
                                                    ? (
                                                        stage.images.map(
                                                            (
                                                                image,
                                                                imageIndex
                                                            ) => (

                                                                <PatternImage
                                                                    key={
                                                                        image
                                                                    }
                                                                    src={
                                                                        image
                                                                    }
                                                                    alt={
                                                                        `${stage.title} ${imageIndex + 1}`
                                                                    }
                                                                />

                                                            )
                                                        )
                                                    )
                                                    : (

                                                        <PatternImage
                                                            src={
                                                                stage.image
                                                            }
                                                            alt={
                                                                stage.title
                                                            }
                                                        />

                                                    )
                                            }

                                        </div>


                                        <div className="pattern-image-caption">

                                            <span>
                                                {
                                                    stage.period
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    stage.title
                                                }
                                            </strong>

                                        </div>

                                    </article>


                                    {
                                        index
                                        <
                                        current.stages.length
                                        -
                                        1
                                        &&
                                        (

                                            <div className="pattern-flow-arrow">

                                                <ArrowRight
                                                    size={
                                                        32
                                                    }
                                                />

                                            </div>

                                        )
                                    }

                                </div>

                            )
                        )
                    }

                </div>


                <div className="pattern-flow-summary">

                    <strong>

                        {
                            current.finalText
                        }

                    </strong>

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="pattern-footer">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/trend-image-analysis"
                        )
                    }
                >

                    다음 분석

                    <ArrowRight
                        size={
                            17
                        }
                    />

                </button>

            </footer>

        </main>
    );
}


export default TrendPatternPage;