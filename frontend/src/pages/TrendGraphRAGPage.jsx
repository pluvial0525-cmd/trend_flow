import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    analyzeTrend,
} from "../api/graphrag";

import "../styles/TrendGraphRAGPage.css";


const SAMPLE_QUESTIONS = [
    "스키니진은 다시 유행하고 있어?",
    "벨루어 트랙수트는 왜 다시 등장했어?",
    "떡볶이 코트는 다시 유행할 가능성이 있어?",
    "어그부츠는 왜 다시 등장했어?",
    "로우라이즈는 다시 유행하고 있어?",
];


/* =========================================================
   NODE TYPE
========================================================= */

function getNodeType(labels = []) {

    const priority = [
        "Celebrity",
        "Actor",
        "Designer",
        "Brand",
        "Media",
        "Market",
        "Product",
        "Content",
        "Collection",
        "Concept",
        "Style",
    ];

    return (
        priority.find(
            (label) =>
                labels.includes(label)
        ) || "Default"
    );
}


/* =========================================================
   핵심 관계 판단

   질문에 대한 판단에 직접 쓰기 좋은 관계는
   진하게 보여주고,
   구조 보조용 관계는 조금 약하게 표현
========================================================= */

function isKeyEvidence(item) {

    const keyRelationships = [
        "WORE",
        "SOLD_ON",
        "SALES_INCREASED",
        "SHIFTED_TO",
        "REVIVED_AS",
        "RELEASED",
        "DISCUSSED",
        "LAUNCHED",
        "POPULAR_IN",
        "FEATURED_STYLE",
    ];


    const keyEvidenceTypes = [
        "SALES_RESPONSE",
        "TREND_SHIFT",
        "STYLE_REVIVAL",
        "CELEBRITY_REVIVAL_SIGNAL",
        "CELEBRITY_EXPOSURE",
        "BRAND_RELAUNCH",
        "CULTURAL_REVIVAL",
    ];


    return (
        keyRelationships.includes(
            item.relationship
        )
        ||
        keyEvidenceTypes.includes(
            item.evidence_type
        )
    );
}


/* =========================================================
   GRAPH DATA
========================================================= */

function buildGraph(evidence = []) {

    const nodeMap =
        new Map();

    const links = [];


    evidence.forEach(
        (item, index) => {

            if (
                !item.source ||
                !item.target
            ) {
                return;
            }


            if (
                !nodeMap.has(
                    item.source
                )
            ) {

                nodeMap.set(
                    item.source,
                    {
                        id: item.source,
                        name: item.source,

                        type:
                            getNodeType(
                                item.source_labels
                            ),
                    }
                );
            }


            if (
                !nodeMap.has(
                    item.target
                )
            ) {

                nodeMap.set(
                    item.target,
                    {
                        id: item.target,
                        name: item.target,

                        type:
                            getNodeType(
                                item.target_labels
                            ),
                    }
                );
            }


            links.push({
                id:
                    item.relationship_id ||
                    `${item.source}-${item.target}-${index}`,

                source:
                item.source,

                target:
                item.target,

                relationship:
                item.relationship,

                evidenceLevel:
                item.evidence_level,

                evidenceType:
                item.evidence_type,

                period:
                item.period,

                date:
                item.date,

                context:
                item.context,

                sourceNote:
                item.source_note,

                sourceTitle:
                item.source_title,

                sourceUrl:
                item.source_url,

                isKey:
                    isKeyEvidence(
                        item
                    ),
            });
        }
    );


    return {
        nodes:
            Array.from(
                nodeMap.values()
            ),

        links,
    };
}


/* =========================================================
   NODE POSITION

   원형이지만 세로 공간을 조금 더 활용
========================================================= */

function calculatePositions(
    nodes
) {

    if (!nodes.length) {
        return [];
    }


    const width = 760;
    const height = 520;

    const centerX = 380;
    const centerY = 255;

    const radiusX = 300;
    const radiusY = 195;


    return nodes.map(
        (node, index) => {

            const angle =
                (
                    Math.PI *
                    2 *
                    index
                ) /
                nodes.length
                -
                Math.PI / 2;


            return {
                ...node,

                x:
                    centerX
                    +
                    Math.cos(
                        angle
                    ) *
                    radiusX,

                y:
                    centerY
                    +
                    Math.sin(
                        angle
                    ) *
                    radiusY,
            };
        }
    );
}


