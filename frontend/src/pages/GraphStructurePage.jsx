import {
    ArrowLeft,
    ChevronRight,
    Mic,
} from "lucide-react";
import {
    useMemo,
} from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../styles/graphStructure.css";


const AVATARS = [
    "👩🏻",
    "👨🏻",
    "👩🏽",
    "👨🏽",
    "👩🏼",
    "👨🏼",
    "👩🏿",
    "👨🏿",
    "👵🏻",
    "👴🏻",
    "🧑🏻",
    "🧑🏽",
];


const MINI_POSITIONS = [
    { x: 17, y: 52 },
    { x: 31, y: 24 },
    { x: 48, y: 18 },
    { x: 74, y: 22 },
    { x: 86, y: 48 },
    { x: 77, y: 76 },
    { x: 55, y: 80 },
    { x: 29, y: 76 },
    { x: 12, y: 77 },
];


function getSimulationFromStorage() {
    try {
        const raw =
            sessionStorage.getItem(
                "trendCity:lastSimulation"
            );

        return raw
            ? JSON.parse(raw)
            : null;

    } catch (error) {
        console.error(
            "시뮬레이션 저장 데이터를 읽지 못했습니다.",
            error
        );

        return null;
    }
}


function idNumber(id) {
    return (
        Number(
            String(id || "")
                .replace(/\D/g, "")
        )
        || 0
    );
}


function avatarFor(id) {
    return AVATARS[
    idNumber(id)
    % AVATARS.length
        ];
}


function channelLabel(channel) {
    const labels = {
        WORD_OF_MOUTH: "입소문",
        SNS: "SNS",
        VIDEO: "영상",
        COMMUNITY: "커뮤니티",
    };

    return (
        labels[channel]
        || channel
        || "전달"
    );
}


function citizenName(person, fallbackId) {
    if (person?.name) {
        return person.name;
    }

    const number =
        idNumber(
            person?.id
            || fallbackId
        );

    return number
        ? `시민 ${number}`
        : "시민";
}


function buildMiniGraph(simulation) {
    const peopleMap =
        new Map(
            (simulation?.nodes || [])
                .map((person) => [
                    person.id,
                    person,
                ])
        );

    if (simulation?.starter?.id) {
        peopleMap.set(
            simulation.starter.id,
            simulation.starter
        );
    }

    const events =
        (simulation?.spread_events || [])
            .slice()
            .sort(
                (a, b) =>
                    (a.step ?? 0)
                    - (b.step ?? 0)
            );

    const starterId =
        simulation?.starter?.id
        || events[0]?.source;

    const selectedIds =
        new Set();

    if (starterId) {
        selectedIds.add(starterId);
    }

    let changed = true;

    while (
        selectedIds.size < 9
        && changed
        ) {
        changed = false;

        for (const event of events) {
            if (
                selectedIds.size >= 9
            ) {
                break;
            }

            if (
                selectedIds.has(
                    event.source
                )
                && !selectedIds.has(
                    event.target
                )
            ) {
                selectedIds.add(
                    event.target
                );

                changed = true;
            }
        }
    }

    for (
        const item
        of simulation?.timeline || []
        ) {
        for (
            const personId
            of item.new_people || []
            ) {
            if (
                selectedIds.size >= 9
            ) {
                break;
            }

            selectedIds.add(
                personId
            );
        }

        if (
            selectedIds.size >= 9
        ) {
            break;
        }
    }

    const ids =
        Array.from(selectedIds)
            .slice(0, 9);

    const idSet =
        new Set(ids);

    const miniEvents =
        events
            .filter(
                (event) =>
                    idSet.has(
                        event.source
                    )
                    && idSet.has(
                        event.target
                    )
            )
            .slice(0, 10);

    const nodes =
        ids.map(
            (personId, index) => ({
                id: personId,
                person:
                    peopleMap.get(
                        personId
                    )
                    || {
                        id: personId,
                        name:
                            `시민 ${idNumber(
                                personId
                            )}`,
                    },
                starter:
                    personId
                    === starterId,
                position: {
                    ...MINI_POSITIONS[
                    index
                    % MINI_POSITIONS.length
                        ],
                },
            })
        );

    const focusEvent =
        miniEvents.find(
            (event) =>
                event.channel === "SNS"
        )
        || miniEvents[0]
        || events[0];

    const focusNodeId =
        focusEvent?.target
        || starterId;

    /*
     * 실제 관계 예시가 한눈에 보이도록
     * source / target만 설명용 위치로 재배치합니다.
     */
    if (focusEvent) {
        const sourceNode =
            nodes.find(
                (node) =>
                    node.id
                    === focusEvent.source
            );

        const targetNode =
            nodes.find(
                (node) =>
                    node.id
                    === focusEvent.target
            );

        if (sourceNode) {
            sourceNode.position = {
                x: 62,
                y: 55,
            };
        }

        if (targetNode) {
            targetNode.position = {
                x: 29,
                y: 31,
            };
        }
    }

    return {
        nodes,
        edges: miniEvents,
        focusEvent,
        focusNodeId,
        peopleMap,
    };
}


