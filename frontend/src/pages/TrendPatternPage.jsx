import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    Flame,
    RefreshCw,
} from "lucide-react";

import "../styles/trendPatternPage.css";


const PATTERN_DATA = {
    steady: {
        id: "steady",

        title: "지속형",
        trend: "UGG Boots",

        icon: Clock3,

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
                period: "2000s",
                title: "겨울 부츠로 대중화",
                image:
                    "/images/trend/pattern/ugg-2000s.png",
            },

            {
                period: "재연결",
                title: "젊은 소비층으로 확장",
                image:
                    "/images/trend/pattern/ugg-modern.png",
            },

            {
                period: "현재",
                title: "다양한 제품군으로 확장",
                image:
                    "/images/trend/pattern/ugg-current-products.png",
            },
        ],

        finalText:
            "겨울 부츠로 대중적인 인기를 얻은 뒤 젊은 소비층과 다시 연결되고 제품군까지 다양해지면서, 일시적인 유행을 넘어 꾸준히 소비되는 패션 제품으로 자리 잡았습니다.",
    },


    spike: {
        id: "spike",

        title: "급등·소멸형",
        trend: "벨루어 트랙수트",

        icon: Flame,

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
                period: "2000s",
                title: "셀럽 착용으로 대중적 관심",
                image:
                    "/images/trend/pattern/velour-2000s.png",
            },

            {
                period: "유행 확산",
                title: "화려한 셀럽 패션으로 확산",
                image:
                    "/images/trend/pattern/velour-peak.png",
            },

            {
                period: "이후",
                title: "편안한 스포츠웨어 선호 확대",
                image:
                    "/images/trend/pattern/velour-after.png",
            },
        ],

        finalText:
            "셀럽과 연예인들의 착용으로 큰 관심을 얻었지만 화려한 스타일이 대중적인 유행으로 오래 이어지지는 않았습니다. 다만 시상식·무대 의상·특정 스타일링처럼 화려한 연출이 필요한 패션 영역에서는 지금도 하나의 스타일로 남아 있습니다.",
    },


    revival: {
        id: "revival",

        title: "재등장형",
        trend: "스키니진",

        icon: RefreshCw,

        subtitle:
            "과거의 유행이 약해진 뒤 새로운 실루엣과 스타일로 다시 연결되는 흐름",

        description:
            "2000년대 스키니진은 소녀시대를 비롯한 연예인들의 착용과 함께 크게 유행했고, 이후 남녀 모두가 즐겨 입는 대표적인 바지 스타일로 확산됐습니다. 이후 패션 트렌드가 편안하고 자연스러운 와이드·루즈 실루엣으로 이동하면서 스키니진의 영향력은 약해졌습니다. 최근에는 과거의 초밀착형 스키니진이 그대로 돌아오기보다 슬림핏과 다양한 실루엣이 섞인 형태로 연예인과 대중 패션에 다시 등장하고 있습니다.",

        keyword:
            "대중적 유행 → 실루엣 변화 → 새로운 형태로 재연결",

        flowTitle:
            "스키니진은 새로운 실루엣과 섞이며 다시 등장하고 있습니다.",

        stages: [
            {
                period: "2000s",
                title: "셀럽을 통해 스키니진 대중화",
                image:
                    "/images/trend/pattern/skinny-2000s.png",
            },

            {
                period: "이후",
                title: "편안하고 자연스러운 핏 선호",
                image:
                    "/images/trend/pattern/skinny-wide-transition.png",
            },

            {
                period: "최근",
                title: "다양한 Slim 실루엣으로 재등장",

                images: [
                    "/images/trend/pattern/skinny-modern-1.png",
                    "/images/trend/pattern/skinny-modern-2.png",
                ],
            },
        ],

        finalText:
            "소녀시대 등 셀럽을 통해 크게 유행한 뒤 편안한 실루엣 중심으로 바지 트렌드가 이동했지만, 최근에는 과거의 초밀착형 그대로가 아니라 여러 슬림 실루엣과 섞인 형태로 다시 등장하고 있습니다.",
    },
};


const PATTERN_ORDER = [
    "steady",
    "spike",
    "revival",
];


function PatternImage({
                          src,
                          alt,
                      }) {
    const [
        failed,
        setFailed,
    ] = useState(false);


    if (failed) {
        return (
            <div className="pattern-image-fallback">
                이미지 없음
            </div>
        );
    }


    return (
        <img
            src={src}
            alt={alt}
            className="pattern-flow-image"
            onError={() =>
                setFailed(true)
            }
        />
    );
}


