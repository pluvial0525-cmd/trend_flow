import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    CircleAlert,
    GitBranch,
    Layers3,
    Newspaper,
    PackageSearch,
    Sparkles,
    TrendingUp,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getTrendFlowGraph,
} from "../api/trendFlowApi";

import {
    getGroupNodes,
    getGroupRelationships,
    getTrendFromSlug,
} from "../utils/trendFlowUtils";

import "../styles/trendSignalPage.css";


const TREND_SLUG =
    "skinny-jeans";


function nodeName(node) {
    return (
        node?.name
        || node?.properties?.name
        || ""
    );
}


function relationDate(rel) {
    return String(
        rel?.date
        || rel?.properties?.date
        || rel?.period
        || rel?.properties?.period
        || ""
    );
}


function relationType(rel) {
    return String(
        rel?.type
        || rel?.relationship
        || rel?.properties?.relationship
        || ""
    ).toUpperCase();
}


function relationshipName(
    rel,
    nodeMap,
    side
) {
    const direct =
        side === "source"
            ? (
                rel?.source_name
                || rel?.sourceName
            )
            : (
                rel?.target_name
                || rel?.targetName
            );

    if (direct) {
        return direct;
    }

    const id =
        side === "source"
            ? (
                rel?.source
                || rel?.source_id
                || rel?.sourceId
            )
            : (
                rel?.target
                || rel?.target_id
                || rel?.targetId
            );

    return (
        nodeName(
            nodeMap.get(id)
        )
        || ""
    );
}


function isRecent(rel) {
    const date =
        relationDate(rel);

    return (
        date.includes("2025")
        || date.includes("2026")
    );
}