/* =========================================================
   긴 노드명 2줄 처리
========================================================= */

function splitNodeName(name) {

    if (!name) {
        return [""];
    }


    // 짧은 이름은 그대로 한 줄
    if (name.length <= 11) {
        return [name];
    }


    const words = name.split(" ");


    // =====================================================
    // 공백이 없는 한글/단일 단어
    // =====================================================

    if (words.length === 1) {

        // 한글처럼 공백 없는 긴 문자열은
        // 최대 10~11자 정도로 두 줄 분리
        const splitIndex =
            Math.ceil(name.length / 2);

        return [
            name.slice(0, splitIndex),
            name.slice(splitIndex),
        ].filter(Boolean);
    }


    // =====================================================
    // 영어/공백 있는 이름
    // 가능한 균형 있게 두 줄 분리
    // =====================================================

    let bestFirst = "";
    let bestSecond = "";

    let bestDifference =
        Number.POSITIVE_INFINITY;


    for (
        let i = 1;
        i < words.length;
        i++
    ) {

        const first =
            words
                .slice(0, i)
                .join(" ");

        const second =
            words
                .slice(i)
                .join(" ");


        const difference =
            Math.abs(
                first.length -
                second.length
            );


        // 너무 긴 줄은 피함
        if (
            first.length <= 16 &&
            second.length <= 18 &&
            difference <
            bestDifference
        ) {

            bestFirst = first;
            bestSecond = second;
            bestDifference =
                difference;
        }
    }


    // 적당한 분리점을 못 찾았을 경우
    if (
        !bestFirst ||
        !bestSecond
    ) {

        const middle =
            Math.ceil(
                words.length / 2
            );


        bestFirst =
            words
                .slice(0, middle)
                .join(" ");


        bestSecond =
            words
                .slice(middle)
                .join(" ");
    }


    return [
        bestFirst,
        bestSecond,
    ].filter(Boolean);
}


/* =========================================================
   AI 답변 section 추출
========================================================= */

function extractSection(
    answer,
    sectionName
) {

    if (!answer) {
        return "";
    }


    const marker =
        `[${sectionName}]`;

    const start =
        answer.indexOf(
            marker
        );


    if (
        start === -1
    ) {
        return "";
    }


    const contentStart =
        start +
        marker.length;


    const nextSection =
        answer.indexOf(
            "\n[",
            contentStart
        );


    const sectionText =
        nextSection === -1
            ? answer.slice(
                contentStart
            )
            : answer.slice(
                contentStart,
                nextSection
            );


    return sectionText
        .replace(
            /\*\*/g,
            ""
        )
        .trim();
}


/* =========================================================
   판단 요약
========================================================= */

function getJudgementLabel(
    answer
) {

    const judgement =
        extractSection(
            answer,
            "현재 판단"
        );


    if (!judgement) {

        return {
            status:
                "GRAPH BASED ANALYSIS",

            title:
                "관계 근거 기반 분석",

            text:
                "Neo4j에서 검색한 관계를 바탕으로 분석했습니다.",
        };
    }


    if (
        judgement.includes(
            "초기 재등장"
        )
        ||
        judgement.includes(
            "재등장 신호"
        )
    ) {

        return {
            status:
                "REVIVAL SIGNAL",

            title:
                "재등장 신호 관찰",

            text:
            judgement,
        };
    }


    if (
        judgement.includes(
            "유행이 확정"
        )
        ||
        judgement.includes(
            "대중적 유행"
        )
    ) {

        return {
            status:
                "TREND ANALYSIS",

            title:
                "유행 상태 분석",

            text:
            judgement,
        };
    }


    return {
        status:
            "GRAPH BASED RESULT",

        title:
            "현재 판단",

        text:
        judgement,
    };
}


/* =========================================================
   PAGE
========================================================= */

