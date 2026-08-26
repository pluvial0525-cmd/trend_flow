import {
    ArrowLeft,
    ArrowRight,
    ImageIcon,
    MousePointerClick,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "../styles/TrendImageAnalysisPage.css";


/* =========================================================
   GROUP
========================================================= */

const GROUP_INFO = {
    past_skinny: {
        short: "PAST",
        name: "과거 스키니",
        color: "#ff8a3d",
        className: "past",
    },

    wide_period: {
        short: "WIDE",
        name: "와이드 전성기",
        color: "#22d3ee",
        className: "wide",
    },

    modern_slim: {
        short: "MODERN",
        name: "최근 실루엣",
        color: "#d946ef",
        className: "modern",
    },
};


const FEATURES = [
    "skinny",
    "straight",
    "wide",
];


const FEATURE_LABELS = {
    skinny: "Skinny",
    straight: "Straight",
    wide: "Wide",
};


const FEATURE_KOREAN = {
    skinny: "밀착",
    straight: "일자",
    wide: "넓은 핏",
};


/* =========================================================
   PCA
========================================================= */

function PCAChart({
                      data,
                      selectedGroup,
                      selectedPoint,
                      onPointClick,
                  }) {
    const points =
        data?.pca?.points ?? [];

    const centers =
        data?.pca?.centers ?? {};


    const bounds =
        useMemo(() => {

            if (!points.length) {
                return {
                    minX: -1,
                    maxX: 1,
                    minY: -1,
                    maxY: 1,
                };
            }


            const xs =
                points.map(
                    (point) =>
                        Number(
                            point.pc1
                        )
                );


            const ys =
                points.map(
                    (point) =>
                        Number(
                            point.pc2
                        )
                );


            const minX =
                Math.min(
                    ...xs
                );

            const maxX =
                Math.max(
                    ...xs
                );

            const minY =
                Math.min(
                    ...ys
                );

            const maxY =
                Math.max(
                    ...ys
                );


            const xPadding =
                (
                    maxX -
                    minX
                ) *
                0.08 ||
                0.1;


            const yPadding =
                (
                    maxY -
                    minY
                ) *
                0.08 ||
                0.1;


            return {
                minX:
                    minX -
                    xPadding,

                maxX:
                    maxX +
                    xPadding,

                minY:
                    minY -
                    yPadding,

                maxY:
                    maxY +
                    yPadding,
            };

        }, [points]);


    function normalizePoint(
        pc1,
        pc2,
    ) {
        const x =
            (
                (
                    pc1 -
                    bounds.minX
                ) /
                (
                    bounds.maxX -
                    bounds.minX
                )
            ) *
            88 +
            6;


        const y =
            94 -
            (
                (
                    pc2 -
                    bounds.minY
                ) /
                (
                    bounds.maxY -
                    bounds.minY
                )
            ) *
            88;


        return {
            x,
            y,
        };
    }


    const normalizedPoints =
        useMemo(
            () =>
                points.map(
                    (point) => ({
                        ...point,

                        ...normalizePoint(
                            Number(
                                point.pc1
                            ),

                            Number(
                                point.pc2
                            ),
                        ),
                    })
                ),
            [
                points,
                bounds,
            ]
        );


    const normalizedCenters =
        useMemo(
            () =>
                Object.entries(
                    centers
                ).map(
                    ([
                         group,
                         center,
                     ]) => ({
                        group,

                        ...normalizePoint(
                            Number(
                                center.pc1
                            ),

                            Number(
                                center.pc2
                            ),
                        ),
                    })
                ),
            [
                centers,
                bounds,
            ]
        );


    const hasSelection =
        selectedGroup !==
        null;


    return (
        <div className="pca-chart">

            <div className="axis axis-x" />
            <div className="axis axis-y" />

            <span className="axis-label axis-label-x">
                PC1
            </span>

            <span className="axis-label axis-label-y">
                PC2
            </span>


            {/* =================================================
                IMAGE POINTS
            ================================================= */}

            {normalizedPoints.map(
                (
                    point,
                    index,
                ) => {

                    const info =
                        GROUP_INFO[
                            point.group
                            ];


                    if (!info) {
                        return null;
                    }


                    const groupActive =
                        point.group ===
                        selectedGroup;


                    let state =
                        "point-all";


                    if (
                        hasSelection
                    ) {
                        state =
                            groupActive
                                ? "point-selected"
                                : "point-muted";
                    }


                    const pointIsSelected =
                        selectedPoint
                        &&
                        selectedPoint.group ===
                        point.group
                        &&
                        selectedPoint.filename ===
                        point.filename;


                    return (
                        <button
                            key={
                                `${point.group}-${point.filename}-${index}`
                            }
                            type="button"
                            className={`
                                pca-point
                                ${state}
                                ${
                                pointIsSelected
                                    ? "point-clicked"
                                    : ""
                            }
                            `}
                            style={{
                                left:
                                    `${point.x}%`,

                                top:
                                    `${point.y}%`,

                                "--point-color":
                                info.color,
                            }}
                            onClick={() =>
                                onPointClick(
                                    point
                                )
                            }
                            title={
                                `${info.name} · ${point.filename}`
                            }
                        >
                            <span className="point-core" />
                        </button>
                    );
                }
            )}


            {/* =================================================
                CENTER
            ================================================= */}

            {normalizedCenters.map(
                (center) => {

                    const info =
                        GROUP_INFO[
                            center.group
                            ];


                    if (!info) {
                        return null;
                    }


                    const active =
                        center.group ===
                        selectedGroup;


                    let state =
                        "center-all";


                    if (
                        hasSelection
                    ) {
                        state =
                            active
                                ? "center-selected"
                                : "center-muted";
                    }


                    return (
                        <div
                            key={
                                center.group
                            }
                            className={`
                                pca-center
                                ${state}
                            `}
                            style={{
                                left:
                                    `${center.x}%`,

                                top:
                                    `${center.y}%`,

                                "--point-color":
                                info.color,
                            }}
                        >
                            <span className="center-ring" />

                            <div className="center-label">
                                {info.name}

                                <strong>
                                    중심
                                </strong>
                            </div>
                        </div>
                    );
                }
            )}

        </div>
    );
}


/* =========================================================
   FEATURE GRAPH
========================================================= */

function SimilarityGraph({
                             groups,
                             selectedGroup,
                         }) {
    const graphMax =
        0.30;


    return (
        <div className="similarity-chart">

            <div className="similarity-heading">

                <div>
                    <span className="eyebrow">
                        SILHOUETTE SIMILARITY
                    </span>

                    <h2>
                        실루엣 형태 유사도
                    </h2>

                    <p>
                        각 시기의 이미지가 Skinny · Straight · Wide 중
                        어떤 실루엣과 가까운지 비교
                    </p>
                </div>

            </div>


            <div className="silhouette-scale">

                <div>
                    <strong>
                        Skinny
                    </strong>

                    <span>
                        몸에 밀착
                    </span>
                </div>


                <div className="scale-line">
                    →
                </div>


                <div>
                    <strong>
                        Straight
                    </strong>

                    <span>
                        일자형
                    </span>
                </div>


                <div className="scale-line">
                    →
                </div>


                <div>
                    <strong>
                        Wide
                    </strong>

                    <span>
                        폭이 넓음
                    </span>
                </div>

            </div>


            <div className="feature-comparison">

                {FEATURES.map(
                    (feature) => {

                        const featureValues =
                            groups.map(
                                (group) =>
                                    Number(
                                        group
                                            ?.features
                                            ?.[
                                            feature
                                            ]
                                        ?? 0
                                    )
                            );


                        const maxValue =
                            Math.max(
                                ...featureValues
                            );


                        return (
                            <div
                                className="feature-block"
                                key={feature}
                            >

                                <div className="feature-title">

                                    <strong>
                                        {
                                            FEATURE_LABELS[
                                                feature
                                                ]
                                        }
                                    </strong>

                                    <span>
                                        {
                                            FEATURE_KOREAN[
                                                feature
                                                ]
                                        }
                                    </span>

                                </div>


                                <div className="feature-lines">

                                    {groups.map(
                                        (group) => {

                                            const info =
                                                GROUP_INFO[
                                                    group.id
                                                    ];


                                            if (!info) {
                                                return null;
                                            }


                                            const value =
                                                Number(
                                                    group
                                                        ?.features
                                                        ?.[
                                                        feature
                                                        ]
                                                    ?? 0
                                                );


                                            const width =
                                                Math.min(
                                                    (
                                                        value /
                                                        graphMax
                                                    ) *
                                                    100,

                                                    100
                                                );


                                            const active =
                                                selectedGroup ===
                                                null ||
                                                selectedGroup ===
                                                group.id;


                                            const isMax =
                                                value ===
                                                maxValue;


                                            return (
                                                <div
                                                    className={`
                                                        feature-line
                                                        ${
                                                        active
                                                            ? "active"
                                                            : "muted"
                                                    }
                                                    `}
                                                    key={
                                                        group.id
                                                    }
                                                >

                                                    <div className="feature-period">
                                                        {
                                                            info.short
                                                        }
                                                    </div>


                                                    <div className="feature-track">

                                                        <div
                                                            className="feature-fill"
                                                            style={{
                                                                width:
                                                                    `${width}%`,

                                                                background:
                                                                info.color,
                                                            }}
                                                        />


                                                        {isMax && (
                                                            <span
                                                                className="max-marker"
                                                                style={{
                                                                    color:
                                                                    info.color,
                                                                }}
                                                            >
                                                                MAX
                                                            </span>
                                                        )}

                                                    </div>


                                                    <div className="feature-score">
                                                        {
                                                            value.toFixed(
                                                                3
                                                            )
                                                        }
                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}


/* =========================================================
   SELECTED IMAGE
========================================================= */

function SelectedImagePanel({
                                selectedPoint,
                            }) {
    if (!selectedPoint) {
        return (
            <article className="analysis-card selected-image-section">

                <div className="selected-image-heading">

                    <span className="eyebrow">
                        SELECTED IMAGE
                    </span>

                    <h2>
                        선택 노드 이미지
                    </h2>

                </div>


                <div className="selected-image-empty">

                    <MousePointerClick
                        size={30}
                    />

                    <strong>
                        PCA 노드를 선택하세요
                    </strong>

                    <p>
                        왼쪽 분포도의 점을 클릭하면
                        해당 패션 이미지가 표시됩니다.
                    </p>

                </div>

            </article>
        );
    }


    const info =
        GROUP_INFO[
            selectedPoint.group
            ];


    const imageUrl =
        `/data/clip_skinny/${selectedPoint.group}/${selectedPoint.filename}`;


    return (
        <article className="analysis-card selected-image-section">

            <div className="selected-image-heading">

                <span className="eyebrow">
                    SELECTED IMAGE
                </span>

                <h2>
                    선택 노드 이미지
                </h2>

            </div>


            <div
                className="selected-image-group"
                style={{
                    "--selected-color":
                        info?.color
                        ?? "#ff4d9b",
                }}
            >

                <span>
                    {
                        info?.short
                        ?? "IMAGE"
                    }
                </span>

                <strong>
                    {
                        info?.name
                        ?? selectedPoint.group
                    }
                </strong>

            </div>


            <div className="selected-image-box">

                <img
                    src={
                        imageUrl
                    }
                    alt={
                        `${info?.name ?? ""} ${selectedPoint.filename}`
                    }
                />

            </div>


            <div className="selected-image-meta">

                <div>

                    <span>
                        IMAGE
                    </span>

                    <strong>
                        {
                            selectedPoint.filename
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        PCA
                    </span>

                    <strong>
                        {
                            Number(
                                selectedPoint.pc1
                            ).toFixed(3)
                        }
                        {" / "}
                        {
                            Number(
                                selectedPoint.pc2
                            ).toFixed(3)
                        }
                    </strong>

                </div>

            </div>


            <div className="selected-image-caption">

                <ImageIcon
                    size={14}
                />

                이 점이 실제 분석에 사용된 이미지입니다.

            </div>

        </article>
    );
}


/* =========================================================
   PAGE
========================================================= */

export default function TrendImageAnalysisPage() {
    const navigate =
        useNavigate();


    const [
        data,
        setData,
    ] =
        useState(null);


    const [
        selectedGroup,
        setSelectedGroup,
    ] =
        useState(null);


    const [
        selectedPoint,
        setSelectedPoint,
    ] =
        useState(null);

    useEffect(() => {

        function handleVoiceCommand(event) {

            const type =
                event.detail?.type;

            const command =
                event.detail?.command;

            console.log(
                "[IMAGE ANALYSIS VOICE]",
                type,
                command
            );


            if (
                type === "SHOW_ALL"
            ) {

                setSelectedGroup(null);
                setSelectedPoint(null);

                return;
            }


            if (
                type === "SHOW_PAST"
            ) {

                setSelectedGroup(
                    "past_skinny"
                );

                setSelectedPoint(null);

                return;
            }


            if (
                type === "SHOW_WIDE"
            ) {

                setSelectedGroup(
                    "wide_period"
                );

                setSelectedPoint(null);

                return;
            }


            if (
                type === "SHOW_MODERN"
            ) {

                setSelectedGroup(
                    "modern_slim"
                );

                setSelectedPoint(null);
            }
        }


        window.addEventListener(
            "trend-image-analysis-voice-command",
            handleVoiceCommand
        );


        return () => {

            window.removeEventListener(
                "trend-image-analysis-voice-command",
                handleVoiceCommand
            );
        };

    }, []);


    useEffect(() => {

        fetch(
            "/data/embedding_analysis.json"
        )
            .then(
                (response) =>
                    response.json()
            )
            .then(
                (result) =>
                    setData(
                        result
                    )
            )
            .catch(
                (error) =>
                    console.error(
                        "Embedding analysis load error:",
                        error
                    )
            );

    }, []);


    if (!data) {
        return (
            <div className="embedding-page">

                <div className="embedding-loading">
                    분석 데이터 로딩 중...
                </div>

            </div>
        );
    }


    const groups =
        data?.groups ?? [];


    function selectGroup(
        group,
    ) {
        setSelectedGroup(
            (
                current
            ) =>
                current ===
                group
                    ? null
                    : group
        );

        setSelectedPoint(
            null
        );
    }


    function selectAll() {
        setSelectedGroup(
            null
        );

        setSelectedPoint(
            null
        );
    }


    function handlePointClick(
        point,
    ) {
        setSelectedPoint(
            point
        );
    }


    return (
        <div className="embedding-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="embedding-header">

                {/* 왼쪽 제목 */}
                <div className="header-title">

                    <h1>
                        과거의 스키니진은{" "}

                        <strong>
                            어떤 형태로 돌아왔을까?
                        </strong>
                    </h1>

                </div>


                {/* 오른쪽 위 - Trend Flow */}
                <button
                    type="button"
                    className="flow-page-button"
                    onClick={() =>
                        navigate("/trend-pattern")                    }
                >
                    <ArrowLeft size={15} />

                    유행 분석
                </button>

            </header>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="embedding-main">


                {/* =================================================
                    FILTER
                ================================================= */}

                <section className="analysis-filter">

                    <div className="filter-title">



                    </div>


                    <div className="filter-buttons">

                        <button
                            className={`
                                period-button
                                all
                                ${
                                selectedGroup ===
                                null
                                    ? "selected"
                                    : ""
                            }
                            `}
                            onClick={
                                selectAll
                            }
                        >
                            전체 비교
                        </button>


                        {Object.entries(
                            GROUP_INFO
                        ).map(
                            ([
                                 key,
                                 info,
                             ]) => (
                                <button
                                    key={key}
                                    className={`
                                        period-button
                                        ${info.className}
                                        ${
                                        selectedGroup ===
                                        key
                                            ? "selected"
                                            : ""
                                    }
                                    `}
                                    onClick={() =>
                                        selectGroup(
                                            key
                                        )
                                    }
                                >

                                    <span>
                                        {info.short}
                                    </span>

                                    {info.name}

                                </button>
                            )
                        )}

                    </div>

                </section>


                {/* =================================================
                    ANALYSIS
                ================================================= */}

                <section className="analysis-grid">


                    {/* =================================================
                        PCA
                    ================================================= */}

                    <article className="analysis-card pca-section">

                        <div className="section-heading">

                            <div>

                                <span className="eyebrow">
                                    IMAGE EMBEDDING SPACE
                                </span>

                                <h2>
                                    이미지 특징 분포
                                </h2>

                                <p>
                                    전체 이미지의 CLIP 특징을
                                    PCA로 2차원 축소한 상대적 위치
                                </p>

                            </div>


                            <div className="legend">

                                {Object.entries(
                                    GROUP_INFO
                                ).map(
                                    ([
                                         key,
                                         info,
                                     ]) => {

                                        const active =
                                            selectedGroup ===
                                            null ||
                                            selectedGroup ===
                                            key;


                                        return (
                                            <div
                                                key={key}
                                                className={`
                                                    legend-item
                                                    ${
                                                    active
                                                        ? "legend-active"
                                                        : ""
                                                }
                                                `}
                                            >
                                                <span
                                                    className="legend-dot"
                                                    style={{
                                                        background:
                                                        info.color,
                                                    }}
                                                />

                                                {info.name}
                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>


                        <PCAChart
                            data={data}
                            selectedGroup={
                                selectedGroup
                            }
                            selectedPoint={
                                selectedPoint
                            }
                            onPointClick={
                                handlePointClick
                            }
                        />


                        <div className="chart-meaning">



                        </div>

                    </article>


                    {/* =================================================
                        SILHOUETTE
                    ================================================= */}

                    <article className="analysis-card similarity-section">

                        <SimilarityGraph
                            groups={groups}
                            selectedGroup={
                                selectedGroup
                            }
                        />

                    </article>


                    {/* =================================================
                        SELECTED IMAGE
                    ================================================= */}

                    <SelectedImagePanel
                        selectedPoint={
                            selectedPoint
                        }
                    />

                </section>


                {/* =================================================
                    RESULT
                ================================================= */}

                <section className="embedding-result">

                    <div className="result-label">
                        RESULT
                    </div>


                    <div className="result-flow">

                        <div className="result-stage past">

                            <span>
                                PAST
                            </span>

                            <strong>
                                Skinny
                            </strong>

                            <small>
                                밀착 실루엣
                            </small>

                        </div>


                        <div className="result-arrow">
                            →
                        </div>


                        <div className="result-stage wide">

                            <span>
                                WIDE PERIOD
                            </span>

                            <strong>
                                Wide
                            </strong>

                            <small>
                                넓은 실루엣
                            </small>

                        </div>


                        <div className="result-arrow">
                            →
                        </div>


                        <div className="result-stage modern">

                            <span>
                                RECENT
                            </span>

                            <strong>
                                Mixed Silhouette
                            </strong>

                            <small>
                                Skinny · Straight · Wide 혼합
                            </small>

                        </div>

                    </div>


                    <div className="result-description">

                        <strong>
                            최근 스키니 스타일은
                            과거와 완전히 같은 형태로 돌아왔을까?
                        </strong>

                        <p>
                            최근에는 Skinny 특징이 다시 강해졌지만,
                            Straight와 Wide 특징도 함께 나타나
                            과거의 형태가 그대로 복귀하기보다
                            혼합된 실루엣으로 재해석되고 있습니다.
                        </p>

                    </div>

                </section>

            </main>


            {/* =================================================
                NEXT PAGE
            ================================================= */}

            <button
                type="button"
                className="rag-page-button"
                onClick={() =>
                    navigate("/trend-graphrag")
                }
            >
                GraphRAG 분석

                <ArrowRight
                    size={17}
                />
            </button>


        </div>
    );
}