function GraphStructurePage() {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const simulation =
        location.state?.simulation
        || getSimulationFromStorage();

    const miniGraph =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return buildMiniGraph(
                simulation
            );
        }, [simulation]);


    if (
        !simulation
        || !miniGraph
    ) {
        return (
            <main className="graph-structure-page">
                <section className="graph-structure-empty">
                    <span>
                        GRAPH STRUCTURE
                    </span>

                    <h1>
                        시뮬레이션 결과가 필요합니다.
                    </h1>

                    <p>
                        TREND CITY 시뮬레이션을 먼저 실행해주세요.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/trend-city")
                        }
                    >
                        시뮬레이션으로 돌아가기
                    </button>
                </section>
            </main>
        );
    }


    const {
        nodes,
        edges,
        focusEvent,
        focusNodeId,
        peopleMap,
    } = miniGraph;

    const focusPerson =
        peopleMap.get(
            focusNodeId
        )
        || nodes.find(
            (node) =>
                node.id
                === focusNodeId
        )?.person;

    const focusSource =
        peopleMap.get(
            focusEvent?.source
        );

    const focusTarget =
        peopleMap.get(
            focusEvent?.target
        );

    const sourceName =
        citizenName(
            focusSource,
            focusEvent?.source
        );

    const targetName =
        citizenName(
            focusTarget,
            focusEvent?.target
        );

    const channel =
        channelLabel(
            focusEvent?.channel
        );

    const age =
        focusPerson?.age
        ?? focusPerson?.properties?.age
        ?? "-";

    const interestRaw =
        focusPerson?.fashion_interest
        ?? focusPerson?.interest
        ?? focusPerson?.properties?.fashion_interest
        ?? focusPerson?.properties?.interest;

    const interest =
        typeof interestRaw === "number"
            ? (
                interestRaw <= 1
                    ? `${Math.round(
                        interestRaw * 100
                    )}%`
                    : `${Math.round(
                        interestRaw
                    )}%`
            )
            : "-";


    return (
        <main className="graph-structure-page">

            <header className="graph-structure-header">
                <div className="structure-brand">
                    <span>
                        FASHION NETWORK SIMULATION
                    </span>

                    <strong>
                        TREND CITY
                    </strong>
                </div>

                <div className="structure-voice">
                    <i />
                    <Mic size={14} />
                    VOICE PRESENTATION
                </div>

                <button
                    type="button"
                    className="structure-back"
                    onClick={() =>
                        navigate("/trend-city")
                    }
                >
                    <ArrowLeft size={16} />
                    SIMULATION
                </button>
            </header>


            <section className="structure-stage">

                <div className="structure-heading">
                    <p>
                        03
                        <span>
                            GRAPH STRUCTURE
                        </span>
                    </p>

                    <h1>
                        GraphDB 기본 개념 이해하기
                    </h1>

                    <span className="structure-subtitle">
                        방금 본 소문 확산 결과를 이용해
                        GraphDB의 핵심 구조를 하나씩 살펴봅니다.
                    </span>
                </div>


                <section className="structure-content">

                    {/* 실제 결과 - 공간을 줄인 compact 패널 */}
                    <div className="simulation-fragment-panel">

                        <div className="fragment-label">
                            ACTUAL GRAPH
                            <span>
                                실제 시뮬레이션 관계
                            </span>
                        </div>

                        <div className="mini-network">

                            <svg
                                className="mini-network-lines"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <defs>
                                    <marker
                                        id="arrow-history"
                                        markerWidth="6"
                                        markerHeight="6"
                                        refX="5"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <path
                                            d="M0,0 L6,3 L0,6 Z"
                                            fill="#7d6cae"
                                        />
                                    </marker>

                                    <marker
                                        id="arrow-relationship"
                                        markerWidth="7"
                                        markerHeight="7"
                                        refX="6"
                                        refY="3.5"
                                        orient="auto"
                                    >
                                        <path
                                            d="M0,0 L7,3.5 L0,7 Z"
                                            fill="#ffd84d"
                                        />
                                    </marker>
                                </defs>

                                {edges.map(
                                    (
                                        edge,
                                        index
                                    ) => {
                                        const source =
                                            nodes.find(
                                                (node) =>
                                                    node.id
                                                    === edge.source
                                            );

                                        const target =
                                            nodes.find(
                                                (node) =>
                                                    node.id
                                                    === edge.target
                                            );

                                        if (
                                            !source
                                            || !target
                                        ) {
                                            return null;
                                        }

                                        const focused =
                                            edge.source
                                            === focusEvent?.source
                                            &&
                                            edge.target
                                            === focusEvent?.target;

                                        return (
                                            <line
                                                key={`${edge.source}-${edge.target}-${index}`}
                                                x1={
                                                    source.position.x
                                                }
                                                y1={
                                                    source.position.y
                                                }
                                                x2={
                                                    target.position.x
                                                }
                                                y2={
                                                    target.position.y
                                                }
                                                className={
                                                    focused
                                                        ? "network-line relationship-line"
                                                        : "network-line"
                                                }
                                                markerEnd={
                                                    focused
                                                        ? "url(#arrow-relationship)"
                                                        : "url(#arrow-history)"
                                                }
                                            />
                                        );
                                    }
                                )}
                            </svg>


                            {nodes.map(
                                (node) => {
                                    const isTarget =
                                        node.id
                                        === focusNodeId;

                                    const isSource =
                                        node.id
                                        === focusEvent?.source;

                                    return (
                                        <div
                                            key={node.id}
                                            className={[
                                                "mini-citizen",
                                                isTarget
                                                    ? "node-example"
                                                    : "",
                                                isSource
                                                    ? "relation-source-example"
                                                    : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            style={{
                                                left:
                                                    `${node.position.x}%`,
                                                top:
                                                    `${node.position.y}%`,
                                            }}
                                        >
                                            <div className="mini-avatar">
                                                {avatarFor(
                                                    node.id
                                                )}
                                            </div>

                                            {isSource && (
                                                <span className="relation-source-name">
                                                    {sourceName}
                                                </span>
                                            )}

                                            {isTarget && (
                                                <>
                                                    <span className="focus-target-name">
                                                        {targetName}
                                                    </span>

                                                    <span className="label-callout">
                                                        :Person
                                                    </span>

                                                    <div className="property-callout">
                                                        <span>
                                                            age
                                                            <b>
                                                                {age}
                                                            </b>
                                                        </span>

                                                        <span>
                                                            interest
                                                            <b>
                                                                {interest}
                                                            </b>
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                            )}


                            {focusEvent && (
                                <div className="relationship-callout">

                                    <div className="relationship-main">
                                        <span>
                                            RELATIONSHIP
                                        </span>

                                        <strong>
                                            [:SPREAD]
                                        </strong>
                                    </div>

                                    <div className="relationship-meta">
                                        <div>
                                            <span>
                                                TYPE
                                            </span>
                                            <b>
                                                SPREAD
                                            </b>
                                        </div>

                                        <div>
                                            <span>
                                                PROPERTY
                                            </span>
                                            <b>
                                                channel: {channel}
                                            </b>
                                        </div>

                                        <div>
                                            <span>
                                                DIRECTION
                                            </span>
                                            <b>
                                                {sourceName}
                                                {" → "}
                                                {targetName}
                                            </b>
                                        </div>
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>


                    {/* 오른쪽 : GraphDB 핵심 6개 + 관계 읽는 법 */}
                    <div className="right-learning-panel">

                        {/* 1. 개념 먼저 */}
                        <aside className="structure-keywords">

                            <div className="keyword-title">
                                GraphDB 핵심 6개
                            </div>

                            <article className="keyword-card node-card">
                                <span>01</span>

                                <div>
                                    <strong>[Node]</strong>
                                    <h2>{targetName}</h2>
                                    <p>하나의 대상</p>
                                </div>
                            </article>


                            <article className="keyword-card label-card">
                                <span>02</span>

                                <div>
                                    <strong>[Label]</strong>
                                    <h2>:Person</h2>
                                    <p>Node의 종류</p>
                                </div>
                            </article>


                            <article className="keyword-card relationship-card">
                                <span>03</span>

                                <div>
                                    <strong>[Relationship]</strong>

                                    <h2>
                                        두 Node의 연결
                                    </h2>

                                    <p>
                                        {sourceName}
                                        {" ─── "}
                                        {targetName}
                                    </p>
                                </div>
                            </article>


                            <article className="keyword-card property-card">
                                <span>04</span>

                                <div>
                                    <strong>[Property]</strong>

                                    <h2>
                                        추가 정보
                                    </h2>

                                    <p className="property-split">
                                        <b>NODE</b>
                                        {" age · interest"}
                                        <br />
                                        <b>REL</b>
                                        {" channel"}
                                    </p>
                                </div>
                            </article>


                            <article className="keyword-card direction-card">
                                <span>05</span>

                                <div>
                                    <strong>[Direction]</strong>

                                    <h2>
                                        {sourceName}
                                        {" → "}
                                        {targetName}
                                    </h2>

                                    <p>관계가 향하는 방향</p>
                                </div>
                            </article>


                            <article className="keyword-card type-card">
                                <span>06</span>

                                <div>
                                    <strong>[Type]</strong>
                                    <h2>SPREAD</h2>
                                    <p>관계의 종류</p>
                                </div>
                            </article>

                        </aside>


                        {/* 2. 배운 개념으로 관계 읽기 */}
                        <section className="relation-reader">

                            <div className="reader-heading">
                                <span>관계 읽는 법</span>

                                <strong>
                                    {sourceName}
                                    {" → "}
                                    {targetName}
                                </strong>
                            </div>


                            <div className="reader-graph">

                                <div className="reader-node source-node">
                                    <span>NODE</span>
                                    <strong>{sourceName}</strong>
                                </div>


                                <div className="reader-relation">

                                    <div className="reader-arrow">
                                        <span className="reader-arrow-line" />
                                        <span className="reader-arrow-head">
                                            ›
                                        </span>
                                    </div>

                                    <div className="reader-rel-boxes">

                                        <div className="reader-box type-reader">
                                            <span>TYPE</span>

                                            <strong>
                                                SPREAD
                                            </strong>

                                            <small>
                                                소문 전달
                                            </small>
                                        </div>


                                        <div className="reader-box property-reader">
                                            <span>PROPERTY</span>

                                            <strong>
                                                channel: {channel}
                                            </strong>

                                            <small>
                                                전달 경로
                                            </small>
                                        </div>

                                    </div>

                                </div>


                                <div className="reader-node target-node">
                                    <span>NODE</span>
                                    <strong>{targetName}</strong>
                                </div>

                            </div>


                            <div className="reader-legend">

                                <div>
                                    <b className="reader-type-color">
                                        SPREAD
                                    </b>

                                    <span>
                                        관계 종류
                                    </span>
                                </div>

                                <div>
                                    <b className="reader-property-color">
                                        SNS
                                    </b>

                                    <span>
                                        관계 정보
                                    </span>
                                </div>

                                <div>
                                    <b className="reader-direction-color">
                                        →
                                    </b>

                                    <span>
                                        관계 방향
                                    </span>
                                </div>

                            </div>

                        </section>

                    </div>
                </section>


                <footer className="structure-footer">

                    <div className="structure-key-message">


                    </div>

                    <button
                        type="button"
                        className="structure-next"
                        onClick={() =>
                            navigate(
                                "/cypher",
                                {
                                    state: {
                                        simulation,
                                    },
                                }
                            )
                        }
                    >
                        CYPHER
                        <ChevronRight size={17} />
                    </button>

                </footer>

            </section>

        </main>
    );
}


export default GraphStructurePage;