function TrendGraphRAGPage() {

    const navigate =
        useNavigate();


    const [
        question,
        setQuestion,
    ] =
        useState(
            "스키니진은 다시 유행하고 있어?"
        );


    const [
        result,
        setResult,
    ] =
        useState(null);


    const [
        loading,
        setLoading,
    ] =
        useState(false);


    const [
        error,
        setError,
    ] =
        useState("");


    const [
        selectedEdge,
        setSelectedEdge,
    ] =
        useState(null);


    /* -----------------------------
       GRAPH
    ----------------------------- */

    const graph =
        useMemo(
            () =>
                buildGraph(
                    result?.evidence ||
                    []
                ),
            [result]
        );


    const positionedNodes =
        useMemo(
            () =>
                calculatePositions(
                    graph.nodes
                ),
            [graph.nodes]
        );


    const nodePositionMap =
        useMemo(
            () => {

                const map =
                    new Map();


                positionedNodes.forEach(
                    (node) => {

                        map.set(
                            node.id,
                            node
                        );
                    }
                );


                return map;
            },
            [positionedNodes]
        );


    const judgement =
        useMemo(
            () =>
                getJudgementLabel(
                    result?.answer
                ),
            [result]
        );


    /* -----------------------------
       API
    ----------------------------- */

    async function handleAnalyze(
        customQuestion = null
    ) {

        const targetQuestion =
            (
                customQuestion ??
                question
            ).trim();


        if (!targetQuestion) {
            return;
        }


        setQuestion(
            targetQuestion
        );

        setLoading(true);

        setError("");

        setSelectedEdge(null);


        try {

            const data =
                await analyzeTrend(
                    targetQuestion
                );


            setResult(
                data
            );

        } catch (err) {

            console.error(
                err
            );


            setResult(
                null
            );


            setError(
                err?.message ||
                "GraphRAG 분석 중 오류가 발생했습니다."
            );

        } finally {

            setLoading(false);
        }
    }

    // =========================================================
    // VOICE COMMAND
    // =========================================================

    useEffect(() => {

        function handleVoiceCommand(event) {

            const {
                type,
                question: voiceQuestion,
                command,
            } = event.detail || {};

            console.log(
                "[GRAPHRAG VOICE EVENT]",
                type,
                voiceQuestion,
                command
            );


            if (
                type === "ANALYZE_TREND"
                &&
                voiceQuestion
            ) {

                handleAnalyze(
                    voiceQuestion
                );
            }
        }


        window.addEventListener(
            "trend-graphrag-voice-command",
            handleVoiceCommand
        );


        return () => {

            window.removeEventListener(
                "trend-graphrag-voice-command",
                handleVoiceCommand
            );
        };

    }, []);


    function handleKeyDown(
        event
    ) {

        if (
            event.key ===
            "Enter"
        ) {

            handleAnalyze();
        }
    }


    return (
        <div className="graphrag-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="graphrag-header">

                <button
                    className="graphrag-back"
                    onClick={() => navigate("/trend-image-analysis")}
                >
                    ← 이전
                </button>


                <div className="graphrag-header-title">

                    <h1>
                        관계를 따라
                        <strong>
                            {" "}
                            유행을 분석하다
                        </strong>
                    </h1>

                    <p>
                        Neo4j에서 관련 관계를 검색하고,
                        검색된 근거만으로 AI가 트렌드를 분석합니다.
                    </p>

                </div>


                <button
                    className="top-insight-btn"
                    onClick={() => navigate("/trend-insight")}
                >
                    프로젝트를 마치며
                    <span>→</span>
                </button>

            </header>


            <main className="graphrag-main">

                {/* =================================================
                    QUESTION
                ================================================= */}

                <section className="question-section">

                    <div className="question-input-wrap">

                        <span className="question-icon">
                            ?
                        </span>


                        <input
                            value={
                                question
                            }

                            onChange={
                                (
                                    event
                                ) =>
                                    setQuestion(
                                        event
                                            .target
                                            .value
                                    )
                            }

                            onKeyDown={
                                handleKeyDown
                            }

                            placeholder="패션 트렌드에 대해 질문해보세요."
                        />


                        <button
                            onClick={
                                () =>
                                    handleAnalyze()
                            }

                            disabled={
                                loading
                            }
                        >
                            {
                                loading
                                    ? "분석 중..."
                                    : "GraphRAG 분석"
                            }
                        </button>

                    </div>


                    <div className="sample-questions">

                        <span>
                            질문 예시
                        </span>


                        {
                            SAMPLE_QUESTIONS.map(
                                (
                                    sample
                                ) => (

                                    <button
                                        key={
                                            sample
                                        }

                                        onClick={
                                            () =>
                                                handleAnalyze(
                                                    sample
                                                )
                                        }
                                    >
                                        {
                                            sample
                                        }
                                    </button>

                                )
                            )
                        }

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {
                    error && (

                        <div className="graphrag-error">
                            {error}
                        </div>

                    )
                }


                {/* =================================================
                    EMPTY
                ================================================= */}

                {
                    !result &&
                    !loading &&
                    !error && (

                        <section className="graphrag-empty">

                            <div className="empty-graph">
                                ◉
                            </div>

                            <h2>
                                그래프에 질문해보세요
                            </h2>

                            <p>
                                질문과 관련된 관계를
                                Neo4j에서 찾아 분석합니다.
                            </p>

                        </section>

                    )
                }


                {/* =================================================
                    LOADING
                ================================================= */}

                {
                    loading && (

                        <section className="graphrag-loading">

                            <div className="loading-orbit">
                                <span />
                                <span />
                                <span />
                            </div>

                            <h2>
                                GraphRAG 분석 중
                            </h2>

                            <p>
                                관련 노드와 관계를 검색하고
                                근거를 구성하고 있습니다.
                            </p>

                        </section>

                    )
                }


                {/* =================================================
                    RESULT
                ================================================= */}

                {
                    result &&
                    !loading && (

                        <>

                            {/* -----------------------------------------
                                SUMMARY
                            ----------------------------------------- */}




                            {/* -----------------------------------------
                                MAIN
                            ----------------------------------------- */}

                            <section className="analysis-layout">

                                {/* =================================================
                                    LEFT GRAPH
                                ================================================= */}

                                <div className="graph-panel">

                                    <div className="panel-heading">

                                        <div>

                                            <h2>
                                                질문에 사용된 관계
                                            </h2>

                                        </div>


                                        <div className="graph-legend">

                                            <span>
                                                <i className="fact-dot" />
                                                FACT
                                            </span>

                                            <span>
                                                <i className="association-dot" />
                                                ASSOCIATION
                                            </span>

                                            <span>
                                                <i className="key-dot" />
                                                핵심 근거
                                            </span>

                                        </div>

                                    </div>


                                    <div className="graph-canvas">

                                        <svg
                                            viewBox="0 0 760 520"
                                            preserveAspectRatio="xMidYMid meet"
                                        >

                                            <defs>

                                                <marker
                                                    id="arrowFact"
                                                    markerWidth="10"
                                                    markerHeight="10"
                                                    refX="8"
                                                    refY="3"
                                                    orient="auto"
                                                    markerUnits="strokeWidth"
                                                >
                                                    <path
                                                        d="M0,0 L0,6 L9,3 z"
                                                        className="arrow-fact"
                                                    />
                                                </marker>


                                                <marker
                                                    id="arrowAssociation"
                                                    markerWidth="10"
                                                    markerHeight="10"
                                                    refX="8"
                                                    refY="3"
                                                    orient="auto"
                                                    markerUnits="strokeWidth"
                                                >
                                                    <path
                                                        d="M0,0 L0,6 L9,3 z"
                                                        className="arrow-association"
                                                    />
                                                </marker>

                                            </defs>


                                            {/* =============================
                                                EDGES
                                            ============================= */}

                                            {
                                                graph.links.map(
                                                    (
                                                        link
                                                    ) => {

                                                        const source =
                                                            nodePositionMap.get(
                                                                link.source
                                                            );


                                                        const target =
                                                            nodePositionMap.get(
                                                                link.target
                                                            );


                                                        if (
                                                            !source ||
                                                            !target
                                                        ) {
                                                            return null;
                                                        }


                                                        const isFact =
                                                            link.evidenceLevel ===
                                                            "FACT";


                                                        const midX =
                                                            (
                                                                source.x +
                                                                target.x
                                                            ) / 2;


                                                        const midY =
                                                            (
                                                                source.y +
                                                                target.y
                                                            ) / 2;


                                                        return (
                                                            <g
                                                                key={
                                                                    link.id
                                                                }

                                                                className={
                                                                    `graph-edge ${
                                                                        link.isKey
                                                                            ? "key-edge"
                                                                            : "support-edge"
                                                                    }`
                                                                }

                                                                onClick={
                                                                    () =>
                                                                        setSelectedEdge(
                                                                            link
                                                                        )
                                                                }
                                                            >

                                                                <line
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

                                                                    className={
                                                                        `edge-line ${
                                                                            isFact
                                                                                ? "fact"
                                                                                : "association"
                                                                        }`
                                                                    }

                                                                    markerEnd={
                                                                        isFact
                                                                            ? "url(#arrowFact)"
                                                                            : "url(#arrowAssociation)"
                                                                    }
                                                                />


                                                                {
                                                                    link.isKey && (

                                                                        <>
                                                                            <rect
                                                                                x={
                                                                                    midX -
                                                                                    43
                                                                                }

                                                                                y={
                                                                                    midY -
                                                                                    10
                                                                                }

                                                                                width="86"
                                                                                height="20"

                                                                                rx="10"

                                                                                className="edge-label-bg"
                                                                            />


                                                                            <text
                                                                                x={
                                                                                    midX
                                                                                }

                                                                                y={
                                                                                    midY +
                                                                                    4
                                                                                }

                                                                                textAnchor="middle"

                                                                                className="edge-label"
                                                                            >
                                                                                {
                                                                                    link.relationship
                                                                                }
                                                                            </text>
                                                                        </>

                                                                    )
                                                                }

                                                            </g>
                                                        );
                                                    }
                                                )
                                            }


                                            {/* =============================
                                                NODES
                                            ============================= */}

                                            {
                                                positionedNodes.map(
                                                    (
                                                        node
                                                    ) => {

                                                        const lines =
                                                            splitNodeName(
                                                                node.name
                                                            );


                                                        return (
                                                            <g
                                                                key={
                                                                    node.id
                                                                }

                                                                className={
                                                                    `graph-node node-${node.type.toLowerCase()}`
                                                                }
                                                            >

                                                                <circle
                                                                    cx={
                                                                        node.x
                                                                    }

                                                                    cy={
                                                                        node.y
                                                                    }

                                                                    r="27"
                                                                />


                                                                <text
                                                                    x={
                                                                        node.x
                                                                    }

                                                                    y={
                                                                        node.y +
                                                                        4
                                                                    }

                                                                    textAnchor="middle"

                                                                    className="node-letter"
                                                                >
                                                                    {
                                                                        node
                                                                            .name
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                    }
                                                                </text>


                                                                <text
                                                                    x={
                                                                        node.x
                                                                    }

                                                                    y={
                                                                        node.y +
                                                                        43
                                                                    }

                                                                    textAnchor="middle"

                                                                    className="node-name"
                                                                >

                                                                    {
                                                                        lines.map(
                                                                            (
                                                                                line,
                                                                                lineIndex
                                                                            ) => (

                                                                                <tspan
                                                                                    key={
                                                                                        `${node.id}-${lineIndex}`
                                                                                    }

                                                                                    x={
                                                                                        node.x
                                                                                    }

                                                                                    dy={
                                                                                        lineIndex === 0
                                                                                            ? 0
                                                                                            : 11
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        line
                                                                                    }
                                                                                </tspan>

                                                                            )
                                                                        )
                                                                    }

                                                                </text>

                                                            </g>
                                                        );
                                                    }
                                                )
                                            }

                                        </svg>

                                    </div>


                                    <div className="graph-help">

                                        <strong>
                                            밝은 관계
                                        </strong>

                                        는 질문 판단에 직접 사용되는 핵심 근거입니다.

                                        {" · "}

                                        관계선을 클릭하면 상세 근거를 확인할 수 있습니다.

                                    </div>


                                    {
                                        selectedEdge && (

                                            <div className="edge-detail">

                                                <div className="edge-detail-top">

                                                    <span
                                                        className={
                                                            selectedEdge
                                                                .evidenceLevel ===
                                                            "FACT"
                                                                ? "evidence-badge fact"
                                                                : "evidence-badge association"
                                                        }
                                                    >
                                                        {
                                                            selectedEdge
                                                                .evidenceLevel
                                                        }
                                                    </span>


                                                    <span>
                                                        {
                                                            selectedEdge
                                                                .date
                                                        }
                                                    </span>


                                                    <span>
                                                        {
                                                            selectedEdge
                                                                .period
                                                        }
                                                    </span>

                                                </div>


                                                <h3>

                                                    {
                                                        selectedEdge
                                                            .source
                                                    }

                                                    <b>
                                                        {" "}
                                                        → {
                                                        selectedEdge
                                                            .relationship
                                                    } →
                                                        {" "}
                                                    </b>

                                                    {
                                                        selectedEdge
                                                            .target
                                                    }

                                                </h3>


                                                {
                                                    selectedEdge
                                                        .context && (

                                                        <p>
                                                            {
                                                                selectedEdge
                                                                    .context
                                                            }
                                                        </p>

                                                    )
                                                }


                                                {
                                                    selectedEdge
                                                        .sourceNote && (

                                                        <p className="edge-caution">
                                                            {
                                                                selectedEdge
                                                                    .sourceNote
                                                            }
                                                        </p>

                                                    )
                                                }


                                                {
                                                    selectedEdge
                                                        .sourceUrl && (

                                                        <a
                                                            href={
                                                                selectedEdge
                                                                    .sourceUrl
                                                            }

                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            근거 기사 보기 →
                                                        </a>

                                                    )
                                                }

                                            </div>

                                        )
                                    }

                                </div>


                                {/* =================================================
                                    RIGHT AI
                                ================================================= */}

                                <div className="answer-panel">

                                    <div className="panel-heading">

                                        <div>


                                            <h2>
                                                GraphRAG 분석
                                            </h2>

                                        </div>

                                    </div>


                                    {/* =============================
                                        CURRENT JUDGEMENT
                                    ============================= */}

                                    <div className="judgement-card">

                                        <h3>
                                            {
                                                judgement.title
                                            }
                                        </h3>


                                        <p>
                                            {
                                                judgement.text
                                            }
                                        </p>

                                    </div>





                                    {/* =============================
                                        DETAIL ANSWER
                                    ============================= */}

                                    <div className="answer-content">

                                        {
                                            result
                                                .answer
                                                ?.split("[현재 판단]")[0]
                                                .split("\n")
                                                .map(
                                                    (
                                                        line,
                                                        index
                                                    ) => {

                                                        const trimmed =
                                                            line.trim();


                                                        if (
                                                            !trimmed
                                                        ) {

                                                            return (
                                                                <div
                                                                    key={
                                                                        index
                                                                    }

                                                                    className="answer-space"
                                                                />
                                                            );
                                                        }


                                                        if (
                                                            trimmed ===
                                                            "[현재 판단]"
                                                        ) {

                                                            return null;
                                                        }


                                                        if (
                                                            trimmed.startsWith(
                                                                "["
                                                            )
                                                            &&
                                                            trimmed.endsWith(
                                                                "]"
                                                            )
                                                        ) {

                                                            return (
                                                                <h3
                                                                    key={
                                                                        index
                                                                    }
                                                                >
                                                                    {
                                                                        trimmed
                                                                    }
                                                                </h3>
                                                            );
                                                        }


                                                        return (
                                                            <p
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                {
                                                                    line
                                                                }
                                                            </p>
                                                        );
                                                    }
                                                )
                                        }

                                    </div>

                                </div>

                            </section>

                        </>

                    )
                }

            </main>

        </div>
    );
}


export default TrendGraphRAGPage;