import {
    ArrowLeft,
    ChevronRight,
    Database,
    GitBranch,
    Layers3,
    Mic,
    Network,
    Table2,
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

import "../styles/rdbVsGraphPage.css";


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


function buildPathExample(simulation) {
    const events =
        (simulation?.spread_events || [])
            .slice()
            .sort((a, b) => {
                const stepDiff =
                    (a.step ?? 0)
                    - (b.step ?? 0);

                if (stepDiff !== 0) {
                    return stepDiff;
                }

                return String(
                    a.target
                ).localeCompare(
                    String(
                        b.target
                    )
                );
            });

    const starterId =
        simulation?.starter?.id
        || events[0]?.source;

    if (!starterId) {
        return null;
    }

    const parentMap =
        new Map();

    events.forEach((event) => {
        if (
            event.target
            && !parentMap.has(
                event.target
            )
        ) {
            parentMap.set(
                event.target,
                event
            );
        }
    });

    const depthMemo =
        new Map([
            [starterId, 0],
        ]);

    function getDepth(personId) {
        if (
            depthMemo.has(
                personId
            )
        ) {
            return depthMemo.get(
                personId
            );
        }

        const event =
            parentMap.get(
                personId
            );

        if (!event?.source) {
            return -1;
        }

        const parentDepth =
            getDepth(
                event.source
            );

        if (parentDepth < 0) {
            return -1;
        }

        const depth =
            parentDepth + 1;

        depthMemo.set(
            personId,
            depth
        );

        return depth;
    }

    const candidates =
        Array.from(
            parentMap.keys()
        )
            .map((personId) => ({
                personId,
                depth:
                    getDepth(
                        personId
                    ),
            }))
            .filter(
                (item) =>
                    item.depth >= 2
            )
            .sort(
                (a, b) =>
                    b.depth - a.depth
            );

    const targetId =
        candidates[0]?.personId
        || parentMap.keys().next().value;

    if (!targetId) {
        return null;
    }

    const reverseNodes = [
        targetId,
    ];

    const reverseEdges = [];

    let current =
        targetId;

    const guard =
        new Set();

    while (
        current
        && current !== starterId
        && !guard.has(current)
        ) {
        guard.add(current);

        const event =
            parentMap.get(current);

        if (!event) {
            break;
        }

        reverseEdges.push(
            event
        );

        reverseNodes.push(
            event.source
        );

        current =
            event.source;
    }

    const nodeIds =
        reverseNodes.reverse();

    const pathEdges =
        reverseEdges.reverse();

    let displayNodeIds =
        nodeIds;

    let displayEdges =
        pathEdges;

    if (nodeIds.length > 6) {
        displayNodeIds = [
            nodeIds[0],
            nodeIds[1],
            nodeIds[
            nodeIds.length - 4
                ],
            nodeIds[
            nodeIds.length - 3
                ],
            nodeIds[
            nodeIds.length - 2
                ],
            nodeIds[
            nodeIds.length - 1
                ],
        ];

        displayEdges = [];

        for (
            let i = 0;
            i < displayNodeIds.length - 1;
            i += 1
        ) {
            const source =
                displayNodeIds[i];

            const target =
                displayNodeIds[i + 1];

            const actual =
                pathEdges.find(
                    (event) =>
                        event.source
                        === source
                        && event.target
                        === target
                );

            displayEdges.push(
                actual || {
                    source,
                    target,
                    channel:
                        "WORD_OF_MOUTH",
                    skipped:
                        true,
                }
            );
        }
    }

    return {
        starterId,
        targetId,
        displayNodeIds,
        displayEdges,
    };
}


function buildSceneTwoExample(simulation) {
    const people =
        (simulation?.nodes || [])
            .filter(Boolean);

    const events =
        (simulation?.spread_events || [])
            .filter(
                (event) =>
                    event?.source
                    && event?.target
            )
            .slice()
            .sort(
                (a, b) =>
                    (a.step ?? 0)
                    - (b.step ?? 0)
            );

    const getAge =
        (person) =>
            Number(
                person?.age
                ?? person?.properties?.age
            );

    /*
     * 질문 A:
     * "20대이면서 SNS로 소문을 전달한 시민"
     *
     * 실제 SPREAD 이벤트 중 channel === SNS 이고
     * source 시민의 나이가 20대인 사람을 우선 사용.
     */
    let queryPeople =
        people.filter((person) => {
            const age =
                getAge(person);

            const sentBySns =
                events.some(
                    (event) =>
                        event.source === person.id
                        && event.channel === "SNS"
                );

            return (
                Number.isFinite(age)
                && age >= 20
                && age <= 29
                && sentBySns
            );
        });

    if (queryPeople.length === 0) {
        queryPeople =
            people.filter((person) => {
                const age =
                    getAge(person);

                return (
                    Number.isFinite(age)
                    && age >= 20
                    && age <= 29
                );
            });
    }

    if (queryPeople.length === 0) {
        queryPeople =
            people.slice(0, 3);
    }

    queryPeople =
        queryPeople.slice(0, 3);


    /*
     * 질문 B:
     * 질문 A에서 찾은 시민 중 실제 전달 관계가 있는 사람을 시작점으로
     * 3~4단계 실제 SPREAD 경로를 표시.
     */
    const outgoingMap =
        new Map();

    events.forEach((event) => {
        if (!outgoingMap.has(event.source)) {
            outgoingMap.set(
                event.source,
                []
            );
        }

        outgoingMap
            .get(event.source)
            .push(event);
    });

    const startPerson =
        queryPeople.find(
            (person) =>
                outgoingMap.has(person.id)
        )
        || queryPeople[0]
        || people[0];

    const chainNodes = [];
    const chainEdges = [];

    if (startPerson?.id) {
        let current =
            startPerson.id;

        const visited =
            new Set();

        chainNodes.push(current);

        for (
            let i = 0;
            i < 4;
            i += 1
        ) {
            if (
                !current
                || visited.has(current)
            ) {
                break;
            }

            visited.add(current);

            const candidates =
                (outgoingMap.get(current) || [])
                    .filter(
                        (event) =>
                            !visited.has(
                                event.target
                            )
                    );

            if (candidates.length === 0) {
                break;
            }

            const next =
                candidates[0];

            chainEdges.push(next);
            chainNodes.push(
                next.target
            );

            current =
                next.target;
        }
    }

    return {
        queryPeople,
        startPerson,
        chainNodes,
        chainEdges,
    };
}


function RdbVsGraphPage() {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const [
        compareScene,
        setCompareScene,
    ] = useState(1);

    // =========================================================
// VOICE COMMAND
// =========================================================

    useEffect(() => {

        function handleVoiceCommand(event) {

            const type =
                event.detail?.type;

            const command =
                event.detail?.command;


            console.log(
                "[RDB VS GRAPH VOICE]",
                type,
                command
            );


            // =============================================
            // 비교장면 1
            // =============================================

            if (
                type ===
                "SHOW_SCENE_1"
            ) {

                setCompareScene(1);

                return;
            }


            // =============================================
            // 비교장면 2
            // =============================================

            if (
                type ===
                "SHOW_SCENE_2"
            ) {

                setCompareScene(2);

                return;
            }


            // =============================================
            // 다음 장면
            //
            // 현재 1이면 2
            // 2에서는 그대로 유지
            // =============================================

            if (
                type ===
                "NEXT_SCENE"
            ) {

                setCompareScene(
                    (current) =>
                        current === 1
                            ? 2
                            : 2
                );

                return;
            }


            // =============================================
            // 이전 장면
            //
            // 현재 2이면 1
            // 1에서는 그대로 유지
            // =============================================

            if (
                type ===
                "PREVIOUS_SCENE"
            ) {

                setCompareScene(
                    (current) =>
                        current === 2
                            ? 1
                            : 1
                );
            }
        }


        window.addEventListener(
            "rdb-vs-graph-voice-command",
            handleVoiceCommand
        );


        return () => {

            window.removeEventListener(
                "rdb-vs-graph-voice-command",
                handleVoiceCommand
            );
        };

    }, []);

    const simulation =
        location.state?.simulation
        || getSimulationFromStorage();

    const pathData =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return buildPathExample(
                simulation
            );
        }, [simulation]);


    const sceneTwoData =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return buildSceneTwoExample(
                simulation
            );
        }, [simulation]);


    if (
        !simulation
        || !pathData
    ) {
        return (
            <main className="compare-page">
                <section className="compare-empty">
                    <span>
                        RDB vs GRAPH
                    </span>

                    <h1>
                        시뮬레이션 경로가 필요합니다.
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
        starterId,
        targetId,
        displayNodeIds,
        displayEdges,
    } = pathData;


    const {
        queryPeople = [],
        startPerson: sceneTwoStartPerson,
        chainNodes: sceneTwoChainNodes = [],
        chainEdges: sceneTwoChainEdges = [],
    } = sceneTwoData || {};

    const getPersonAge =
        (person) =>
            person?.age
            ?? person?.properties?.age
            ?? "-";

    const sceneOne =
        compareScene === 1;


    return (
        <main className="compare-page">
            <header className="compare-header">
                <div className="compare-brand">
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
                    className="compare-back"
                    onClick={() => navigate("/path-traversal")}
                >
                    ← PATH
                </button>
            </header>


            <section className="compare-stage">

                {/* =====================================================
                    HEADING
                ===================================================== */}

                <div className="compare-heading">
                    <p>
                        06
                        <span>
                            RDB vs GRAPH
                        </span>
                    </p>

                    {sceneOne ? (
                        <h1 className="hero-title">
                            같은 관계를 찾는 <span>두 가지 방법</span>
                        </h1>
                    ) : (
                        <h1 className="hero-title">
                            데이터 조회와 <span>관계 탐색의 차이</span>
                        </h1>
                    )}

                    {sceneOne ? (
                        <div className="compare-question">
                            “최초 유포자의 소문이
                            {" "}
                            <b>
                                {citizenName(
                                    targetId
                                )}
                            </b>
                            까지 어떻게 전달됐을까?”
                        </div>
                    ) : (
                        <div className="compare-question scene-two-guide">
                            같은 데이터도 <b>무엇을 묻느냐</b>에 따라 적합한 방식이 달라집니다.
                        </div>
                    )}
                </div>


                {/* =====================================================
                    SCENE 1 — 기존 화면 그대로
                ===================================================== */}

                {sceneOne ? (
                    <>
                        <section className="compare-content">
                            {/* =========================
                        RDB
                    ========================= */}
                            <article className="compare-card rdb-card">
                                <div className="card-kicker rdb-kicker">
                                    RDB
                                </div>

                                <h2>
                            <span>
                                JOIN
                            </span>
                                    해서 찾기
                                </h2>

                                <p className="card-summary">
                                    여러 테이블을 연결해
                                    <b>
                                        {" "}관계를 다시 조합
                                    </b>
                                    합니다.
                                </p>


                                <div className="rdb-visual detailed-rdb">
                                    <div className="rdb-table-card">
                                        <div className="rdb-table-title">
                                            <Table2 size={18} />
                                            <div>
                                                <strong>
                                                    시민 TABLE
                                                </strong>
                                                <span>
                                            사람의 기본 정보
                                        </span>
                                            </div>
                                        </div>

                                        <div className="mini-table">
                                            <div className="mini-row mini-head">
                                                <span>person_id</span>
                                                <span>name</span>
                                                <span>interest</span>
                                            </div>

                                            <div className="mini-row highlight-row">
                                                <b>{starterId}</b>
                                                <b>{citizenName(starterId)}</b>
                                                <b>패션</b>
                                            </div>

                                            <div className="mini-row">
                                                <span>person_115</span>
                                                <span>시민 115</span>
                                                <span>패션</span>
                                            </div>

                                            <div className="mini-row">
                                                <span>{targetId}</span>
                                                <span>{citizenName(targetId)}</span>
                                                <span>패션</span>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="big-join detailed-join">
                                <span>
                                    JOIN
                                </span>
                                        <small>
                                            person_id
                                        </small>
                                    </div>


                                    <div className="rdb-table-card spread-log-table">
                                        <div className="rdb-table-title">
                                            <GitBranch size={18} />
                                            <div>
                                                <strong>
                                                    전달 관계 TABLE
                                                </strong>
                                                <span>
                                            누가 누구에게 전달했는지
                                        </span>
                                            </div>
                                        </div>

                                        <div className="mini-table">
                                            <div className="mini-row mini-head spread-grid">
                                                <span>source_id</span>
                                                <span>target_id</span>
                                                <span>channel_id</span>
                                                <span>step</span>
                                            </div>

                                            <div className="mini-row spread-grid highlight-row">
                                                <b>{starterId}</b>
                                                <b>person_115</b>
                                                <b>C01</b>
                                                <b>1</b>
                                            </div>

                                            <div className="mini-row spread-grid">
                                                <span>person_115</span>
                                                <span>person_183</span>
                                                <span>C02</span>
                                                <span>2</span>
                                            </div>

                                            <div className="mini-row spread-grid">
                                                <span>...</span>
                                                <span>{targetId}</span>
                                                <span>C01</span>
                                                <span>...</span>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="big-join detailed-join">
                                <span>
                                    JOIN
                                </span>
                                        <small>
                                            channel_id
                                        </small>
                                    </div>


                                    <div className="rdb-table-card">
                                        <div className="rdb-table-title">
                                            <Database size={18} />
                                            <div>
                                                <strong>
                                                    채널 TABLE
                                                </strong>
                                                <span>
                                            전달 방식 정보
                                        </span>
                                            </div>
                                        </div>

                                        <div className="mini-table">
                                            <div className="mini-row mini-head channel-grid">
                                                <span>channel_id</span>
                                                <span>channel_name</span>
                                            </div>

                                            <div className="mini-row channel-grid highlight-row">
                                                <b>C01</b>
                                                <b>입소문</b>
                                            </div>

                                            <div className="mini-row channel-grid">
                                                <span>C02</span>
                                                <span>SNS</span>
                                            </div>

                                            <div className="mini-row channel-grid">
                                                <span>C03</span>
                                                <span>커뮤니티</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="rdb-message">
                                    <Layers3 size={18} />

                                    <span>
                                여러 테이블의
                                <b>
                                    {" "}ID를 JOIN
                                </b>
                                해서 전체 전달 관계를 조합합니다.
                            </span>
                                </div>
                            </article>


                            <div className="center-vs">
                                VS
                            </div>


                            {/* =========================
                        GRAPH
                    ========================= */}
                            <article className="compare-card graph-card">
                                <div className="card-kicker graph-kicker">
                                    GRAPH DB
                                </div>

                                <h2>
                            <span>
                                RELATIONSHIP
                            </span>
                                    을 따라 찾기
                                </h2>

                                <p className="card-summary">
                                    이미 연결된 관계를
                                    <b>
                                        {" "}Traversal
                                    </b>
                                    합니다.
                                </p>


                                <div className="graph-visual">
                                    {displayNodeIds.map(
                                        (
                                            personId,
                                            index
                                        ) => {
                                            const edge =
                                                displayEdges[
                                                    index
                                                    ];

                                            const isStart =
                                                personId
                                                === starterId;

                                            const isTarget =
                                                personId
                                                === targetId;

                                            return (
                                                <div
                                                    className="graph-segment"
                                                    key={`${personId}-${index}`}
                                                >
                                                    <div
                                                        className={[
                                                            "graph-person",
                                                            isStart
                                                                ? "graph-start"
                                                                : "",
                                                            isTarget
                                                                ? "graph-target"
                                                                : "",
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ")}
                                                    >
                                                        <div className="graph-avatar">
                                                            {avatarFor(
                                                                personId
                                                            )}
                                                        </div>

                                                        <strong>
                                                            {isStart
                                                                ? "START"
                                                                : citizenName(
                                                                    personId
                                                                )}
                                                        </strong>
                                                    </div>


                                                    {index
                                                        < displayNodeIds.length - 1 && (
                                                            <div
                                                                className={
                                                                    edge?.skipped
                                                                        ? "graph-edge skipped"
                                                                        : "graph-edge"
                                                                }
                                                            >
                                                    <span>
                                                        {edge?.skipped
                                                            ? "..."
                                                            : channelLabel(
                                                                edge?.channel
                                                            )}
                                                    </span>

                                                                <i />
                                                            </div>
                                                        )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>


                                <div className="graph-message">
                                    <Network size={18} />

                                    <span>
                                저장된 관계를
                                <b>
                                    {" "}그대로 Traversal
                                </b>
                            </span>
                                </div>
                            </article>
                        </section>


                        <section className="compare-one-line">
                            <div className="rdb-line">
                        <span>
                            RDB
                        </span>

                                <strong>
                                    관계를 조합해서 찾는다
                                </strong>
                            </div>

                            <i>
                                →
                            </i>

                            <div className="graph-line">
                        <span>
                            GRAPH DB
                        </span>

                                <strong>
                                    관계를 따라가며 찾는다
                                </strong>
                            </div>
                        </section>



                    </>
                ) : (
                    <>
                        {/* =================================================
                            SCENE 2 — 질문을 통한 비교
                        ================================================= */}

                        <section className="question-compare-board">

                            {/* QUESTION A */}
                            <article className="question-card question-a">

                                <div className="question-title-row">
                                    <div className="question-badge">
                                        A
                                    </div>

                                    <div>
                                        <span className="question-kicker">
                                            DATA QUERY
                                        </span>

                                        <h2>
                                            “20대이면서 SNS로 소문을 전달한 시민은 누구?”
                                        </h2>

                                        <p>
                                            사람의 <b>나이·조건</b>을 보고 찾는 질문
                                        </p>
                                    </div>
                                </div>


                                <div className="question-compare-grid">

                                    <div className="qa-db-panel qa-rdb">

                                        <div className="qa-db-title">
                                            <strong>RDB</strong>
                                            <span>조건으로 바로 찾기</span>
                                        </div>


                                        <div className="qa-condition-line">
                                            <span>age = 20대</span>
                                            <b>+</b>
                                            <span>SNS 조건</span>
                                            <i>→</i>
                                            <strong>RESULT</strong>
                                        </div>


                                        <div className="qa-result-list">
                                            {queryPeople.map(
                                                (person) => (
                                                    <div
                                                        className="qa-result-chip"
                                                        key={`rdb-${person.id}`}
                                                    >
                                                        <strong>
                                                            {citizenName(
                                                                person.id
                                                            )}
                                                        </strong>

                                                        <span>
                                                            age {getPersonAge(
                                                            person
                                                        )}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>


                                        <div className="qa-panel-message rdb-message-box">
                                            <strong>
                                                조건 조회에 자연스러움
                                            </strong>

                                            <span>
                                                값·범위·조건으로 바로 조회
                                            </span>
                                        </div>

                                    </div>


                                    <div className="qa-vs">
                                        VS
                                    </div>


                                    <div className="qa-db-panel qa-graph">

                                        <div className="qa-db-title">
                                            <strong>GRAPH DB</strong>
                                            <span>Property로 같은 조회 가능</span>
                                        </div>


                                        <div className="qa-property-line">
                                            <div>
                                                <span>:Person</span>
                                                <strong>age · channel</strong>
                                            </div>

                                            <i>→</i>

                                            <b>
                                                조건에 맞는 Node
                                            </b>
                                        </div>


                                        <div className="qa-result-list graph-results">
                                            {queryPeople.map(
                                                (person) => (
                                                    <div
                                                        className="qa-graph-person"
                                                        key={`graph-${person.id}`}
                                                    >
                                                        <div>
                                                            {avatarFor(
                                                                person.id
                                                            )}
                                                        </div>

                                                        <strong>
                                                            {citizenName(
                                                                person.id
                                                            )}
                                                        </strong>
                                                    </div>
                                                )
                                            )}
                                        </div>


                                        <div className="qa-panel-message graph-message-box">
                                            <strong>
                                                가능하지만 Graph의 핵심 장점은 아님
                                            </strong>

                                            <span>
                                                아직 관계를 따라가는 질문이 아님
                                            </span>
                                        </div>

                                    </div>

                                </div>


                                <div className="question-bottom-answer rdb-answer">
                                    <span>질문 A</span>
                                    <strong>
                                        단순 조건 조회 → RDB가 간단하고 자연스럽다
                                    </strong>
                                </div>

                            </article>


                            {/* QUESTION B */}
                            <article className="question-card question-b">

                                <div className="question-title-row">
                                    <div className="question-badge graph-badge">
                                        B
                                    </div>

                                    <div>
                                        <span className="question-kicker">
                                            RELATION SEARCH
                                        </span>

                                        <h2>
                                            “그 시민의 소문은 누구를 거쳐 어디까지 전달됐을까?”
                                        </h2>

                                        <p>
                                            값이 아니라 <b>사람과 사람 사이 연결</b>을 따라가는 질문
                                        </p>
                                    </div>
                                </div>


                                <div className="question-compare-grid">

                                    <div className="qa-db-panel qa-rdb">

                                        <div className="qa-db-title">
                                            <strong>RDB</strong>
                                            <span>단계마다 관계를 다시 연결</span>
                                        </div>


                                        <div className="qa-join-chain">
                                            <div>시민</div>
                                            <i>JOIN</i>
                                            <div>전달관계</div>
                                            <i>JOIN</i>
                                            <div>시민</div>
                                            <i>JOIN</i>
                                            <b>…</b>
                                        </div>


                                        <div className="qa-panel-message rdb-message-box">
                                            <strong>
                                                단계가 늘어날수록 JOIN 반복
                                            </strong>

                                            <span>
                                                여러 테이블을 계속 조합
                                            </span>
                                        </div>

                                    </div>


                                    <div className="qa-vs">
                                        VS
                                    </div>


                                    <div className="qa-db-panel qa-graph">

                                        <div className="qa-db-title">
                                            <strong>GRAPH DB</strong>
                                            <span>Relationship을 그대로 따라감</span>
                                        </div>


                                        <div className="qa-graph-chain">

                                            {sceneTwoChainNodes.length >= 2 ? (

                                                sceneTwoChainNodes.map(
                                                    (
                                                        personId,
                                                        index
                                                    ) => {

                                                        const edge =
                                                            sceneTwoChainEdges[
                                                                index
                                                                ];

                                                        return (
                                                            <div
                                                                className="qa-chain-segment"
                                                                key={`${personId}-${index}`}
                                                            >

                                                                <div className="qa-chain-person">
                                                                    <div>
                                                                        {avatarFor(
                                                                            personId
                                                                        )}
                                                                    </div>

                                                                    <strong>
                                                                        {index === 0
                                                                            ? "START"
                                                                            : citizenName(
                                                                                personId
                                                                            )}
                                                                    </strong>
                                                                </div>


                                                                {index
                                                                    < sceneTwoChainNodes.length - 1 && (
                                                                        <div className="qa-chain-edge">
                                                                        <span>
                                                                            {channelLabel(
                                                                                edge?.channel
                                                                            )}
                                                                        </span>
                                                                            <i />
                                                                        </div>
                                                                    )}

                                                            </div>
                                                        );
                                                    }
                                                )

                                            ) : (

                                                <>
                                                    <div className="qa-chain-person">
                                                        <div>
                                                            {avatarFor(
                                                                sceneTwoStartPerson?.id
                                                                || starterId
                                                            )}
                                                        </div>
                                                        <strong>
                                                            START
                                                        </strong>
                                                    </div>

                                                    <div className="qa-chain-edge">
                                                        <span>SPREAD</span>
                                                        <i />
                                                    </div>

                                                    <div className="qa-chain-person">
                                                        <div>👤</div>
                                                        <strong>다음 시민</strong>
                                                    </div>
                                                </>

                                            )}

                                        </div>


                                        <div className="qa-panel-message graph-message-box">
                                            <strong>
                                                저장된 연결을 그대로 Traversal
                                            </strong>

                                            <span>
                                                관계를 따라 다음 시민으로 이동
                                            </span>
                                        </div>

                                    </div>

                                </div>


                                <div className="question-bottom-answer graph-answer">
                                    <span>질문 B</span>
                                    <strong>
                                        여러 단계 관계 탐색 → GraphDB가 더 직관적
                                    </strong>
                                </div>

                            </article>

                        </section>


                        <section className="scene-two-summary">
                            <div>
                                <span>DATA</span>
                                <strong>값·조건을 찾는다</strong>
                                <b>→ RDB</b>
                            </div>

                            <i />

                            <div>
                                <span>RELATION</span>
                                <strong>연결·경로를 따라간다</strong>
                                <b>→ GRAPH DB</b>
                            </div>
                        </section>
                    </>
                )}


                {/* =====================================================
                    FOOTER — 비교장면 버튼 항상 보이게
                ===================================================== */}

                <footer className="compare-footer">

                    <div className="compare-key-message">
                        {sceneOne ? (
                            <>
                                RDB도 관계를 조회할 수 있지만,
                                <b>
                                    {" "}관계가 많고 여러 단계로 이어질수록 GraphDB가 더 직관적
                                </b>
                                입니다.
                            </>
                        ) : (
                            <>
                                <b>
                                    값·조건을 찾는 질문은 RDB,
                                </b>
                                {" "}
                                <b>
                                    연결·경로를 따라가는 질문은 GraphDB
                                </b>
                                가 더 자연스럽습니다.
                            </>
                        )}
                    </div>


                    <div className="compare-footer-actions">

                        <button
                            type="button"
                            className="compare-scene-button"
                            onClick={() =>
                                setCompareScene(
                                    sceneOne
                                        ? 2
                                        : 1
                                )
                            }
                        >
                            {sceneOne
                                ? "비교장면 2 →"
                                : "← 비교장면 1"}
                        </button>


                        <button
                            type="button"
                            className="compare-next"
                            onClick={() =>
                                navigate(
                                    "/centrality",
                                    {
                                        state: {
                                            simulation,
                                        },
                                    }
                                )
                            }
                        >
                            CENTRALITY
                            <ChevronRight size={17} />
                        </button>

                    </div>

                </footer>

            </section>
        </main>
    );
}


export default RdbVsGraphPage;