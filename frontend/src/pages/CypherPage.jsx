import {
    ArrowLeft,
    ChevronRight,
    Code2,
    Mic,
    Network,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../styles/cypherPage.css";


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
    { x: 50, y: 54 },
    { x: 24, y: 28 },
    { x: 74, y: 25 },
    { x: 18, y: 67 },
    { x: 79, y: 68 },
    { x: 42, y: 16 },
    { x: 57, y: 80 },
    { x: 88, y: 44 },
    { x: 11, y: 45 },
];


const COMMANDS = [
    {
        key: "create",
        number: "01",
        english: "CREATE",
        korean: "Node 만들기",
        description:
            "새로운 Person Node를 생성합니다.",
    },
    {
        key: "relationship",
        number: "02",
        english: "RELATIONSHIP",
        korean: "관계 만들기",
        description:
            "두 Node 사이에 SPREAD 관계를 만듭니다.",
    },
    {
        key: "match",
        number: "03",
        english: "MATCH",
        korean: "관계 패턴 찾기",
        description:
            "원하는 Node와 Relationship 모양을 찾습니다.",
    },
    {
        key: "where",
        number: "04",
        english: "WHERE",
        korean: "조건으로 좁히기",
        description:
            "찾은 관계에서 특정 대상을 골라냅니다.",
    },
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


function citizenName(id) {
    return `시민 ${idNumber(id)}`;
}


function avatarFor(id) {
    return AVATARS[
    idNumber(id)
    % AVATARS.length
        ];
}


function getChannelLabel(channel) {
    const labels = {
        WORD_OF_MOUTH: "입소문",
        SNS: "SNS",
        VIDEO: "영상",
        COMMUNITY: "커뮤니티",
    };

    return labels[channel]
        || channel
        || "전달";
}


function buildExample(simulation) {
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

    const focusEvent =
        events.find(
            (item) =>
                item.channel === "SNS"
        )
        || events.find(
            (item) =>
                item.channel === "COMMUNITY"
        )
        || events[0];

    if (!focusEvent) {
        return null;
    }

    const selectedIds =
        new Set([
            focusEvent.source,
            focusEvent.target,
        ]);

    for (const event of events) {
        if (selectedIds.size >= 9) {
            break;
        }

        if (
            selectedIds.has(event.source)
            || selectedIds.has(event.target)
        ) {
            selectedIds.add(
                event.source
            );

            selectedIds.add(
                event.target
            );
        }
    }

    for (const event of events) {
        if (selectedIds.size >= 9) {
            break;
        }

        selectedIds.add(
            event.source
        );

        selectedIds.add(
            event.target
        );
    }

    const ids =
        Array.from(selectedIds)
            .slice(0, 9);

    const idSet =
        new Set(ids);

    const nodes =
        ids.map(
            (personId, index) => ({
                id: personId,
                person:
                    peopleMap.get(personId)
                    || {
                        id: personId,
                        name: personId,
                    },
                position:
                    MINI_POSITIONS[
                    index
                    % MINI_POSITIONS.length
                        ],
                isSource:
                    personId
                    === focusEvent.source,
                isTarget:
                    personId
                    === focusEvent.target,
            })
        );

    const edges =
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
            .slice(0, 12);

    const snsEdges =
        edges.filter(
            (edge) =>
                edge.channel === "SNS"
        );

    return {
        focusEvent,
        source:
            peopleMap.get(
                focusEvent.source
            )
            || {
                id: focusEvent.source,
                name: focusEvent.source,
            },
        target:
            peopleMap.get(
                focusEvent.target
            )
            || {
                id: focusEvent.target,
                name: focusEvent.target,
            },
        nodes,
        edges,
        snsEdges,
    };
}


function CypherPage() {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const [activeCommand, setActiveCommand] =
        useState("create");

    // =========================================================
    // VOICE COMMAND
    // =========================================================

    useEffect(() => {

        function handleVoiceCommand(event) {

            const type =
                event.detail?.type;

            const command =
                event.detail?.command || "";


            console.log(
                "[CYPHER VOICE]",
                type,
                command
            );


            if (
                type === "SHOW_CREATE"
            ) {

                setActiveCommand(
                    "create"
                );

                return;
            }


            if (
                type === "SHOW_RELATIONSHIP"
            ) {

                setActiveCommand(
                    "relationship"
                );

                return;
            }


            if (
                type === "SHOW_MATCH"
            ) {

                setActiveCommand(
                    "match"
                );

                return;
            }


            if (
                type === "SHOW_WHERE"
            ) {

                setActiveCommand(
                    "where"
                );
            }
        }


        window.addEventListener(
            "cypher-voice-command",
            handleVoiceCommand
        );


        return () => {

            window.removeEventListener(
                "cypher-voice-command",
                handleVoiceCommand
            );
        };

    }, []);

    const simulation =
        location.state?.simulation
        || getSimulationFromStorage();

    const example =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return buildExample(
                simulation
            );
        }, [simulation]);


    if (
        !simulation
        || !example
    ) {
        return (
            <main className="cypher-page">
                <section className="cypher-empty">
                    <span>
                        CYPHER
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
                            navigate("/")
                        }
                    >
                        시뮬레이션으로 돌아가기
                    </button>
                </section>
            </main>
        );
    }


    const {
        focusEvent,
        source,
        target,
        nodes,
        edges,
        snsEdges,
    } = example;

    const channel =
        getChannelLabel(
            focusEvent.channel
        );

    const targetAge =
        target?.age
        ?? target?.properties?.age
        ?? 27;

    const targetInterest =
        target?.interest
        ?? target?.properties?.interest
        ?? "fashion";


    const renderCode = () => {
        if (
            activeCommand
            === "create"
        ) {
            return (
                <>
                    <span className="kw">
                        CREATE
                    </span>
                    {" "}
                    <span className="node-code">
                        (p:Person
                    </span>
                    {" {"}
                    {"\n"}
                    {"  "}id:
                    {" "}
                    <span className="string-code">
                        "{target.id}"
                    </span>
                    {","}
                    {"\n"}
                    {"  "}age:
                    {" "}
                    <span className="number-code">
                        {targetAge}
                    </span>
                    {","}
                    {"\n"}
                    {"  "}interest:
                    {" "}
                    <span className="string-code">
                        "{targetInterest}"
                    </span>
                    {"\n"}
                    {"}"}
                    <span className="node-code">
                        )
                    </span>
                    {"\n"}
                    <span className="kw">
                        RETURN
                    </span>
                    {" "}
                    p;
                </>
            );
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return (
                <>
                    <span className="kw">
                        MATCH
                    </span>
                    {" "}
                    <span className="node-code">
                        (a:Person)
                    </span>
                    {","}
                    {" "}
                    <span className="node-code">
                        (b:Person)
                    </span>
                    {"\n"}

                    <span className="kw">
                        WHERE
                    </span>
                    {" "}
                    a.id =
                    {" "}
                    <span className="string-code">
                        "{source.id}"
                    </span>
                    {"\n"}
                    {"  "}
                    <span className="kw">
                        AND
                    </span>
                    {" "}
                    b.id =
                    {" "}
                    <span className="string-code">
                        "{target.id}"
                    </span>
                    {"\n"}

                    <span className="kw">
                        CREATE
                    </span>
                    {" "}
                    (a)
                    <span className="rel-code">
                        -[:SPREAD
                        {" {"}
                        channel:
                        <span className="string-code">
                            "{channel}"
                        </span>
                        {"}"}
                        ]-&gt;
                    </span>
                    (b)
                    {"\n"}

                    <span className="kw">
                        RETURN
                    </span>
                    {" "}
                    a, b;
                </>
            );
        }

        if (
            activeCommand
            === "match"
        ) {
            return (
                <>
                    <span className="kw">
                        MATCH
                    </span>
                    {" "}
                    <span className="node-code">
                        (a:Person)
                    </span>
                    <span className="rel-code">
                        -[r:SPREAD]-&gt;
                    </span>
                    <span className="node-code">
                        (b:Person)
                    </span>
                    {"\n"}

                    <span className="kw">
                        RETURN
                    </span>
                    {" "}
                    a, r, b
                    {"\n"}

                    <span className="kw">
                        LIMIT
                    </span>
                    {" "}
                    <span className="number-code">
                        10
                    </span>
                    ;
                </>
            );
        }

        return (
            <>
                <span className="kw">
                    MATCH
                </span>
                {" "}
                <span className="node-code">
                    (a:Person)
                </span>
                <span className="rel-code">
                    -[r:SPREAD]-&gt;
                </span>
                <span className="node-code">
                    (b:Person)
                </span>
                {"\n"}

                <span className="kw">
                    WHERE
                </span>
                {" "}
                r.channel =
                {" "}
                <span className="string-code">
                    "SNS"
                </span>
                {"\n"}

                <span className="kw">
                    RETURN
                </span>
                {" "}
                a, r, b;
            </>
        );
    };


    const renderLeftResult = () => {
        if (
            activeCommand
            === "create"
        ) {
            return (
                <div className="create-result">

                    <div className="created-node-wrap">
                        <div className="created-node-ring">
                            <div className="created-avatar">
                                {avatarFor(target.id)}
                            </div>
                        </div>

                        <div className="created-label">
                            :Person
                        </div>

                        <strong>
                            {citizenName(target.id)}
                        </strong>

                        <div className="created-properties">
                            <div>
                                <span>id</span>
                                <b>{target.id}</b>
                            </div>

                            <div>
                                <span>age</span>
                                <b>{targetAge}</b>
                            </div>

                            <div>
                                <span>interest</span>
                                <b>{targetInterest}</b>
                            </div>
                        </div>
                    </div>

                    <p className="visual-result-note">
                        데이터 한 건이
                        <b> 하나의 Node</b>
                        로 생성됩니다.
                    </p>
                </div>
            );
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return (
                <div className="relationship-result">
                    <div className="relation-person-card">
                        <div className="relation-avatar source-ring">
                            {avatarFor(source.id)}
                        </div>

                        <span>:Person</span>

                        <strong>
                            {citizenName(source.id)}
                        </strong>
                    </div>

                    <div className="created-relation">
                        <span className="relation-type">
                            [:SPREAD]
                        </span>

                        <strong>
                            {channel}
                        </strong>

                        <div className="relation-arrow">
                            <i />
                        </div>

                        <small>
                            Relationship 생성
                        </small>
                    </div>

                    <div className="relation-person-card">
                        <div className="relation-avatar target-ring">
                            {avatarFor(target.id)}
                        </div>

                        <span>:Person</span>

                        <strong>
                            {citizenName(target.id)}
                        </strong>
                    </div>

                    <p className="visual-result-note relation-note">
                        두 Node 사이에
                        <b> SPREAD Relationship</b>
                        이 생성됩니다.
                    </p>
                </div>
            );
        }

        return (
            <div
                className={[
                    "simulation-fragment",
                    activeCommand
                    === "where"
                        ? "where-result"
                        : "match-result",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <svg
                    className="fragment-lines"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <defs>
                        <marker
                            id="cypher-arrow-default"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <path
                                d="M0,0 L6,3 L0,6 Z"
                                fill="#776b9f"
                            />
                        </marker>

                        <marker
                            id="cypher-arrow-focus"
                            markerWidth="7"
                            markerHeight="7"
                            refX="6"
                            refY="3.5"
                            orient="auto"
                        >
                            <path
                                d="M0,0 L7,3.5 L0,7 Z"
                                fill="#bc8cff"
                            />
                        </marker>
                    </defs>

                    {edges.map(
                        (edge, index) => {
                            const from =
                                nodes.find(
                                    (node) =>
                                        node.id
                                        === edge.source
                                );

                            const to =
                                nodes.find(
                                    (node) =>
                                        node.id
                                        === edge.target
                                );

                            if (
                                !from
                                || !to
                            ) {
                                return null;
                            }

                            const isMatch =
                                activeCommand
                                === "match";

                            const isWhere =
                                activeCommand
                                === "where";

                            const isSnsEdge =
                                edge.channel
                                === "SNS";

                            /*
                             * MATCH:
                             * SPREAD 관계 전체를 동일한 보라색으로 표시합니다.
                             *
                             * WHERE:
                             * 3번 MATCH의 같은 그래프를 그대로 두고,
                             * SNS 관계만 선명하게,
                             * 나머지 관계는 흐릿하게 남겨 필터링 전/후를 비교합니다.
                             */

                            return (
                                <line
                                    key={`${edge.source}-${edge.target}-${index}`}
                                    x1={from.position.x}
                                    y1={from.position.y}
                                    x2={to.position.x}
                                    y2={to.position.y}
                                    className={[
                                        "fragment-edge",

                                        isMatch
                                            ? "match-spread-edge"
                                            : "",

                                        isWhere
                                        && isSnsEdge
                                            ? "sns-filter-edge"
                                            : "",

                                        isWhere
                                        && !isSnsEdge
                                            ? "where-context-edge"
                                            : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    markerEnd={
                                        isMatch
                                        || (
                                            isWhere
                                            && isSnsEdge
                                        )
                                            ? "url(#cypher-arrow-focus)"
                                            : "url(#cypher-arrow-default)"
                                    }
                                />
                            );
                        }
                    )}
                </svg>

                {nodes.map(
                    (node) => {

                        const snsNodeIds =
                            new Set(
                                snsEdges.flatMap(
                                    (edge) => [
                                        edge.source,
                                        edge.target,
                                    ]
                                )
                            );

                        const isWhere =
                            activeCommand
                            === "where";

                        const isSnsNode =
                            snsNodeIds.has(
                                node.id
                            );

                        return (
                            <div
                                key={node.id}
                                className={[
                                    "fragment-person",

                                    isWhere
                                    && isSnsNode
                                        ? "sns-result-person"
                                        : "",

                                    isWhere
                                    && !isSnsNode
                                        ? "where-context-person"
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
                                <div className="fragment-avatar">
                                    {avatarFor(
                                        node.id
                                    )}
                                </div>

                                {isWhere
                                    && isSnsNode && (
                                        <span className="person-name-badge">
                                        {citizenName(
                                            node.id
                                        )}
                                    </span>
                                    )}
                            </div>
                        );
                    }
                )}

                {activeCommand
                    === "match" && (
                        <div className="query-result-badge">
                            MATCH 결과
                            <b>
                                {" "}SPREAD 관계들이 검색됨
                            </b>
                        </div>
                    )}

                {activeCommand
                    === "where" && (
                        <div className="query-result-badge where-badge">
                            WHERE 적용
                            <b>
                                {" "}
                                channel = SNS 관계만 선명하게 표시
                            </b>
                        </div>
                    )}
            </div>
        );
    };


    const getLeftTitle = () => {
        if (
            activeCommand
            === "create"
        ) {
            return "Graph 실행 결과";
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return "Graph 실행 결과";
        }

        if (
            activeCommand
            === "match"
        ) {
            return "Graph 조회 결과";
        }

        return "Graph 필터링 결과";
    };


    const getLeftSubtitle = () => {
        if (
            activeCommand
            === "create"
        ) {
            return "CREATE 실행 후 새로운 Person Node가 생성됩니다.";
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return "CREATE 실행 후 두 Person 사이에 SPREAD 관계가 생성됩니다.";
        }

        if (
            activeCommand
            === "match"
        ) {
            return "MATCH 실행 후 SPREAD 관계 패턴들이 조회됩니다.";
        }

        return "3번 MATCH 결과는 그대로 두고, SNS 관계만 파란색으로 강조합니다.";
    };

    const getCodeTitle = () => {
        if (
            activeCommand
            === "create"
        ) {
            return "Cypher 코드 — Node 생성";
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return "Cypher 코드 — 관계 생성";
        }

        if (
            activeCommand
            === "match"
        ) {
            return "Cypher 코드 — 관계 조회";
        }

        return "Cypher 코드 — 조건 필터링";
    };


    const getCodeSubtitle = () => {
        if (
            activeCommand
            === "create"
        ) {
            return "CREATE로 Person Node를 생성합니다.";
        }

        if (
            activeCommand
            === "relationship"
        ) {
            return "CREATE로 두 Node 사이에 SPREAD 관계를 생성합니다.";
        }

        if (
            activeCommand
            === "match"
        ) {
            return "MATCH로 SPREAD 관계 패턴을 조회합니다.";
        }

        return 'WHERE r.channel = "SNS" 조건으로 결과를 좁힙니다.';
    };


    return (
        <main className="cypher-page">
            <header className="cypher-header">
                <div className="cypher-brand">
                    <span>
                        FASHION NETWORK SIMULATION
                    </span>

                    <strong>
                        TREND CITY
                    </strong>
                </div>

                <div className="voice-pill">
                    <i />
                    <Mic size={14} />
                    VOICE PRESENTATION
                </div>

                <button
                    type="button"
                    className="cypher-back"
                    onClick={() =>
                        navigate(
                            "/graph-structure",
                            {
                                state: {
                                    simulation,
                                },
                            }
                        )
                    }
                >
                    <ArrowLeft size={16} />
                    GRAPH STRUCTURE
                </button>
            </header>


            <section className="cypher-stage">
                <div className="cypher-heading">
                    <p>
                        04
                        <span>
                            CYPHER
                        </span>
                    </p>

                    <h1>
                        화면의 그래프를 Cypher로 표현하면?
                    </h1>


                </div>


                <section className="command-tabs">
                    {COMMANDS.map(
                        (command) => (
                            <button
                                type="button"
                                key={command.key}
                                className={
                                    activeCommand
                                    === command.key
                                        ? "command-tab active"
                                        : "command-tab"
                                }
                                onClick={() =>
                                    setActiveCommand(
                                        command.key
                                    )
                                }
                            >
                                <span>
                                    {command.number}
                                </span>

                                <div>
                                    <strong>
                                        {command.english}
                                    </strong>

                                    <small>
                                        {command.korean}
                                    </small>
                                </div>
                            </button>
                        )
                    )}
                </section>


                <section className="cypher-content">
                    <article className="graph-side">
                        <div className="panel-title">
                            <div className="panel-icon">
                                <Network size={20} />
                            </div>

                            <div>
                                <strong>
                                    {getLeftTitle()}
                                </strong>

                                <span>
                                    {getLeftSubtitle()}
                                </span>
                            </div>
                        </div>

                        <div className="left-result-stage">
                            {renderLeftResult()}
                        </div>
                    </article>


                    <article className="code-side">
                        <div className="panel-title">
                            <div className="panel-icon code-icon">
                                <Code2 size={20} />
                            </div>

                            <div>
                                <strong>
                                    {getCodeTitle()}
                                </strong>

                                <span>
                                    {getCodeSubtitle()}
                                </span>
                            </div>
                        </div>


                        <div className="code-window">
                            <div className="code-window-top">
                                <div className="window-dots">
                                    <i />
                                    <i />
                                    <i />
                                </div>

                                <span>
                                    cypher
                                </span>
                            </div>

                            <pre>
                                <code>
                                    {renderCode()}
                                </code>
                            </pre>
                        </div>


                        <div className="command-result-explain">
                            <span>
                                실행 결과
                            </span>

                            {activeCommand
                                === "create" && (
                                    <strong>
                                        → Person Node 1개 생성
                                    </strong>
                                )}

                            {activeCommand
                                === "relationship" && (
                                    <strong>
                                        → 두 시민 사이 SPREAD 관계 생성
                                    </strong>
                                )}

                            {activeCommand
                                === "match" && (
                                    <strong>
                                        → SPREAD 패턴을 가진 관계들을 검색
                                    </strong>
                                )}

                            {activeCommand
                                === "where" && (
                                    <strong>
                                        → 전체 관계는 유지하고 SNS 관계만 강조
                                    </strong>
                                )}
                        </div>
                    </article>
                </section>


                <footer className="cypher-footer">
                    <div className="cypher-key-message">
                        Cypher는
                        <b>
                            {" "}Node를 만들고 → 관계를 연결하고 → 패턴을 찾고 → 조건으로 좁히는
                        </b>
                        {" "}방식으로 Graph를 다룰 수 있습니다.
                    </div>

                    <button
                        type="button"
                        className="cypher-next"
                        onClick={() =>
                            navigate(
                                "/path-traversal",
                                {
                                    state: {
                                        simulation,
                                    },
                                }
                            )
                        }
                    >
                        PATH
                        <ChevronRight size={17} />
                    </button>
                </footer>
            </section>
        </main>
    );
}


export default CypherPage;