function TrendSignalPage() {
    const navigate =
        useNavigate();

    const [
        graph,
        setGraph,
    ] =
        useState({
            nodes: [],
            relationships: [],
        });

    const [
        loading,
        setLoading,
    ] =
        useState(true);


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

                    setGraph({
                        nodes:
                            result?.nodes
                            || [],

                        relationships:
                            result?.relationships
                            || [],
                    });
                } catch (error) {
                    console.error(
                        "Trend signal load error:",
                        error
                    );
                } finally {
                    if (!cancelled) {
                        setLoading(false);
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


    const trend =
        useMemo(
            () =>
                getTrendFromSlug(
                    TREND_SLUG
                ),
            []
        );


    const relationships =
        useMemo(
            () => {
                if (!trend) {
                    return [];
                }

                return getGroupRelationships(
                    graph.relationships,
                    trend.id
                );
            },
            [
                graph.relationships,
                trend,
            ]
        );


    const nodes =
        useMemo(
            () => {
                if (!trend) {
                    return [];
                }

                return getGroupNodes(
                    graph.nodes,
                    graph.relationships,
                    trend.id
                );
            },
            [
                graph.nodes,
                graph.relationships,
                trend,
            ]
        );


    const analysis =
        useMemo(
            () => {
                const nodeMap =
                    new Map(
                        nodes.map(
                            (node) => [
                                node.id,
                                node,
                            ]
                        )
                    );

                const recent =
                    relationships.filter(
                        isRecent
                    );

                const findRecentByNames =
                    (names) =>
                        recent.filter(
                            (rel) => {
                                const source =
                                    relationshipName(
                                        rel,
                                        nodeMap,
                                        "source"
                                    );

                                const target =
                                    relationshipName(
                                        rel,
                                        nodeMap,
                                        "target"
                                    );

                                return names.some(
                                    (name) =>
                                        source.includes(name)
                                        || target.includes(name)
                                );
                            }
                        );


                const celebrityMedia =
                    findRecentByNames([
                        "코르티스",
                        "Cosmopolitan",
                        "Harper",
                        "E-Land",
                    ]);


                const transformation =
                    recent.filter(
                        (rel) => {
                            const type =
                                relationType(rel);

                            const source =
                                relationshipName(
                                    rel,
                                    nodeMap,
                                    "source"
                                );

                            const target =
                                relationshipName(
                                    rel,
                                    nodeMap,
                                    "target"
                                );

                            return (
                                [
                                    "REVIVED_AS",
                                    "SHIFTED_TO",
                                    "RELATED_TO",
                                    "STYLE_OF",
                                ].includes(type)
                                || source.includes(
                                    "Modern Slim"
                                )
                                || target.includes(
                                    "Modern Slim"
                                )
                                || source.includes(
                                    "Slim Straight"
                                )
                                || target.includes(
                                    "Slim Straight"
                                )
                            );
                        }
                    );


                const product =
                    findRecentByNames([
                        "MIXXO",
                        "Slim Straight Denim",
                        "Bootcut Denim",
                    ]);


                const revival =
                    findRecentByNames([
                        "Skinny Revival Signal",
                        "스키니 팬츠",
                        "스키니진",
                        "Modern Slim",
                    ]);


                return {
                    nodeCount:
                    nodes.length,

                    relationshipCount:
                    relationships.length,

                    recentCount:
                    recent.length,

                    celebrityMediaCount:
                    celebrityMedia.length,

                    transformationCount:
                    transformation.length,

                    productCount:
                    product.length,

                    revivalCount:
                    revival.length,
                };
            },
            [
                nodes,
                relationships,
            ]
        );


    const signals = [
        {
            icon:
            Newspaper,

            title:
                "유명인·미디어 재노출",

            status:
                analysis.celebrityMediaCount > 0
                    ? "관찰됨"
                    : "확인 필요",

            tone:
                analysis.celebrityMediaCount > 0
                    ? "active"
                    : "weak",

            main:
                "코르티스 착장과 패션 미디어 보도",

            detail:
                "최근 젊은 아이돌 스타일링과 미디어에서 슬림한 하의가 다시 언급되는 관계가 연결됩니다.",

            relation:
                "WORE · FEATURED / DISCUSSED",
        },
        {
            icon:
            Layers3,

            title:
                "실루엣 변화",

            status:
                analysis.transformationCount > 0
                    ? "강한 신호"
                    : "확인 필요",

            tone:
                analysis.transformationCount > 0
                    ? "active"
                    : "weak",

            main:
                "Wide → Straight → Slim",

            detail:
                "와이드 중심 흐름이 좁아지지만, 과거 초밀착형을 그대로 복원하기보다 여유를 남긴 슬림 형태로 이동합니다.",

            relation:
                "SHIFTED_TO · REVIVED_AS",
        },
        {
            icon:
            PackageSearch,

            title:
                "제품·브랜드 신호",

            status:
                analysis.productCount > 0
                    ? "관찰됨"
                    : "제한적",

            tone:
                analysis.productCount > 0
                    ? "active"
                    : "weak",

            main:
                "Slim Straight · Bootcut 제품 등장",

            detail:
                "최근 브랜드 제품이 완전한 스키니보다 슬림 스트레이트와 부츠컷 형태로 나타나고 있습니다.",

            relation:
                "RELEASED · EVIDENCE_OF",
        },
        {
            icon:
            TrendingUp,

            title:
                "대중 확산·소비",

            status:
                "아직 부족",

            tone:
                "caution",

            main:
                "현재 대규모 판매 확산 근거는 부족",

            detail:
                "2009년처럼 뚜렷한 대중 판매 폭증까지 확인된 단계는 아니므로 ‘재유행 확정’으로 보기는 어렵습니다.",

            relation:
                "추가 판매·검색 반응 필요",
        },
    ];


    return (
        <main className="trend-signal-page">

            <header className="signal-header">

                <div className="signal-brand">
                    <span>
                        09 · TREND SIGNAL
                    </span>

                    <strong>
                        스키니진은 다시 돌아오고 있을까?
                    </strong>

                    <small>
                        GraphDB 관계를 모아
                        재등장 신호와 형태 변화를 함께 해석합니다.
                    </small>
                </div>


                <div className="signal-header-actions">

                    <div className="signal-db-state">
                        <i />
                        NEO4J
                        {
                            loading
                                ? " LOADING"
                                : " CONNECTED"
                        }
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/trend-flow/skinny-jeans"
                            )
                        }
                    >
                        <ArrowLeft size={16} />
                        SKINNY JEANS
                    </button>

                </div>

            </header>


            <section className="signal-stage">

                <div className="signal-question-row">

                    <div>
                        <span>
                            GRAPH SIGNAL ANALYSIS
                        </span>

                        <h1>
                            관계가 다시 모이면,
                            <b>
                                {" "}
                                같은 유행일까?
                            </b>
                        </h1>
                    </div>


                    <div className="signal-graph-counts">

                        <div>
                            <strong>
                                {analysis.nodeCount || "—"}
                            </strong>
                            <span>관련 Node</span>
                        </div>

                        <div>
                            <strong>
                                {analysis.relationshipCount || "—"}
                            </strong>
                            <span>관계</span>
                        </div>

                        <div>
                            <strong>
                                {analysis.recentCount || "—"}
                            </strong>
                            <span>최근 신호 관계</span>
                        </div>

                    </div>

                </div>


                <section className="signal-content">

                    <article className="signal-left-panel">

                        <div className="signal-flow-title">

                            <div>
                                <GitBranch size={20} />

                                <span>
                                    흐름 비교
                                </span>
                            </div>

                            <p>
                                과거의 유행과 현재의 재등장 신호가
                                어떤 형태로 이어지는지 봅니다.
                            </p>

                        </div>


                        <div className="silhouette-flow">

                            <div className="flow-era past">
                                <span>2005–2009</span>
                                <strong>
                                    Tight Skinny
                                </strong>
                                <small>
                                    좁은 바지통 · 강한 밀착
                                </small>
                            </div>

                            <ArrowRight
                                className="flow-arrow"
                                size={28}
                            />

                            <div className="flow-era transition">
                                <span>2021</span>
                                <strong>
                                    Wide-Leg
                                </strong>
                                <small>
                                    편안함 · 여유 있는 실루엣
                                </small>
                            </div>

                            <ArrowRight
                                className="flow-arrow"
                                size={28}
                            />

                            <div className="flow-era now">
                                <span>2025–2026</span>
                                <strong>
                                    Modern Slim
                                </strong>
                                <small>
                                    Slim Straight · Bootcut
                                </small>
                            </div>

                        </div>


                        <div className="signal-relation-chain">

                            <div>
                                <span>
                                    과거
                                </span>

                                <strong>
                                    스키니진
                                </strong>
                            </div>

                            <i>
                                SHIFTED_TO
                            </i>

                            <div>
                                <span>
                                    전환
                                </span>

                                <strong>
                                    Wide-Leg
                                </strong>
                            </div>

                            <i>
                                REVIVED_AS
                            </i>

                            <div>
                                <span>
                                    현재
                                </span>

                                <strong>
                                    Modern Slim
                                </strong>
                            </div>

                        </div>


                        <div className="signal-shape-result">

                            <Sparkles size={22} />

                            <div>
                                <span>
                                    형태 판단
                                </span>

                                <strong>
                                    과거 스키니진의
                                    <b>
                                        {" "}그대로 복귀가 아니라
                                    </b>
                                    {" "}
                                    현대적 재해석
                                </strong>
                            </div>

                        </div>

                    </article>


                    <article className="signal-right-panel">

                        <div className="signal-grid">

                            {signals.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const Icon =
                                        item.icon;

                                    return (
                                        <div
                                            className={
                                                `signal-card ${item.tone}`
                                            }
                                            key={item.title}
                                        >

                                            <div className="signal-card-top">

                                                <span className="signal-number">
                                                    0{index + 1}
                                                </span>

                                                <Icon size={19} />

                                                <strong>
                                                    {item.title}
                                                </strong>

                                                <em>
                                                    {item.status}
                                                </em>

                                            </div>


                                            <h3>
                                                {item.main}
                                            </h3>

                                            <p>
                                                {item.detail}
                                            </p>

                                            <small>
                                                {item.relation}
                                            </small>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </article>

                </section>


                <section className="signal-conclusion">

                    <div className="conclusion-label">
                        <span>
                            GRAPHDB RESULT
                        </span>

                        <strong>
                            현재 판단
                        </strong>
                    </div>


                    <div className="conclusion-main">

                        <div className="conclusion-status">
                            <Check size={22} />

                            <div>
                                <small>
                                    재등장 신호
                                </small>

                                <strong>
                                    관찰됨
                                </strong>
                            </div>
                        </div>


                        <div className="conclusion-divider" />


                        <div className="conclusion-status">
                            <Sparkles size={22} />

                            <div>
                                <small>
                                    예상되는 형태
                                </small>

                                <strong>
                                    현대적 슬림 실루엣
                                </strong>
                            </div>
                        </div>


                        <div className="conclusion-divider" />


                        <div className="conclusion-status caution">
                            <CircleAlert size={22} />

                            <div>
                                <small>
                                    대중 확산
                                </small>

                                <strong>
                                    아직 확정하기 어려움
                                </strong>
                            </div>
                        </div>

                    </div>


                    <p className="conclusion-copy">
                        GraphDB에서는
                        <b>
                            {" "}유명인·미디어 → 실루엣 변화 → 제품 등장
                        </b>
                        관계가 다시 연결되고 있습니다.
                        다만 현재 소비 확산 근거가 충분하지 않아,
                        <strong>
                            {" "}“스키니진 재유행 확정”이 아니라
                            “슬림 실루엣 재등장 신호”
                        </strong>
                        로 해석합니다.
                    </p>

                </section>

            </section>

        </main>
    );
}


export default TrendSignalPage;