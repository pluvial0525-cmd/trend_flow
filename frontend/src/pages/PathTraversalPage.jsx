import {
    ChevronRight,
    Mic,
    Users,
    Network,
    Route,
    Search,
    Waypoints,
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

import "../styles/pathTraversalPage.css";


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


const CONCEPTS = [
    {
        id: "traversal",
        title: "Traversal",
        subtitle: "연결을 하나씩 따라가기",
        description: "Node → 관계 → Node",
        icon: Waypoints,
    },
    {
        id: "path",
        title: "Path",
        subtitle: "지나온 전체 길",
        description: "START → ··· → TARGET",
        icon: Route,
    },
    {
        id: "neighbor",
        title: "Neighbor Search",
        subtitle: "주변에 연결된 사람 찾기",
        description: "1단계 · 2단계 연결 확인",
        icon: Users,
    },
    {
        id: "direction",
        title: "Direction",
        subtitle: "관계의 방향 확인",
        description: "누구에게 받고 → 누구에게 전달했는지",
        icon: Network,
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
    idNumber(id) % AVATARS.length
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
                    String(b.target)
                );
            });


    const starterId =
        simulation?.starter?.id
        || events[0]?.source;

    if (!starterId) {
        return null;
    }


    /*
     * 실제 시뮬레이션에서
     * 각 시민에게 최초로 전달된 관계를 부모 관계로 사용
     */
    const parentMap =
        new Map();

    events.forEach((event) => {
        if (
            event.target
            && !parentMap.has(event.target)
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
            depthMemo.has(personId)
        ) {
            return depthMemo.get(personId);
        }

        const event =
            parentMap.get(personId);

        if (!event?.source) {
            return -1;
        }

        const parentDepth =
            getDepth(event.source);

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
                    getDepth(personId),
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

        reverseEdges.push(event);
        reverseNodes.push(event.source);

        current =
            event.source;
    }


    const nodeIds =
        reverseNodes.reverse();

    const pathEdges =
        reverseEdges.reverse();


    /*
     * 화면이 너무 길어지는 경우
     * 시작 2개 + 마지막 4개를 보여준다.
     */
    let displayNodeIds =
        nodeIds;

    let displayEdges =
        pathEdges;


    if (nodeIds.length > 6) {
        displayNodeIds = [
            nodeIds[0],
            nodeIds[1],
            nodeIds[nodeIds.length - 4],
            nodeIds[nodeIds.length - 3],
            nodeIds[nodeIds.length - 2],
            nodeIds[nodeIds.length - 1],
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
                        event.source === source
                        && event.target === target
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
        nodeIds,
        pathEdges,
        displayNodeIds,
        displayEdges,
    };
}




/*
 * 실제 SPREAD 결과에서 특정 시민 주변의 1단계 / 2단계 연결을 찾습니다.
 * 기본 기준 시민은 최초 유포자이며, 최초 유포자에게 연결이 없으면
 * 실제로 가장 많은 사람에게 전달한 시민을 기준으로 선택합니다.
 */
function buildNeighborExample(
    simulation,
    preferredCenterId
) {
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

    const outgoing =
        new Map();

    events.forEach((event) => {
        if (!outgoing.has(event.source)) {
            outgoing.set(
                event.source,
                []
            );
        }

        outgoing
            .get(event.source)
            .push(event);
    });

    let centerId =
        preferredCenterId;

    if (
        !centerId
        || !outgoing.has(centerId)
    ) {
        const best =
            Array.from(
                outgoing.entries()
            )
                .sort(
                    (a, b) =>
                        b[1].length
                        - a[1].length
                )[0];

        centerId =
            best?.[0];
    }

    if (!centerId) {
        return null;
    }

    const directEvents =
        (outgoing.get(centerId) || [])
            .slice(0, 6);

    const firstLevel =
        directEvents.map(
            (event) =>
                event.target
        );

    const seen =
        new Set([
            centerId,
            ...firstLevel,
        ]);

    const secondEvents = [];

    firstLevel.forEach((personId) => {
        for (
            const event
            of outgoing.get(personId) || []
            ) {
            if (
                secondEvents.length >= 8
            ) {
                break;
            }

            if (
                seen.has(event.target)
            ) {
                continue;
            }

            seen.add(event.target);
            secondEvents.push(event);
        }
    });

    const secondLevel =
        secondEvents.map(
            (event) =>
                event.target
        );

    return {
        centerId,
        firstLevel,
        secondLevel,
        directEvents,
        secondEvents,
    };
}


function makeRingPositions(
    count,
    radius,
    startAngle = -90
) {
    if (count <= 0) {
        return [];
    }

    return Array.from(
        { length: count },
        (_, index) => {
            const angle =
                (
                    startAngle
                    + (
                        360 / count
                    ) * index
                )
                * Math.PI
                / 180;

            return {
                x:
                    50
                    + Math.cos(angle)
                    * radius,

                y:
                    50
                    + Math.sin(angle)
                    * radius,
            };
        }
    );
}


function buildDirectionExample(simulation) {
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

    if (events.length === 0) {
        return null;
    }

    /*
     * "받은 관계"와 "보낸 관계"를 동시에 가진 시민을 우선 선택합니다.
     * 즉, source → CENTER → target 흐름이 실제 시뮬레이션 안에 존재하는
     * 시민을 찾아 관계의 방향성을 보여줍니다.
     */
    const incomingMap = new Map();
    const outgoingMap = new Map();

    events.forEach((event) => {
        if (!incomingMap.has(event.target)) {
            incomingMap.set(event.target, []);
        }

        if (!outgoingMap.has(event.source)) {
            outgoingMap.set(event.source, []);
        }

        incomingMap.get(event.target).push(event);
        outgoingMap.get(event.source).push(event);
    });

    const centerCandidates =
        Array.from(incomingMap.keys())
            .filter(
                (personId) =>
                    outgoingMap.has(personId)
            )
            .map((personId) => ({
                personId,
                incoming:
                    incomingMap.get(personId) || [],
                outgoing:
                    outgoingMap.get(personId) || [],
            }))
            .sort(
                (a, b) =>
                    (
                        b.incoming.length
                        + b.outgoing.length
                    )
                    - (
                        a.incoming.length
                        + a.outgoing.length
                    )
            );

    const selected =
        centerCandidates[0];

    if (!selected) {
        const fallback = events[0];

        return {
            centerId: fallback.target,
            incoming: fallback,
            outgoing: null,
        };
    }

    return {
        centerId: selected.personId,
        incoming: selected.incoming[0] || null,
        outgoing: selected.outgoing[0] || null,
    };
}

function compactPath(nodeIds, pathEdges) {
    if (nodeIds.length <= 6) {
        return { displayNodeIds: nodeIds, displayEdges: pathEdges, hiddenCount: 0 };
    }

    const displayNodeIds = [
        nodeIds[0], nodeIds[1],
        nodeIds[nodeIds.length - 4], nodeIds[nodeIds.length - 3],
        nodeIds[nodeIds.length - 2], nodeIds[nodeIds.length - 1],
    ];
    const displayEdges = [];

    for (let i = 0; i < displayNodeIds.length - 1; i += 1) {
        const source = displayNodeIds[i];
        const target = displayNodeIds[i + 1];
        const actual = pathEdges.find(
            (event) => event.source === source && event.target === target
        );
        displayEdges.push(actual || {
            source,
            target,
            channel: "WORD_OF_MOUTH",
            skipped: true,
        });
    }

    return {
        displayNodeIds,
        displayEdges,
        hiddenCount: Math.max(nodeIds.length - displayNodeIds.length, 0),
    };
}

function PathTraversalPage() {
    const location =
        useLocation();

    const navigate =
        useNavigate();


    const [activeConcept, setActiveConcept] =
        useState("traversal");


    const [neighborDepth, setNeighborDepth] =
        useState(1);

    // =========================================================
    // VOICE COMMAND
    // =========================================================

    useEffect(
        () => {

            function handleVoiceCommand(
                event
            ) {

                const type =
                    event?.detail?.type;


                const command =
                    event?.detail?.command
                    || "";


                console.log(
                    "[PATH VOICE]",
                    type,
                    command
                );


                // =============================================
                // TRAVERSAL
                // =============================================

                if (
                    type ===
                    "SHOW_TRAVERSAL"
                ) {

                    setActiveConcept(
                        "traversal"
                    );

                    return;
                }


                // =============================================
                // PATH
                // =============================================

                if (
                    type ===
                    "SHOW_PATH"
                ) {

                    setActiveConcept(
                        "path"
                    );

                    return;
                }


                // =============================================
                // NEIGHBOR
                // =============================================

                if (
                    type ===
                    "SHOW_NEIGHBOR"
                ) {

                    setActiveConcept(
                        "neighbor"
                    );

                    return;
                }


                // =============================================
                // NEIGHBOR 1 STEP
                // =============================================

                if (
                    type ===
                    "SHOW_NEIGHBOR_1"
                ) {

                    setActiveConcept(
                        "neighbor"
                    );

                    setNeighborDepth(
                        1
                    );

                    return;
                }


                // =============================================
                // NEIGHBOR 2 STEP
                // =============================================

                if (
                    type ===
                    "SHOW_NEIGHBOR_2"
                ) {

                    setActiveConcept(
                        "neighbor"
                    );

                    setNeighborDepth(
                        2
                    );

                    return;
                }


                // =============================================
                // DIRECTION
                // =============================================

                if (
                    type ===
                    "SHOW_DIRECTION"
                ) {

                    setActiveConcept(
                        "direction"
                    );
                }
            }


            window.addEventListener(
                "path-voice-command",
                handleVoiceCommand
            );


            return () => {

                window.removeEventListener(
                    "path-voice-command",
                    handleVoiceCommand
                );
            };

        },
        []
    );


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


    const neighborData =
        useMemo(() => {
            if (!simulation || !pathData) {
                return null;
            }

            return buildNeighborExample(
                simulation,
                pathData.starterId
            );
        }, [simulation, pathData]);


    const directionData =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return buildDirectionExample(
                simulation
            );
        }, [simulation]);


    if (
        !simulation
        || !pathData
    ) {
        return (
            <main className="path-page">
                <section className="path-empty">
                    <span>
                        PATH / TRAVERSAL
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
        nodeIds,
        pathEdges,
        displayNodeIds,
        displayEdges,
    } = pathData;


    const totalHop =
        Math.max(
            nodeIds.length - 1,
            0
        );


    const lastChannel =
        channelLabel(
            pathEdges[
            pathEdges.length - 1
                ]?.channel
        );


    const hiddenCount =
        Math.max(
            nodeIds.length
            - displayNodeIds.length,
            0
        );


    const visualNodeIds =
        displayNodeIds;


    const visualEdges =
        displayEdges;


    const visualHiddenCount =
        hiddenCount;

    const firstNeighborCount =
        neighborData?.firstLevel?.length
        || 0;


    const secondNeighborCount =
        neighborData?.secondLevel?.length
        || 0;


    const visibleNeighborCount =
        neighborDepth === 1
            ? firstNeighborCount
            : firstNeighborCount
            + secondNeighborCount;


    const activeData =
        CONCEPTS.find(
            (item) =>
                item.id === activeConcept
        )
        || CONCEPTS[0];

    const ActiveIcon =
        activeData.icon;


    const getVisualTitle = () => {
        switch (activeConcept) {
            case "traversal":
                return "연결을 하나씩 따라가기";

            case "path":
                return "START부터 TARGET까지 지나온 전체 길";

            case "neighbor":
                return "한 시민 주변의 연결을 단계별로 보기";

            case "direction":
                return "관계의 방향으로 전달 흐름 확인";

            default:
                return "";
        }
    };


    const getVisualDescription = () => {
        switch (activeConcept) {
            case "traversal":
                return "관계선을 따라 사람에서 다음 사람으로 이동";

            case "path":
                return `${totalHop}개의 관계를 거쳐 만들어진 하나의 길`;

            case "neighbor":
                return neighborDepth === 1
                    ? `직접 소문을 전달받은 ${firstNeighborCount}명 확인`
                    : `2단계까지 연결된 ${visibleNeighborCount}명 확인`;

            case "direction":
                return directionData
                    ? "누가 나에게 전달했고, 나는 누구에게 전달했는지 비교"
                    : "현재 결과에서 방향을 비교할 관계를 찾지 못함";

            default:
                return "";
        }
    };


    return (
        <main className="path-page">

            {/* HEADER */}
            <header className="path-header">

                <div className="path-brand">
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
                    className="path-back-button"
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
                    ← CYPHER
                </button>

            </header>


            {/* MAIN STAGE */}
            <section className="path-stage">

                {/* TITLE */}
                <div className="path-heading">

                    <p>
                        05
                        <span>
                            PATH / TRAVERSAL
                        </span>
                    </p>

                    <h1 className="page-title">
                        <span className="title-white">Graph는 관계를 따라</span>
                        <span className="title-purple">연결을 탐색</span>
                    </h1>

                </div>


                <section className="path-content">

                    {/* =====================================
                        LEFT : 실제 경로
                    ===================================== */}
                    <article className="path-visual-panel">

                        <div className="panel-title">

                            <div className="panel-icon">
                                <ActiveIcon size={22} />
                            </div>

                            <div>
                                <strong>
                                    {getVisualTitle()}
                                </strong>

                                <span>
                                    {getVisualDescription()}
                                </span>
                            </div>

                        </div>


                        <div className="path-question">
                            <Search size={17} />

                            <span>
                                <b>
                                    {activeData.title}
                                </b>

                                {"  "}

                                {activeConcept === "traversal" &&
                                    "한 사람에서 다음 사람으로 연결을 따라가면?"}

                                {activeConcept === "path" &&
                                    "START부터 TARGET까지 어떤 길을 지나왔을까?"}

                                {activeConcept === "neighbor" &&
                                    "이 시민과 1단계, 2단계로 연결된 사람은 누구일까?"}

                                {activeConcept === "direction" &&
                                    "같은 시민도 관계의 방향에 따라 역할이 어떻게 달라질까?"}
                            </span>
                        </div>


                        {/* GRAPH VIEW */}
                        {activeConcept === "direction" ? (

                            <div className="direction-view">

                                {directionData ? (
                                    <>
                                        <div className="direction-row received-row">

                                            <div className="direction-row-label">
                                                <span>받은 관계</span>
                                                <small>INCOMING</small>
                                            </div>

                                            {directionData.incoming ? (
                                                <div className="direction-flow">

                                                    <div className="direction-person">
                                                        <div className="direction-avatar">
                                                            {avatarFor(
                                                                directionData.incoming.source
                                                            )}
                                                        </div>
                                                        <strong>
                                                            {citizenName(
                                                                directionData.incoming.source
                                                            )}
                                                        </strong>
                                                        <span>전달한 시민</span>
                                                    </div>

                                                    <div className="direction-edge">
                                                        <span>
                                                            {channelLabel(
                                                                directionData.incoming.channel
                                                            )}
                                                        </span>
                                                        <i />
                                                        <small>[:SPREAD]</small>
                                                    </div>

                                                    <div className="direction-person center">
                                                        <div className="direction-avatar">
                                                            {avatarFor(
                                                                directionData.centerId
                                                            )}
                                                        </div>
                                                        <strong>
                                                            {citizenName(
                                                                directionData.centerId
                                                            )}
                                                        </strong>
                                                        <span>기준 시민 · 받음</span>
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="direction-empty">
                                                    받은 관계가 없습니다.
                                                </div>
                                            )}

                                        </div>


                                        <div className="direction-divider">
                                            <span>
                                                같은 시민이라도 화살표 방향에 따라 역할이 달라집니다.
                                            </span>
                                        </div>


                                        <div className="direction-row sent-row">

                                            <div className="direction-row-label">
                                                <span>보낸 관계</span>
                                                <small>OUTGOING</small>
                                            </div>

                                            {directionData.outgoing ? (
                                                <div className="direction-flow">

                                                    <div className="direction-person center">
                                                        <div className="direction-avatar">
                                                            {avatarFor(
                                                                directionData.centerId
                                                            )}
                                                        </div>
                                                        <strong>
                                                            {citizenName(
                                                                directionData.centerId
                                                            )}
                                                        </strong>
                                                        <span>기준 시민 · 보냄</span>
                                                    </div>

                                                    <div className="direction-edge outgoing">
                                                        <span>
                                                            {channelLabel(
                                                                directionData.outgoing.channel
                                                            )}
                                                        </span>
                                                        <i />
                                                        <small>[:SPREAD]</small>
                                                    </div>

                                                    <div className="direction-person">
                                                        <div className="direction-avatar">
                                                            {avatarFor(
                                                                directionData.outgoing.target
                                                            )}
                                                        </div>
                                                        <strong>
                                                            {citizenName(
                                                                directionData.outgoing.target
                                                            )}
                                                        </strong>
                                                        <span>전달받은 시민</span>
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="direction-empty">
                                                    보낸 관계가 없습니다.
                                                </div>
                                            )}

                                        </div>
                                    </>
                                ) : (
                                    <div className="direction-empty">
                                        방향을 비교할 SPREAD 관계가 없습니다.
                                    </div>
                                )}

                            </div>

                        ) : activeConcept === "neighbor" ? (

                            <div className="neighbor-view">

                                <div className="neighbor-depth-switch">
                                    <button
                                        type="button"
                                        className={
                                            neighborDepth === 1
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setNeighborDepth(1)
                                        }
                                    >
                                        1단계 연결
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            neighborDepth === 2
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setNeighborDepth(2)
                                        }
                                    >
                                        2단계까지
                                    </button>
                                </div>


                                {neighborData ? (() => {
                                    const firstPositions =
                                        makeRingPositions(
                                            neighborData.firstLevel.length,
                                            32,
                                            -90
                                        );

                                    const secondPositions =
                                        makeRingPositions(
                                            neighborData.secondLevel.length,
                                            45,
                                            -72
                                        );

                                    const nodePositions =
                                        new Map([
                                            [
                                                neighborData.centerId,
                                                {
                                                    x: 50,
                                                    y: 50,
                                                },
                                            ],
                                        ]);

                                    neighborData.firstLevel.forEach(
                                        (
                                            personId,
                                            index
                                        ) => {
                                            nodePositions.set(
                                                personId,
                                                firstPositions[index]
                                            );
                                        }
                                    );

                                    if (neighborDepth === 2) {
                                        neighborData.secondLevel.forEach(
                                            (
                                                personId,
                                                index
                                            ) => {
                                                nodePositions.set(
                                                    personId,
                                                    secondPositions[index]
                                                );
                                            }
                                        );
                                    }

                                    const visibleEdges = [
                                        ...neighborData.directEvents,
                                        ...(
                                            neighborDepth === 2
                                                ? neighborData.secondEvents
                                                : []
                                        ),
                                    ].filter(
                                        (edge) =>
                                            nodePositions.has(edge.source)
                                            && nodePositions.has(edge.target)
                                    );

                                    return (
                                        <div className="neighbor-network">

                                            <svg
                                                className="neighbor-lines"
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                                aria-hidden="true"
                                            >
                                                <defs>
                                                    <marker
                                                        id="neighbor-arrow"
                                                        markerWidth="6"
                                                        markerHeight="6"
                                                        refX="5"
                                                        refY="3"
                                                        orient="auto"
                                                    >
                                                        <path
                                                            d="M0,0 L6,3 L0,6 Z"
                                                        />
                                                    </marker>
                                                </defs>

                                                {visibleEdges.map(
                                                    (
                                                        edge,
                                                        index
                                                    ) => {
                                                        const source =
                                                            nodePositions.get(
                                                                edge.source
                                                            );

                                                        const target =
                                                            nodePositions.get(
                                                                edge.target
                                                            );

                                                        return (
                                                            <line
                                                                key={`${edge.source}-${edge.target}-${index}`}
                                                                x1={source.x}
                                                                y1={source.y}
                                                                x2={target.x}
                                                                y2={target.y}
                                                                className={
                                                                    neighborData.directEvents.includes(edge)
                                                                        ? "neighbor-line first-line"
                                                                        : "neighbor-line second-line"
                                                                }
                                                                markerEnd="url(#neighbor-arrow)"
                                                            />
                                                        );
                                                    }
                                                )}
                                            </svg>


                                            <div
                                                className="neighbor-person center-person"
                                                style={{
                                                    left: "50%",
                                                    top: "50%",
                                                }}
                                            >
                                                <div className="neighbor-avatar">
                                                    {avatarFor(
                                                        neighborData.centerId
                                                    )}
                                                </div>

                                                <strong>
                                                    {citizenName(
                                                        neighborData.centerId
                                                    )}
                                                </strong>

                                                <span>
                                                    기준 시민
                                                </span>
                                            </div>


                                            {neighborData.firstLevel.map(
                                                (
                                                    personId,
                                                    index
                                                ) => {
                                                    const position =
                                                        firstPositions[index];

                                                    return (
                                                        <div
                                                            key={`first-${personId}`}
                                                            className="neighbor-person first-person"
                                                            style={{
                                                                left:
                                                                    `${position.x}%`,
                                                                top:
                                                                    `${position.y}%`,
                                                            }}
                                                        >
                                                            <div className="neighbor-avatar">
                                                                {avatarFor(
                                                                    personId
                                                                )}
                                                            </div>

                                                            <strong>
                                                                {citizenName(
                                                                    personId
                                                                )}
                                                            </strong>

                                                            <span>
                                                                1단계
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                            )}


                                            {neighborDepth === 2
                                                && neighborData.secondLevel.map(
                                                    (
                                                        personId,
                                                        index
                                                    ) => {
                                                        const position =
                                                            secondPositions[index];

                                                        return (
                                                            <div
                                                                key={`second-${personId}`}
                                                                className="neighbor-person second-person"
                                                                style={{
                                                                    left:
                                                                        `${position.x}%`,
                                                                    top:
                                                                        `${position.y}%`,
                                                                }}
                                                            >
                                                                <div className="neighbor-avatar">
                                                                    {avatarFor(
                                                                        personId
                                                                    )}
                                                                </div>

                                                                <strong>
                                                                    {citizenName(
                                                                        personId
                                                                    )}
                                                                </strong>

                                                                <span>
                                                                    2단계
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                        </div>
                                    );
                                })() : (
                                    <div className="neighbor-empty">
                                        주변 연결 데이터를 찾지 못했습니다.
                                    </div>
                                )}

                            </div>

                        ) : (

                            <div
                                className={
                                    `path-chain concept-mode-${activeConcept}`
                                }
                            >

                                {visualNodeIds.map(
                                    (
                                        personId,
                                        index
                                    ) => {

                                        const isStarter =
                                            personId === starterId;

                                        const isTarget =
                                            personId === targetId;

                                        const edge =
                                            visualEdges[index];


                                        return (
                                            <div
                                                className="path-segment"
                                                key={`${personId}-${index}`}
                                            >

                                                <div
                                                    className={[
                                                        "path-node",

                                                        isStarter
                                                            ? "starter-node"
                                                            : "",

                                                        isTarget
                                                            ? "target-node"
                                                            : "",

                                                        activeConcept === "traversal"
                                                        && index <= 2
                                                            ? "traversal-focus-node"
                                                            : "",

                                                        activeConcept === "traversal"
                                                        && index > 2
                                                            ? "concept-dimmed"
                                                            : "",

                                                        activeConcept === "path"
                                                            ? "path-focus-node"
                                                            : "",

                                                        activeConcept === "direction"
                                                            ? "direction-base-node"
                                                            : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                >

                                                    <div className="path-avatar">
                                                        {avatarFor(
                                                            personId
                                                        )}
                                                    </div>

                                                    <strong>
                                                        {isStarter
                                                            ? "START"
                                                            : citizenName(
                                                                personId
                                                            )}
                                                    </strong>

                                                    <span>
                                                        :Person
                                                    </span>

                                                </div>


                                                {index
                                                    < visualNodeIds.length - 1 && (

                                                        <div
                                                            className={[
                                                                edge?.skipped
                                                                    ? "path-edge skipped"
                                                                    : "path-edge",

                                                                activeConcept === "traversal"
                                                                    ? "traversal-edge"
                                                                    : "",

                                                                activeConcept === "path"
                                                                    ? "active-path-edge"
                                                                    : "",

                                                                activeConcept === "direction"
                                                                    ? "direction-base-edge"
                                                                    : "",
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ")}
                                                        >

                                                        <span>
                                                            {edge?.skipped
                                                                ? visualHiddenCount > 0
                                                                    ? `${visualHiddenCount}명 생략`
                                                                    : "..."
                                                                : channelLabel(
                                                                    edge?.channel
                                                                )}
                                                        </span>

                                                            <i />

                                                            {!edge?.skipped && (
                                                                <small>
                                                                    [:SPREAD]
                                                                </small>
                                                            )}

                                                        </div>
                                                    )}

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        )}


                        {/* MODE EXPLANATION */}
                        <div className="concept-demo">

                            {activeConcept === "traversal" && (
                                <>
                                    <div className="demo-label">
                                        TRAVERSAL
                                    </div>

                                    <div className="demo-main">
                                        사람
                                        <b> → </b>
                                        관계
                                        <b> → </b>
                                        사람
                                        <b> → </b>
                                        관계
                                        <b> → </b>
                                        사람
                                    </div>

                                    <div className="demo-note">
                                        <strong>연결을 하나씩 따라가는 과정</strong>
                                    </div>
                                </>
                            )}


                            {activeConcept === "path" && (
                                <>
                                    <div className="demo-label">
                                        PATH
                                    </div>

                                    <div className="demo-main">
                                        {citizenName(starterId)}
                                        <b> → </b>
                                        ···
                                        <b> → </b>
                                        {citizenName(targetId)}
                                    </div>

                                    <div className="demo-note">
                                        지나온 <strong>사람 + 관계 전체</strong>가 하나의 Path
                                    </div>
                                </>
                            )}


                            {activeConcept === "neighbor" && (
                                <>
                                    <div className="demo-label">
                                        NEIGHBOR SEARCH
                                    </div>

                                    <div className="neighbor-demo">

                                        <div>
                                            <span>기준 시민</span>
                                            <strong>
                                                {neighborData
                                                    ? citizenName(
                                                        neighborData.centerId
                                                    )
                                                    : "-"}
                                            </strong>
                                        </div>

                                        <b>→</b>

                                        <div>
                                            <span>1단계</span>
                                            <strong>
                                                {firstNeighborCount}명
                                            </strong>
                                        </div>

                                        <b>→</b>

                                        <div>
                                            <span>2단계까지</span>
                                            <strong>
                                                {firstNeighborCount
                                                    + secondNeighborCount}명
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="demo-note">
                                        한 시민을 기준으로
                                        <strong> 바로 연결된 사람과 그 다음 연결까지</strong> 확인
                                    </div>
                                </>
                            )}


                            {activeConcept === "direction" && (
                                <>
                                    <div className="demo-label">
                                        DIRECTION
                                    </div>

                                    <div className="direction-demo">

                                        <span>전달한 사람</span>
                                        <b> → </b>
                                        <strong>기준 시민</strong>
                                        <b> → </b>
                                        <span>전달받은 사람</span>

                                    </div>

                                    <div className="demo-note">
                                        관계의 화살표를 보면
                                        <strong> 정보가 어디서 와서 어디로 갔는지</strong> 알 수 있습니다.
                                    </div>
                                </>
                            )}

                        </div>


                        {/* RESULT */}
                        {activeConcept === "neighbor" ? (

                            <div className="path-result neighbor-result">



                            </div>

                        ) : activeConcept === "direction" ? (

                            <div className="path-result direction-result">

                                <div>
                                    <span>FROM</span>
                                    <strong>
                                        {directionData?.incoming
                                            ? citizenName(
                                                directionData.incoming.source
                                            )
                                            : "-"}
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>기준 시민</span>
                                    <strong>
                                        {directionData
                                            ? citizenName(
                                                directionData.centerId
                                            )
                                            : "-"}
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>TO</span>
                                    <strong>
                                        {directionData?.outgoing
                                            ? citizenName(
                                                directionData.outgoing.target
                                            )
                                            : "-"}
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>의미</span>
                                    <strong>받음 → 전달</strong>
                                </div>

                            </div>
                        ) : (

                            <div className="path-result">

                                <div>
                                    <span>START</span>
                                    <strong>
                                        {citizenName(starterId)}
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>거친 관계 수</span>
                                    <strong>
                                        {totalHop}개
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>TARGET</span>
                                    <strong>
                                        {citizenName(targetId)}
                                    </strong>
                                </div>

                                <i>→</i>

                                <div>
                                    <span>마지막 전달 방식</span>
                                    <strong>
                                        {lastChannel}
                                    </strong>
                                </div>

                            </div>

                        )}

                    </article>


                    {/* =====================================
                        RIGHT : 4 CONCEPT BUTTONS
                    ===================================== */}
                    <aside className="path-concepts">

                        <div className="concept-title">

                            <strong>
                                Graph 탐색의 4가지 핵심 개념
                            </strong>

                        </div>


                        {CONCEPTS.map(
                            (concept) => {

                                const Icon =
                                    concept.icon;

                                const isActive =
                                    activeConcept === concept.id;


                                return (
                                    <button
                                        type="button"
                                        key={concept.id}
                                        className={[
                                            "concept-card",
                                            `${concept.id}-card`,
                                            isActive
                                                ? "active"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() =>
                                            setActiveConcept(
                                                concept.id
                                            )
                                        }
                                    >

                                        <div className="concept-icon">
                                            <Icon size={24} />
                                        </div>


                                        <div className="concept-copy">

                                            <div className="concept-head">

                                                <span>
                                                    {concept.title}
                                                </span>

                                                {isActive && (
                                                    <em>
                                                        VIEWING
                                                    </em>
                                                )}

                                            </div>


                                            <strong>
                                                {concept.subtitle}
                                            </strong>


                                            <small>
                                                {concept.description}
                                            </small>

                                        </div>

                                    </button>
                                );
                            }
                        )}

                    </aside>

                </section>


                {/* FOOTER */}
                <footer className="path-footer">

                    <div className="path-key-message">
                        Graph는 <b>연결뿐 아니라 관계의 방향</b>까지 저장해
                        정보가 <b>어디서 와서 어디로 전달됐는지</b> 추적할 수 있습니다.
                    </div>

                    <button
                        type="button"
                        className="path-next"
                        onClick={() =>
                            navigate(
                                "/rdb-vs-graph",
                                {
                                    state: {
                                        simulation,
                                    },
                                }
                            )
                        }
                    >
                        RDB vs GRAPH
                        <ChevronRight size={17} />
                    </button>

                </footer>

            </section>

        </main>
    );
}


export default PathTraversalPage;