function TrendPatternPage() {
    const navigate =
        useNavigate();


    const [
        selectedPattern,
        setSelectedPattern,
    ] =
        useState("steady");


    const current =
        useMemo(
            () =>
                PATTERN_DATA[
                    selectedPattern
                    ],
            [selectedPattern]
        );


    const CurrentIcon =
        current.icon;


    return (
        <main className="trend-pattern-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="pattern-header">

                <button
                    type="button"
                    className="pattern-back"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    <ArrowLeft
                        size={17}
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


            {/* =====================================================
                TOP
            ===================================================== */}

            <section className="pattern-top-layout">

                {/* =================================================
                    LEFT TYPE BUTTONS
                ================================================= */}

                <aside className="pattern-side-tabs">

                    {PATTERN_ORDER.map(
                        (patternId) => {

                            const item =
                                PATTERN_DATA[
                                    patternId
                                    ];


                            const Icon =
                                item.icon;


                            const active =
                                selectedPattern ===
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
                                            size={18}
                                        />

                                    </span>


                                    <div>

                                        <strong>
                                            {item.title}
                                        </strong>

                                        <small>
                                            {item.trend}
                                        </small>

                                    </div>

                                </button>
                            );
                        }
                    )}

                </aside>


                {/* =================================================
                    CENTER GRAPH
                ================================================= */}

                <article className="pattern-graph-panel">

                    <div className="panel-heading">

                        <div>
                            <h2>
                                유행 관계 흐름 비교
                            </h2>

                        </div>


                        <div className="graph-legend">

                            <span
                                className={
                                    selectedPattern ===
                                    "steady"
                                        ? "legend steady active"
                                        : "legend steady"
                                }
                            >
                                UGG
                            </span>


                            <span
                                className={
                                    selectedPattern ===
                                    "spike"
                                        ? "legend spike active"
                                        : "legend spike"
                                }
                            >
                                벨루어
                            </span>


                            <span
                                className={
                                    selectedPattern ===
                                    "revival"
                                        ? "legend revival active"
                                        : "legend revival"
                                }
                            >
                                스키니진
                            </span>

                        </div>

                    </div>


                    <div className="graph-wrapper">

                        <div className="graph-y">

                            관계 활성도

                            <span>
                                ↑
                            </span>

                        </div>


                        <div className="graph-stage">

                            <svg
                                viewBox="0 0 1000 330"
                                preserveAspectRatio="none"
                            >

                                <line
                                    x1="40"
                                    y1="290"
                                    x2="965"
                                    y2="290"
                                    className="graph-axis"
                                />


                                {/* =================================================
                                    UGG - 지속형
                                ================================================= */}

                                <path
                                    d="
                                        M45 210

                                        C150 210,
                                         225 208,
                                         305 198

                                        C385 188,
                                         445 160,
                                         520 150

                                        C600 140,
                                         670 150,
                                         735 163

                                        C815 179,
                                         890 183,
                                         960 183
                                    "
                                    className={
                                        selectedPattern ===
                                        "steady"
                                            ? "graph-line steady selected"
                                            : "graph-line steady muted"
                                    }
                                />


                                {/* =================================================
                                    VELOUR - 급등 소멸형
                                ================================================= */}

                                <path
                                    d="
                                        M45 275

                                        C145 272,
                                         220 265,
                                         290 235

                                        C355 205,
                                         405 130,
                                         475 68

                                        C530 20,
                                         590 23,
                                         625 48

                                        C650 70,
                                         660 110,
                                         668 160

                                        C678 225,
                                         710 252,
                                         775 268

                                        C845 280,
                                         905 286,
                                         960 286
                                    "
                                    className={
                                        selectedPattern ===
                                        "spike"
                                            ? "graph-line spike selected"
                                            : "graph-line spike muted"
                                    }
                                />


                                {/* =================================================
                                    SKINNY - 재등장형
                                ================================================= */}

                                <path
                                    d="
                                        M45 265

                                        C100 235,
                                         140 130,
                                         205 78

                                        C250 45,
                                         305 49,
                                         335 87

                                        C362 120,
                                         355 185,
                                         400 220

                                        C455 260,
                                         530 267,
                                         585 232

                                        C640 197,
                                         670 110,
                                         735 78

                                        C790 52,
                                         850 58,
                                         880 95

                                        C910 132,
                                         902 198,
                                         960 230
                                    "
                                    className={
                                        selectedPattern ===
                                        "revival"
                                            ? "graph-line revival selected"
                                            : "graph-line revival muted"
                                    }
                                />

                            </svg>


                            <span className="graph-start">
                                등장
                            </span>


                            <span className="graph-current">
                                현재
                            </span>

                        </div>

                    </div>

                </article>


                {/* =================================================
                    RIGHT DESCRIPTION
                ================================================= */}

                <aside
                    className={`pattern-description ${selectedPattern}`}
                >

                    <div className="description-title">

                        <span>

                            <CurrentIcon
                                size={22}
                            />

                        </span>


                        <div>

                            <small>
                                {current.trend}
                            </small>

                            <h2>
                                {current.title}
                            </h2>

                        </div>

                    </div>


                    <strong className="description-main">
                        {current.subtitle}
                    </strong>


                    <p>
                        {current.description}
                    </p>


                    <div className="description-key">

                        <span>
                            관계 흐름
                        </span>

                        <strong>
                            {current.keyword}
                        </strong>

                    </div>

                </aside>

            </section>


            {/* =====================================================
                IMAGE FLOW
            ===================================================== */}

            <section className="pattern-image-panel">

                <div className="image-panel-heading">

                    <div>

                        <span>
                            VISUAL FLOW
                        </span>

                        <h2>
                            {current.flowTitle}
                        </h2>

                    </div>

                </div>


                <div className="pattern-image-flow">

                    {current.stages.map(
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

                                        {stage.images
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
                                            {stage.period}
                                        </span>

                                        <strong>
                                            {stage.title}
                                        </strong>

                                    </div>

                                </article>


                                {index <
                                    current
                                        .stages
                                        .length -
                                    1
                                    && (

                                        <div className="pattern-flow-arrow">

                                            <ArrowRight
                                                size={32}
                                            />

                                        </div>

                                    )
                                }

                            </div>

                        )
                    )}

                </div>


                {/* 유형 이름 반복하지 않고 결론만 표시 */}

                <div className="pattern-flow-summary">

                    <strong>
                        {current.finalText}
                    </strong>

                </div>

            </section>


            {/* =====================================================
                FOOTER
            ===================================================== */}

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
                        size={17}
                    />

                </button>

            </footer>

        </main>
    );
}


export default TrendPatternPage;