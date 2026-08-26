import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
    Mic,
    RotateCcw,
    ScanSearch,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getTrendFlowGraph,
    getTrendFlowEvidence,
} from "../api/trendFlowApi";

import {
    buildOverviewRows,
    getYearPercent,
    TREND_META,
} from "../utils/trendFlowUtils";

import "../styles/trendFlowPage.css";


const FILTERS = [
    {
        key: "ALL",
        label: "전체",
    },
    {
        key: "SKINNY",
        label: "스키니진",
    },
    {
        key: "UGG",
        label: "어그부츠",
    },
    {
        key: "VELOUR",
        label: "벨루어",
    },
    {
        key: "LOW_RISE",
        label: "로우라이즈",
    },
    {
        key: "DUFFLE",
        label: "떡볶이 코트",
    },
];


const YEAR_MARKS = [
    { value: 1990, label: "1990s" },
    { value: 2000, label: "2000" },
    { value: 2005, label: "2005" },
    { value: 2010, label: "2010" },
    { value: 2015, label: "2015" },
    { value: 2020, label: "2020" },
    { value: 2021, label: "2021" },
    { value: 2022, label: "2022" },
    { value: 2023, label: "2023" },
    { value: 2024, label: "2024" },
    { value: 2025, label: "2025" },
    { value: 2026, label: "2026" },
];


