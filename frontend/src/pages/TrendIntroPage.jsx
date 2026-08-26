import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import "../styles/TrendIntroPage.css";

import {
    detectTrendIntroCommand,
} from "../components/voice/commands/trendIntroCommands";


const SERIES = [
    {
        key: "skinny",
        label: "스키니진",
        image:
            "/images/trend-intro/skinny.jpg",
        className: "skinny",
    },

    {
        key: "duffle",
        label: "떡볶이 코트",
        image:
            "/images/trend-intro/duffle.jpg",
        className: "duffle",
    },

    {
        key: "ugg",
        label: "어그부츠",
        image:
            "/images/trend-intro/ugg.jpg",
        className: "ugg",
    },

    {
        key: "lowrise",
        label: "로우라이즈",
        image:
            "/images/trend-intro/lowrise.jpg",
        className: "lowrise",
    },

    {
        key: "velour",
        label: "벨루어 트랙수트",
        image:
            "/images/trend-intro/velour.jpg",
        className: "velour",
    },
];


const CHART = {
    width: 1400,
    height: 360,

    left: 65,
    right: 25,

    top: 24,
    bottom: 42,
};


function TrendIntroPage() {

    const navigate =
        useNavigate();


    const [
        trendData,
        setTrendData,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    // ================================
    // 마우스를 올려둔 그래프
    // ================================

    const [
        hoveredSeries,
        setHoveredSeries,
    ] = useState(null);


    // ================================
    // 클릭해서 고정한 그래프
    // ================================

    const [
        selectedSeries,
        setSelectedSeries,
    ] = useState(null);


    // 마우스가 올라가 있으면 hover가 우선,
    // 아니면 클릭된 그래프를 표시
    const activeSeries =
        hoveredSeries || selectedSeries;

    // =========================================================
// VOICE COMMAND
//
// VoiceCommandBar가 음성을 인식한 뒤
//
// window.dispatchEvent(
//     new CustomEvent(
//         "trend-voice-command",
//         {
//             detail: {
//                 command: "..."
//             }
//         }
//     )
// );
//
// 형태로 전달한다고 가정한다.
// =========================================================

    useEffect(
        () => {

            function handleVoiceCommand(
                event
            ) {

                const rawCommand =
                    event.detail?.command
                    || "";


                if (!rawCommand) {
                    return;
                }


                const command =
                    detectTrendIntroCommand(
                        rawCommand
                    );


                console.log(
                    "[TREND INTRO VOICE]",
                    rawCommand,
                    command
                );


                if (!command) {
                    return;
                }


                // =============================================
                // 현재 페이지 안에서 그래프 선택
                // =============================================

                if (
                    command.type ===
                    "SELECT_TREND"
                ) {

                    setHoveredSeries(
                        null
                    );


                    setSelectedSeries(
                        command.trend
                    );


                    console.log(
                        "[TREND INTRO SELECT]",
                        command.trend
                    );


                    return;
                }


                // =============================================
                // 명확한 페이지 이동 명령
                // =============================================

                if (
                    command.type ===
                    "NAVIGATE"
                ) {

                    navigate(
                        command.path
                    );
                }
            }


            window.addEventListener(
                "trend-intro-voice-command",
                handleVoiceCommand
            );


            return () => {

                window.addEventListener(
                    "trend-intro-voice-command",
                    handleVoiceCommand
                );
            };

        },
        [navigate]
    );


    useEffect(() => {

        async function loadData() {

            try {

                const response =
                    await fetch(
                        "/data/trends/trend_interest_merged.json"
                    );


                const json =
                    await response.json();


                setTrendData(
                    json.data || []
                );

            } catch (error) {

                console.error(
                    "Trend interest load failed:",
                    error
                );

            } finally {

                setLoading(false);
            }
        }


        loadData();

    }, []);


    const chartData =
        useMemo(
            () => {

                return trendData.map(
                    (row) => {

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
                                year +
                                (
                                    month - 1
                                )
                                / 12,
                        };
                    }
                );

            },
            [trendData]
        );


    const xMin =
        useMemo(
            () => {

                if (
                    chartData.length ===
                    0
                ) {
                    return 2004;
                }

                return Math.min(
                    ...chartData.map(
                        (d) =>
                            d.numericDate
                    )
                );

            },
            [chartData]
        );


    const xMax =
        useMemo(
            () => {

                if (
                    chartData.length ===
                    0
                ) {
                    return 2026;
                }

                return Math.max(
                    ...chartData.map(
                        (d) =>
                            d.numericDate
                    )
                );

            },
            [chartData]
        );


    const innerWidth =
        CHART.width
        - CHART.left
        - CHART.right;


    const innerHeight =
        CHART.height
        - CHART.top
        - CHART.bottom;


    function scaleX(value) {

        return (
            CHART.left
            +
            (
                value - xMin
            )
            /
            (
                xMax - xMin
            )
            *
            innerWidth
        );
    }


    function scaleY(value) {

        return (
            CHART.top
            +
            (
                100 - value
            )
            /
            100
            *
            innerHeight
        );
    }


    function buildPath(key) {

        let path = "";

        let drawing = false;


        chartData.forEach(
            (row) => {

                const value =
                    row[key];


                if (
                    value === null
                    ||
                    value === undefined
                ) {

                    drawing = false;
                    return;
                }


                const x =
                    scaleX(
                        row.numericDate
                    );

                const y =
                    scaleY(value);


                if (!drawing) {

                    path +=
                        `M ${x} ${y}`;

                    drawing = true;

                } else {

                    path +=
                        ` L ${x} ${y}`;
                }
            }
        );


        return path;
    }


    // ================================
    // 범례 클릭
    // 같은 항목 재클릭 = 선택 해제
    // ================================

    function handleLegendClick(key) {

        setSelectedSeries(
            (current) =>
                current === key
                    ? null
                    : key
        );
    }


    const ticks = [
        2004,
        2008,
        2012,
        2016,
        2020,
        2024,
        2026,
    ];


    return (
        <main className="trend-intro-page">

            {/* ============================================
                HEADER
            ============================================ */}

            <header className="trend-intro-header">

                <button
                    type="button"
                    className="trend-intro-back"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    <ArrowLeft
                        size={17}
                    />

                    이전
                </button>


                <div className="trend-intro-title">

                    <h1>
                        이 유행은,
                        {" "}

                        <strong>
                            다시 돌아올 수 있을까?
                        </strong>
                    </h1>

                </div>

            </header>


            {/* ============================================
                FASHION IMAGES
            ============================================ */}

            <section className="fashion-strip">

                {
                    SERIES.map(
                        (item) => (

                            <article
                                className={
                                    `fashion-card ${
                                        item.className
                                    }`
                                }
                                key={
                                    item.key
                                }
                            >

                                <div className="fashion-image-wrap">

                                    <img
                                        src={
                                            item.image
                                        }
                                        alt={
                                            item.label
                                        }
                                    />

                                </div>


                                <div className="fashion-name">

                                    <i />

                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>

                                </div>

                            </article>

                        )
                    )
                }

            </section>


            {/* ============================================
                CHART
            ============================================ */}

            <section className="interest-panel">

                <div className="interest-heading">

                    <div>

                        <span>
                            GOOGLE TRENDS · KOREA
                        </span>

                        <h2>
                            검색 관심도 변화
                        </h2>

                    </div>


                    {/* ====================================
                        LEGEND

                        hover:
                        마우스를 올린 동안 임시 강조

                        click:
                        클릭하면 선택 고정

                        re-click:
                        같은 항목 다시 클릭하면 해제
                    ==================================== */}

                    <div className="trend-legend">

                        {
                            SERIES.map(
                                (item) => {

                                    const isSelected =
                                        selectedSeries
                                        ===
                                        item.key;


                                    return (

                                        <button
                                            type="button"
                                            key={
                                                item.key
                                            }
                                            className={
                                                `
                                                legend-item
                                                ${item.className}
                                                ${
                                                    isSelected
                                                        ? "active"
                                                        : ""
                                                }
                                                `
                                            }

                                            onMouseEnter={
                                                () =>
                                                    setHoveredSeries(
                                                        item.key
                                                    )
                                            }

                                            onMouseLeave={
                                                () =>
                                                    setHoveredSeries(
                                                        null
                                                    )
                                            }

                                            onClick={
                                                () =>
                                                    handleLegendClick(
                                                        item.key
                                                    )
                                            }
                                        >

                                            <i />

                                            {
                                                item.label
                                            }

                                        </button>

                                    );
                                }
                            )
                        }

                    </div>

                </div>


                <div className="chart-wrap">

                    {
                        loading ? (

                            <div className="chart-loading">
                                관심도 데이터를 불러오는 중...
                            </div>

                        ) : (

                            <svg
                                className="trend-chart"
                                viewBox={
                                    `0 0 ${CHART.width} ${CHART.height}`
                                }
                                preserveAspectRatio="none"
                            >

                                {/* ------------------------
                                    GRID
                                ------------------------ */}

                                {
                                    [
                                        0,
                                        25,
                                        50,
                                        75,
                                        100,
                                    ].map(
                                        (value) => {

                                            const y =
                                                scaleY(
                                                    value
                                                );


                                            return (
                                                <g
                                                    key={
                                                        value
                                                    }
                                                >

                                                    <line
                                                        x1={
                                                            CHART.left
                                                        }
                                                        x2={
                                                            CHART.width
                                                            -
                                                            CHART.right
                                                        }
                                                        y1={y}
                                                        y2={y}
                                                        className="grid-line"
                                                    />

                                                    <text
                                                        x={
                                                            CHART.left
                                                            - 14
                                                        }
                                                        y={
                                                            y + 4
                                                        }
                                                        textAnchor="end"
                                                        className="axis-label"
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


                                {/* ------------------------
                                    YEAR
                                ------------------------ */}

                                {
                                    ticks.map(
                                        (year) => {

                                            const x =
                                                scaleX(
                                                    year
                                                );


                                            return (
                                                <g
                                                    key={
                                                        year
                                                    }
                                                >

                                                    <line
                                                        x1={x}
                                                        x2={x}
                                                        y1={
                                                            CHART.top
                                                        }
                                                        y2={
                                                            CHART.top
                                                            +
                                                            innerHeight
                                                        }
                                                        className="year-line"
                                                    />

                                                    <text
                                                        x={x}
                                                        y={
                                                            CHART.height
                                                            - 13
                                                        }
                                                        textAnchor="middle"
                                                        className="year-label"
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


                                {/* ------------------------
                                    SERIES
                                ------------------------ */}

                                {
                                    SERIES.map(
                                        (item) => {

                                            const faded =
                                                activeSeries
                                                &&
                                                activeSeries
                                                !==
                                                item.key;


                                            const focused =
                                                activeSeries
                                                ===
                                                item.key;


                                            return (
                                                <path
                                                    key={
                                                        item.key
                                                    }
                                                    d={
                                                        buildPath(
                                                            item.key
                                                        )
                                                    }
                                                    className={
                                                        `
                                                        trend-line
                                                        ${item.className}
                                                        ${
                                                            faded
                                                                ? "faded"
                                                                : ""
                                                        }
                                                        ${
                                                            focused
                                                                ? "focused"
                                                                : ""
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

                </div>


                <div className="chart-footer">

                    <span>
                        2004
                    </span>

                    <p>
                        각 패션별 상대적 관심도 변화
                        · 절대 검색량 비교가 아님
                    </p>

                    <span>
                        2026
                    </span>

                </div>

            </section>


            {/* ============================================
                NEXT
            ============================================ */}

            <button
                type="button"
                className="trend-intro-next"
                onClick={() =>
                    navigate(
                        "/trend-city"
                    )
                }
            >
                시뮬레이션

                <ArrowRight
                    size={18}
                />

            </button>

        </main>
    );
}


export default TrendIntroPage;