function TrendFlowPage() {
    const navigate =
        useNavigate();


    const [
        graphData,
        setGraphData,
    ] =
        useState({
            nodes: [],
            relationships: [],
        });


    const [
        status,
        setStatus,
    ] =
        useState("loading");


    /* =====================================================
       NEO4J LOAD
    ===================================================== */

    useEffect(
        () => {
            let cancelled =
                false;


            async function load() {
                try {
                    setStatus(
                        "loading"
                    );


                    const data =
                        await getTrendFlowGraph();


                    if (cancelled) {
                        return;
                    }


                    setGraphData({
                        nodes:
                            data.nodes
                            || [],

                        relationships:
                            data.relationships
                            || [],
                    });


                    setStatus(
                        "connected"
                    );

                } catch (
                    error
                    ) {
                    console.error(
                        "Trend Flow API error:",
                        error
                    );


                    if (!cancelled) {
                        setStatus(
                            "offline"
                        );
                    }
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


    const rows =
        useMemo(
            () =>
                buildOverviewRows(
                    graphData.relationships
                ),
            [
                graphData.relationships,
            ]
        );


    function openTrend(
        trendId
    ) {
        const trend =
            TREND_META[
                trendId
                ];


        if (!trend) {
            return;
        }


        navigate(
            `/trend-flow/${trend.slug}`
        );
    }


    function handleTopButton(
        filter
    ) {
        if (
            filter.key
            === "ALL"
        ) {
            return;
        }


        openTrend(
            filter.key
        );
    }


    function openPatternAnalysis() {
        navigate(
            "/trend-pattern"
        );
    }


    return (
        <div className="trend-overview-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="trend-overview-header">

                <div className="overview-brand">

                    <span>
                        FASHION NETWORK SIMULATION
                    </span>

                    <strong>
                        TREND CITY
                    </strong>

                </div>


                <button
                    type="button"
                    className="overview-voice"
                >
                    <i />

                    <Mic
                        size={14}
                    />

                    VOICE PRESENTATION
                </button>


                <button
                    type="button"
                    className="overview-back"
                    onClick={() =>
                        navigate("/centrality")
                    }
                >
                    <ArrowLeft
                        size={15}
                    />

                    CENTRALITY
                </button>

            </header>


            {/* =================================================
                SHELL
            ================================================= */}

            <main className="trend-overview-shell">


                {/* =================================================
                    HEADING
                ================================================= */}

                <section className="overview-heading">

                    <div>

                        <p>
                            07

                            <span>
                                FASHION DATA
                            </span>
                        </p>


                        <h1>
                            FASHION TREND FLOW
                        </h1>


                        <small>
                            전체 흐름을 비교한 뒤 패션을 선택해 실제 GraphDB 관계를 탐색합니다.
                        </small>

                    </div>


                    <div className="overview-filters">

                        {FILTERS.map(
                            (filter) => (

                                <button
                                    key={
                                        filter.key
                                    }
                                    type="button"
                                    className={
                                        filter.key
                                        === "ALL"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleTopButton(
                                            filter
                                        )
                                    }
                                >
                                    {
                                        filter.label
                                    }
                                </button>

                            )
                        )}


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/trend-flow"
                                )
                            }
                        >
                            <RotateCcw
                                size={12}
                            />

                            초기화
                        </button>

                    </div>

                </section>


                {/* =================================================
                    NETWORK
                ================================================= */}

                <section className="overview-network">

                    <div className="overview-network-top">

                        <div
                            className={
                                `overview-db-status ${status}`
                            }
                        >
                            <i />

                            {
                                status
                                === "connected"
                                    ? "NEO4J CONNECTED"
                                    : status
                                    === "loading"
                                        ? "LOADING"
                                        : "OFFLINE"
                            }

                        </div>


                        <span>

                            {
                                graphData.nodes.length
                            } NODES

                            {" · "}

                            {
                                graphData.relationships.length
                            } RELATIONSHIPS

                        </span>

                    </div>


                    {/* =================================================
                        YEARS
                    ================================================= */}

                    <div className="overview-years">

                        <div />


                        <div className="overview-year-track">

                            {YEAR_MARKS.map(
                                (year) => (

                                    <span
                                        key={
                                            year.value
                                        }
                                        style={{
                                            left:
                                                `${getYearPercent(
                                                    year.value
                                                )}%`,
                                        }}
                                    >
                                        {
                                            year.label
                                        }
                                    </span>

                                )
                            )}

                        </div>

                    </div>


                    {/* =================================================
                        ROWS
                    ================================================= */}

                    <div className="overview-rows">

                        {rows.map(
                            (row) => (

                                <div
                                    key={
                                        row.id
                                    }
                                    className={
                                        `overview-row row-${row.id.toLowerCase()}`
                                    }
                                >

                                    <button
                                        type="button"
                                        className="overview-row-name"
                                        onClick={() =>
                                            openTrend(
                                                row.id
                                            )
                                        }
                                    >

                                        <strong>
                                            {
                                                row.ko
                                            }
                                        </strong>


                                        <span>
                                            {
                                                row.en
                                            }
                                        </span>


                                        <small>
                                            CLICK TO EXPLORE
                                        </small>

                                    </button>


                                    <div className="overview-track">

                                        <div className="overview-track-line" />


                                        {row.points.map(
                                            (point) => (

                                                <button
                                                    key={
                                                        point.id
                                                    }
                                                    type="button"
                                                    className="overview-event"
                                                    style={{
                                                        left:
                                                            `${getYearPercent(
                                                                point.yearValue
                                                            )}%`,
                                                    }}
                                                    onClick={() =>
                                                        openTrend(
                                                            row.id
                                                        )
                                                    }
                                                >

                                                    <span className="overview-node">
                                                        <i />
                                                    </span>


                                                    <span className="overview-node-text">

                                                        <b>
                                                            {
                                                                point.yearLabel
                                                            }
                                                        </b>


                                                        <strong>
                                                            {
                                                                point.title
                                                            }
                                                        </strong>

                                                    </span>

                                                </button>

                                            )
                                        )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>


                    {/* =================================================
                        Y2K
                    ================================================= */}

                    <div className="overview-y2k">

                        <span>
                            ★
                        </span>

                        <strong>
                            Y2K
                        </strong>

                        <small>
                            BRIDGE
                        </small>

                    </div>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="overview-footer">

                    <div className="overview-footer-copy">

                        <span>
                            전체 화면은 대표 시점만 표시합니다.
                        </span>

                        <strong>
                            패션 선택 → 실제 Neo4j 관계 네트워크
                        </strong>

                    </div>


                    {/* =============================================
                        NEXT PAGE BUTTON
                    ============================================= */}

                    <button
                        type="button"
                        className="overview-next-button"
                        onClick={
                            openPatternAnalysis
                        }
                    >

                        <span className="overview-next-icon">

                            <ScanSearch
                                size={15}
                            />

                        </span>


                        <span className="overview-next-text">

                            <small>
                                NEXT ANALYSIS
                            </small>

                            <strong>
                                유행 유형 분석
                            </strong>

                        </span>


                        <ArrowRight
                            className="overview-next-arrow"
                            size={17}
                        />

                    </button>

                </footer>

            </main>

        </div>
    );
}


export default TrendFlowPage;