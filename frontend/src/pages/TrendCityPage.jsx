import {
    Background,
    MarkerType,
    ReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    LoaderCircle,
    Play,
    RotateCcw,
} from "lucide-react";

import CitizenNode from "../components/trendCity/CitizenNode";
import CitizenDetail from "../components/trendCity/CitizenDetail";
import SpreadEdge from "../components/trendCity/SpreadEdge";
import { getRumorSimulation } from "../api/simulationApi";
import "../styles/trendCity.css";


const nodeTypes = {
    citizen: CitizenNode,
};

const edgeTypes = {
    spread: SpreadEdge,
};


/* =========================================================
   Animation
========================================================= */

const EVENT_BATCH_SIZE = 2;
const EVENT_INTERVAL = 220;
const STEP_INTERVAL = 420;

/* 현재 전달 화살표 유지 시간 */
const EDGE_ACTIVE_TIME = 4500;

/* 말풍선 유지 시간 */
const SPEECH_TIME = 5000;

/* 한 STEP에서 동시에 보이는 최대 말풍선 */
const MAX_ACTIVE_SPEAKERS = 4;


/* =========================================================
   Layout
   핵심:
   1. START는 중앙
   2. target은 반드시 실제 source가 배치된 뒤 배치
   3. source 주변의 가까운 후보만 사용
   4. 전체 화면 빈자리 탐색 금지
   5. 후보가 겹치면 source 주변에서만 조금씩 반경 확대
   6. 채널은 위치가 아니라 Edge 색/스타일로 표현
========================================================= */

const CITY_CENTER = {
    x: 700,
    y: 520,
};

const SOURCE_MIN_DISTANCE = 82;
const SOURCE_PREFERRED_DISTANCE = 118;
const SOURCE_MAX_DISTANCE = 155;

const MIN_NODE_DISTANCE = 64;
const MAX_PLACEMENT_TRIES = 48;

/*
 * source에서 절대로 이 거리보다 멀리 배치하지 않는다.
 * 장거리 선 방지용 hard limit.
 */
const ABSOLUTE_MAX_SOURCE_DISTANCE = 175;

/*
 * 그래프 전체가 끝없이 커지는 것만 막는 soft boundary.
 */
const MAX_GLOBAL_RADIUS = 1180;


function getIdNumber(id) {
    return Number(String(id).replace(/\D/g, "")) || 0;
}


function hashNumber(value) {
    let hash = 2166136261;
    const text = String(value);

    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}


function seededUnit(value) {
    return (hashNumber(value) % 100000) / 100000;
}


function distanceBetween(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}


function createFirstHeardStepMap(timeline) {
    const result = new Map();

    (timeline || []).forEach((item) => {
        (item.new_people || []).forEach((personId) => {
            if (!result.has(personId)) {
                result.set(personId, item.step);
            }
        });
    });

    return result;
}


function createPrimaryParentMap(spreadEvents) {
    const result = new Map();

    (spreadEvents || [])
        .slice()
        .sort((a, b) => {
            if (a.step !== b.step) {
                return a.step - b.step;
            }

            return getIdNumber(a.target) - getIdNumber(b.target);
        })
        .forEach((event) => {
            /*
             * 같은 target에 여러 전달 기록이 있어도
             * 최초 전달 관계 하나만 메인 그래프 관계로 사용.
             */
            if (!result.has(event.target)) {
                result.set(event.target, event);
            }
        });

    return result;
}


function clampToGlobalBounds(candidate) {
    const dx = candidate.x - CITY_CENTER.x;
    const dy = candidate.y - CITY_CENTER.y;

    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius <= MAX_GLOBAL_RADIUS) {
        return candidate;
    }

    const scale =
        MAX_GLOBAL_RADIUS
        / Math.max(radius, 1);

    return {
        x: CITY_CENTER.x + dx * scale,
        y: CITY_CENTER.y + dy * scale,
    };
}


function createPositionMap(
    people,
    starterId,
    timeline,
    spreadEvents
) {
    const positionMap = new Map();

    positionMap.set(starterId, {
        x: CITY_CENTER.x,
        y: CITY_CENTER.y,
    });

    const placedIds = [starterId];

    const firstHeardMap =
        createFirstHeardStepMap(timeline);

    const primaryParentMap =
        createPrimaryParentMap(spreadEvents);

    /*
     * Edge와 위치가 같은 부모 관계를 사용한다.
     * 이것이 중요하다.
     *
     * 이전에는 위치 계산은 전체 spread_events,
     * Edge는 primary parent를 사용해서
     * 일부 target의 위치와 실제 표시 Edge가 어긋날 수 있었다.
     */
    const pendingEvents =
        Array.from(primaryParentMap.values())
            .sort((a, b) => {
                if (a.step !== b.step) {
                    return a.step - b.step;
                }

                return (
                    getIdNumber(a.target)
                    - getIdNumber(b.target)
                );
            });


    function getCrowdingScore(candidate) {
        let score = 0;

        placedIds.forEach((personId) => {
            const position =
                positionMap.get(personId);

            if (!position) {
                return;
            }

            const distance =
                distanceBetween(
                    candidate,
                    position
                );

            if (distance < MIN_NODE_DISTANCE) {
                score +=
                    (MIN_NODE_DISTANCE - distance)
                    * 9;
            }

            if (distance < 105) {
                score +=
                    (105 - distance)
                    * 0.12;
            }
        });

        return score;
    }


    function makeCandidate(
        event,
        attempt,
        siblingIndex,
        siblingCount
    ) {
        /*
         * 여기서는 fallback으로 CENTER를 쓰지 않는다.
         * source가 없으면 호출 자체를 하지 않는다.
         */
        const sourcePosition =
            positionMap.get(event.source);

        if (!sourcePosition) {
            return null;
        }

        const seedKey =
            `${event.source}-${event.target}-${event.step}`;

        const angleSeed =
            seededUnit(
                `${seedKey}-angle-${attempt}`
            );

        const distanceSeed =
            seededUnit(
                `${seedKey}-distance-${attempt}`
            );

        let angle =
            angleSeed
            * Math.PI
            * 2;

        /*
         * 같은 source의 자식이 동시에 생길 때
         * 완전히 겹치는 것만 방지.
         * 부채꼴이나 원형으로 정렬하지 않는다.
         */
        if (siblingCount > 1) {
            const siblingOffset =
                (
                    siblingIndex
                    / Math.max(
                        siblingCount - 1,
                        1
                    )
                    - 0.5
                ) * 0.42;

            angle += siblingOffset;
        }

        /*
         * 앞쪽 attempt일수록 source 가까이.
         * 주변이 너무 붐빌 때만 조금씩 바깥 후보를 허용한다.
         */
        const expansionRatio =
            attempt
            / Math.max(
                MAX_PLACEMENT_TRIES - 1,
                1
            );

        const localMaxDistance =
            SOURCE_PREFERRED_DISTANCE
            + (
                SOURCE_MAX_DISTANCE
                - SOURCE_PREFERRED_DISTANCE
            ) * expansionRatio;

        const distance =
            SOURCE_MIN_DISTANCE
            + distanceSeed
            * (
                localMaxDistance
                - SOURCE_MIN_DISTANCE
            );

        const candidate = {
            x:
                sourcePosition.x
                + Math.cos(angle)
                * distance,

            y:
                sourcePosition.y
                + Math.sin(angle)
                * distance,
        };

        return clampToGlobalBounds(candidate);
    }


    function placeChild(
        event,
        siblingIndex = 0,
        siblingCount = 1
    ) {
        if (positionMap.has(event.target)) {
            return true;
        }

        const sourcePosition =
            positionMap.get(event.source);

        /*
         * source가 아직 화면에 없으면 target을 배치하지 않는다.
         * CENTER에 임시 배치하지 않는 것이 장거리 선 제거의 핵심.
         */
        if (!sourcePosition) {
            return false;
        }

        let bestCandidate = null;
        let bestScore = Infinity;

        for (
            let attempt = 0;
            attempt < MAX_PLACEMENT_TRIES;
            attempt += 1
        ) {
            const candidate =
                makeCandidate(
                    event,
                    attempt,
                    siblingIndex,
                    siblingCount
                );

            if (!candidate) {
                continue;
            }

            const crowdingScore =
                getCrowdingScore(candidate);

            const sourceDistance =
                distanceBetween(
                    candidate,
                    sourcePosition
                );

            /*
             * 가까운 배치를 강하게 선호.
             * 겹침을 피하더라도 source에서 멀어지는 선택은 불리하게.
             */
            const distancePenalty =
                Math.max(
                    0,
                    sourceDistance
                    - SOURCE_PREFERRED_DISTANCE
                ) * 1.8;

            const score =
                crowdingScore
                + distancePenalty;

            if (score < bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }

            if (
                crowdingScore < 2
                && sourceDistance
                <= SOURCE_PREFERRED_DISTANCE + 8
            ) {
                break;
            }
        }

        /*
         * 모든 후보가 복잡해도 source 주변에서만 fallback.
         */
        if (!bestCandidate) {
            const angle =
                seededUnit(
                    `${event.target}-fallback-angle`
                )
                * Math.PI
                * 2;

            const distance =
                SOURCE_MIN_DISTANCE
                + seededUnit(
                    `${event.target}-fallback-distance`
                )
                * (
                    SOURCE_PREFERRED_DISTANCE
                    - SOURCE_MIN_DISTANCE
                );

            bestCandidate = {
                x:
                    sourcePosition.x
                    + Math.cos(angle)
                    * distance,

                y:
                    sourcePosition.y
                    + Math.sin(angle)
                    * distance,
            };
        }

        /*
         * 마지막 안전장치:
         * source-target 거리가 hard limit을 넘으면
         * source 방향으로 다시 당긴다.
         */
        const finalDistance =
            distanceBetween(
                bestCandidate,
                sourcePosition
            );

        if (
            finalDistance
            > ABSOLUTE_MAX_SOURCE_DISTANCE
        ) {
            const dx =
                bestCandidate.x
                - sourcePosition.x;

            const dy =
                bestCandidate.y
                - sourcePosition.y;

            const scale =
                ABSOLUTE_MAX_SOURCE_DISTANCE
                / Math.max(
                    finalDistance,
                    1
                );

            bestCandidate = {
                x:
                    sourcePosition.x
                    + dx * scale,

                y:
                    sourcePosition.y
                    + dy * scale,
            };
        }

        positionMap.set(
            event.target,
            bestCandidate
        );

        placedIds.push(event.target);

        return true;
    }


    /*
     * source가 먼저 배치된 관계만 처리한다.
     * 한 번에 처리되지 않은 관계는 다음 round에서 다시 시도.
     *
     * 따라서 같은 STEP 내부에서
     * A -> B -> C 같은 관계가 있어도
     * B가 먼저 배치된 뒤 C가 B 주변에 생긴다.
     */
    let remaining =
        pendingEvents.slice();

    let safetyRound = 0;

    while (
        remaining.length > 0
        && safetyRound
        < pendingEvents.length + 5
        ) {
        const nextRemaining = [];

        const sourceCounts = new Map();

        remaining.forEach((event) => {
            sourceCounts.set(
                event.source,
                (
                    sourceCounts.get(event.source)
                    || 0
                ) + 1
            );
        });

        const sourceIndexes = new Map();

        let placedThisRound = 0;

        remaining.forEach((event) => {
            if (!positionMap.has(event.source)) {
                nextRemaining.push(event);
                return;
            }

            const siblingIndex =
                sourceIndexes.get(event.source)
                || 0;

            const siblingCount =
                sourceCounts.get(event.source)
                || 1;

            const placed =
                placeChild(
                    event,
                    siblingIndex,
                    siblingCount
                );

            sourceIndexes.set(
                event.source,
                siblingIndex + 1
            );

            if (placed) {
                placedThisRound += 1;
            } else {
                nextRemaining.push(event);
            }
        });

        remaining = nextRemaining;
        safetyRound += 1;

        if (placedThisRound === 0) {
            break;
        }
    }


    /*
     * 비정상 데이터 fallback.
     *
     * spread_event의 source가 데이터에 없거나
     * 연결 체인이 끊긴 경우에만 사용한다.
     *
     * 아무 과거 시민을 랜덤 선택하지 않고,
     * 시간상 가장 가까운 이전 STEP 시민 중
     * 안정적인 한 명을 선택한다.
     */
    const unresolvedIds =
        new Set(
            remaining.map(
                (event) => event.target
            )
        );

    (timeline || []).forEach((item) => {
        (item.new_people || []).forEach(
            (personId, index) => {
                if (
                    personId === starterId
                    || positionMap.has(personId)
                ) {
                    return;
                }

                const personStep =
                    firstHeardMap.get(personId)
                    ?? item.step;

                const previousCandidates =
                    placedIds
                        .filter((id) => {
                            const step =
                                id === starterId
                                    ? 0
                                    : firstHeardMap.get(id);

                            return (
                                step !== undefined
                                && step < personStep
                            );
                        })
                        .sort((a, b) => {
                            const stepA =
                                a === starterId
                                    ? 0
                                    : firstHeardMap.get(a);

                            const stepB =
                                b === starterId
                                    ? 0
                                    : firstHeardMap.get(b);

                            return stepB - stepA;
                        });

                /*
                 * 가장 최근 이전 STEP의 후보들 중 하나를 선택.
                 * 전체 그래프 반대편 시민이 뽑힐 가능성을 줄인다.
                 */
                const latestStep =
                    previousCandidates.length
                        ? (
                            previousCandidates[0]
                            === starterId
                                ? 0
                                : firstHeardMap.get(
                                    previousCandidates[0]
                                )
                        )
                        : 0;

                const latestCandidates =
                    previousCandidates.filter(
                        (id) => {
                            const step =
                                id === starterId
                                    ? 0
                                    : firstHeardMap.get(id);

                            return step === latestStep;
                        }
                    );

                const sourceId =
                    latestCandidates.length
                        ? latestCandidates[
                        hashNumber(
                            `${personId}-${index}`
                        )
                        % latestCandidates.length
                            ]
                        : starterId;

                const sourcePosition =
                    positionMap.get(sourceId)
                    || CITY_CENTER;

                const angle =
                    seededUnit(
                        `${personId}-orphan-angle`
                    )
                    * Math.PI
                    * 2;

                const distance =
                    SOURCE_MIN_DISTANCE
                    + seededUnit(
                        `${personId}-orphan-distance`
                    )
                    * (
                        SOURCE_PREFERRED_DISTANCE
                        - SOURCE_MIN_DISTANCE
                    );

                positionMap.set(
                    personId,
                    {
                        x:
                            sourcePosition.x
                            + Math.cos(angle)
                            * distance,

                        y:
                            sourcePosition.y
                            + Math.sin(angle)
                            * distance,
                    }
                );

                placedIds.push(personId);
                unresolvedIds.delete(personId);
            }
        );
    });

    return positionMap;
}


/* =========================================================
   Data Helpers
========================================================= */

function createPersonMap(people) {
    return new Map(
        (people || []).map((person) => [
            person.id,
            person,
        ])
    );
}


function createTargetEventMap(spreadEvents) {
    return createPrimaryParentMap(spreadEvents);
}


function getEventId(event) {
    return (
        `spread-${event.step}-${event.source}-${event.target}`
    );
}


function getRumorText(simulation) {
    if (typeof simulation?.rumor === "string") {
        return simulation.rumor;
    }

    if (simulation?.rumor?.text) {
        return simulation.rumor.text;
    }

    return "소개팅에 스키니진 입고 가면 애프터 못 받는대.";
}


/* =========================================================
   Node Status / Reaction
========================================================= */

function getCitizenStatus({
                              personId,
                              starterId,
                              firstStep,
                              currentStep,
                              event,
                              activeEventIds,
                          }) {
    if (personId === starterId) {
        return currentStep === 0
            ? "spreading"
            : "completed";
    }

    if (!event) {
        return "heard";
    }

    const eventId =
        getEventId(event);

    if (activeEventIds.has(eventId)) {
        return "spreading";
    }

    if (firstStep <= currentStep) {
        return event.will_retransmit
            ? "completed"
            : "stopped";
    }

    return "idle";
}


function getReaction(status, person) {
    if (status === "stopped") {
        return "uninterested";
    }

    if (status === "spreading") {
        return person?.personality === "회의적"
            ? "skeptical"
            : "sharing";
    }

    if (status === "completed") {
        return "neutral";
    }

    return "surprised";
}


function shouldSpeak(
    event,
    person,
    indexInStep
) {
    if (event?.will_retransmit === false) {
        return true;
    }

    if (
        person?.personality === "회의적"
        || person?.personality === "유행민감"
        || person?.personality === "외향적"
    ) {
        return true;
    }

    return indexInStep % 6 === 0;
}


function getSpeechBubble(
    person,
    event,
    index
) {
    if (event?.will_retransmit === false) {
        const messages = [
            "난 여기까지만 들을래.",
            "음... 난 굳이 안 퍼뜨릴래.",
            "에이, 이건 좀 아닌 것 같은데.",
        ];

        return messages[
        index % messages.length
            ];
    }

    const channelMessages = {
        WORD_OF_MOUTH: [
            "야, 너 이 얘기 들었어?",
            "이거 진짜래? 너도 들어봤어?",
            "친구한테 들었는데 말이야...",
        ],

        SNS: [
            "이거 SNS에서 봤는데?",
            "이거 스토리에 올려야겠다.",
            "요즘 피드에 이 얘기 계속 뜨던데?",
        ],

        VIDEO: [
            "이 영상 봤어?",
            "숏폼에서 이 얘기 나오던데?",
            "이 영상 요즘 엄청 뜨더라.",
        ],

        COMMUNITY: [
            "우리 단톡에서도 이 얘기 나오던데?",
            "커뮤니티에서 이 얘기 봤어.",
            "우리 모임에서도 다들 얘기하더라.",
        ],
    };

    const messages =
        channelMessages[event?.channel]
        || [
            "이거 진짜래?",
            "너도 이 소문 들었어?",
            "요즘 이 얘기 많이 나오던데?",
        ];

    if (person?.personality === "회의적") {
        return "진짜일까? 좀 더 봐야겠는데.";
    }

    return messages[
    index % messages.length
        ];
}


/* =========================================================
   Flow Nodes
========================================================= */

function createFlowNodes({
                             simulation,
                             currentStep,
                             positionMap,
                             visibleEventCount,
                             activeEventIds,
                             speakerIds,
                         }) {
    const people =
        simulation.nodes || [];

    const peopleMap =
        createPersonMap(people);

    const firstHeardMap =
        createFirstHeardStepMap(
            simulation.timeline
        );

    const targetEventMap =
        createTargetEventMap(
            simulation.spread_events
        );

    const starterId =
        simulation.starter.id;

    const visibleIds = [];

    firstHeardMap.forEach(
        (step, personId) => {
            if (step < currentStep) {
                visibleIds.push(personId);
            }
        }
    );

    const currentStepEvents =
        (simulation.spread_events || [])
            .filter(
                (event) =>
                    event.step === currentStep
            );

    currentStepEvents
        .slice(0, visibleEventCount)
        .forEach((event) => {
            if (
                !visibleIds.includes(
                    event.target
                )
            ) {
                visibleIds.push(
                    event.target
                );
            }
        });

    if (!visibleIds.includes(starterId)) {
        visibleIds.unshift(starterId);
    }

    return visibleIds.map((personId) => {
        const person =
            peopleMap.get(personId)
            || (
                personId === starterId
                    ? simulation.starter
                    : {
                        id: personId,
                        name: personId,
                    }
            );

        const firstStep =
            personId === starterId
                ? 0
                : firstHeardMap.get(personId);

        const event =
            targetEventMap.get(personId);

        const status =
            getCitizenStatus({
                personId,
                starterId,
                firstStep,
                currentStep,
                event,
                activeEventIds,
            });

        const reaction =
            getReaction(
                status,
                person
            );

        let bubble = null;
        let bubbleStopped = false;

        if (
            personId === starterId
            && currentStep <= 1
        ) {
            bubble =
                getRumorText(simulation);
        }

        if (
            personId !== starterId
            && speakerIds.includes(personId)
        ) {
            const speechEvent =
                currentStepEvents.find(
                    (item) =>
                        item.target === personId
                )
                || event;

            const currentIndex =
                currentStepEvents.findIndex(
                    (item) =>
                        item.target === personId
                );

            bubble =
                getSpeechBubble(
                    person,
                    speechEvent,
                    Math.max(
                        currentIndex,
                        0
                    )
                );

            bubbleStopped =
                speechEvent?.will_retransmit
                === false;
        }

        return {
            id: personId,
            type: "citizen",

            position:
                positionMap.get(personId)
                || CITY_CENTER,

            data: {
                person,
                starter:
                    personId === starterId,
                status,
                reaction,
                bubble,
                bubbleStopped,
            },
        };
    });
}


/* =========================================================
   Flow Edges
========================================================= */

function getRelationshipLabel(event) {
    if (event?.channel_label) {
        return event.channel_label;
    }

    const labels = {
        WORD_OF_MOUTH: "입소문",
        SNS: "SNS",
        VIDEO: "영상",
        COMMUNITY: "커뮤니티",
    };

    return labels[event?.channel] || "";
}


function createFlowEdges({
                             simulation,
                             currentStep,
                             visibleEventCount,
                             activeEventIds,
                         }) {
    const primaryParentMap =
        createPrimaryParentMap(
            simulation.spread_events || []
        );

    const allEvents =
        Array.from(
            primaryParentMap.values()
        );

    const previousEvents =
        allEvents.filter(
            (event) =>
                event.step < currentStep
        );

    const currentEvents =
        allEvents
            .filter(
                (event) =>
                    event.step === currentStep
            )
            .slice(
                0,
                visibleEventCount
            );

    const visibleEvents = [
        ...previousEvents,
        ...currentEvents,
    ];

    return visibleEvents.map((event) => {
        const edgeId =
            getEventId(event);

        let status = "history";

        if (activeEventIds.has(edgeId)) {
            status = "spreading";
        } else if (
            event.step === currentStep
            || event.step === currentStep - 1
        ) {
            status =
                event.will_retransmit
                    ? "completed"
                    : "stopped";
        }

        const relationship =
            event.step === currentStep
                ? getRelationshipLabel(event)
                : "";

        return {
            id: edgeId,
            source: event.source,
            target: event.target,
            type: "spread",

            markerEnd: {
                type: MarkerType.ArrowClosed,
            },

            data: {
                status,
                relationship,
                channel:
                    event.channel
                    || "WORD_OF_MOUTH",
                channelLabel:
                    event.channel_label
                    || getRelationshipLabel(
                        event
                    ),
            },
        };
    });
}



/* =========================================================
   Session Restore
   Graph Structure 등 다른 페이지로 이동했다가
   다시 Trend City로 돌아오면 마지막 완료 결과를 복원합니다.
========================================================= */

const LAST_SIMULATION_KEY =
    "trendCity:lastSimulation";


function getSavedSimulation() {
    try {
        const raw =
            sessionStorage.getItem(
                LAST_SIMULATION_KEY
            );

        return raw
            ? JSON.parse(raw)
            : null;

    } catch (error) {
        console.error(
            "이전 시뮬레이션 결과를 불러오지 못했습니다.",
            error
        );

        return null;
    }
}


function getLastSimulationStep(
    simulation
) {
    if (!simulation) {
        return 0;
    }

    const timeline =
        simulation.timeline || [];

    if (timeline.length === 0) {
        return 0;
    }

    return Math.max(
        ...timeline.map(
            (item) =>
                item.step ?? 0
        )
    );
}


function getVisibleEventCountAtStep(
    simulation,
    step
) {
    if (!simulation) {
        return 0;
    }

    return (
        simulation.spread_events || []
    ).filter(
        (event) =>
            event.step === step
    ).length;
}


function saveSimulationToSession(
    simulation
) {
    if (!simulation) {
        return;
    }

    try {
        sessionStorage.setItem(
            LAST_SIMULATION_KEY,
            JSON.stringify(simulation)
        );

    } catch (error) {
        console.error(
            "시뮬레이션 결과 저장에 실패했습니다.",
            error
        );
    }
}


/* =========================================================
   Main Page
========================================================= */

function TrendCityPage() {
    const navigate = useNavigate();

    /*
     * 다른 페이지에서 SIMULATION으로 돌아왔을 때
     * 마지막 시뮬레이션 결과를 그대로 복원하기 위한 초기값입니다.
     */
    const restoredSimulationRef =
        useRef(
            getSavedSimulation()
        );

    const restoredSimulation =
        restoredSimulationRef.current;

    const restoredStep =
        getLastSimulationStep(
            restoredSimulation
        );

    const [
        simulation,
        setSimulation,
    ] = useState(
        () => restoredSimulation
    );

    const [
        currentStep,
        setCurrentStep,
    ] = useState(
        () => restoredStep
    );

    const [
        visibleEventCount,
        setVisibleEventCount,
    ] = useState(
        () =>
            getVisibleEventCountAtStep(
                restoredSimulation,
                restoredStep
            )
    );

    const [
        activeEventIds,
        setActiveEventIds,
    ] = useState(new Set());

    const [
        speakerIds,
        setSpeakerIds,
    ] = useState([]);

    const [
        phase,
        setPhase,
    ] = useState(
        () =>
            restoredSimulation
                ? "result"
                : "ready"
    );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        flowInstance,
        setFlowInstance,
    ] = useState(null);

    const [
        selectedCitizenId,
        setSelectedCitizenId,
    ] = useState(null);

    const timersRef = useRef([]);
    const speakerIdsRef = useRef([]);
    const speakerPlanRef =
        useRef(new Set());

    /*
     * 실행 중인 시뮬레이션을 구분하는 토큰.
     * RESET / 재시작 / 최종 종료 후 예전에 만들어진
     * setTimeout 콜백이 뒤늦게 실행되는 것을 막는다.
     */
    const runTokenRef = useRef(0);
    const isRunningRef = useRef(false);


    const clearTimers = () => {
        timersRef.current.forEach(
            (timer) =>
                clearTimeout(timer)
        );

        timersRef.current = [];
        speakerIdsRef.current = [];
        speakerPlanRef.current =
            new Set();

        setSpeakerIds([]);
        setActiveEventIds(new Set());
    };


    const finishSimulation = (
        runToken
    ) => {
        if (
            runToken !== runTokenRef.current
        ) {
            return;
        }

        isRunningRef.current = false;
        runTokenRef.current += 1;

        clearTimers();

        /*
         * 완료 시점의 결과도 다시 저장해둡니다.
         */
        saveSimulationToSession(
            simulation
        );

        setPhase("result");
    };


    const positionMap =
        useMemo(() => {
            if (!simulation) {
                return new Map();
            }

            return createPositionMap(
                simulation.nodes || [],
                simulation.starter.id,
                simulation.timeline || [],
                simulation.spread_events || []
            );
        }, [simulation]);


    const maxStep =
        useMemo(() => {
            if (!simulation) {
                return 0;
            }

            const timeline =
                simulation.timeline || [];

            if (timeline.length === 0) {
                return 0;
            }

            return Math.max(
                ...timeline.map(
                    (item) => item.step
                )
            );
        }, [simulation]);


    const prepareStepSpeakers = (
        stepEvents,
        peopleMap
    ) => {
        const candidates =
            stepEvents
                .map(
                    (event, index) => ({
                        event,
                        index,
                        person:
                            peopleMap.get(
                                event.target
                            ),
                    })
                )
                .filter(
                    ({
                         event,
                         person,
                         index,
                     }) =>
                        shouldSpeak(
                            event,
                            person,
                            index
                        )
                );

        const selected = [];

        candidates.forEach(({ event }) => {
            if (
                selected.length
                >= MAX_ACTIVE_SPEAKERS
            ) {
                return;
            }

            if (
                !selected.includes(
                    event.target
                )
            ) {
                selected.push(
                    event.target
                );
            }
        });

        /*
         * 최소 3명 정도는 말하도록 보충.
         * 단 STEP 인원이 3명 미만이면 가능한 만큼만.
         */
        if (selected.length < 3) {
            stepEvents.forEach(
                (event, index) => {
                    if (
                        selected.length
                        >= MAX_ACTIVE_SPEAKERS
                    ) {
                        return;
                    }

                    const interval =
                        Math.max(
                            1,
                            Math.floor(
                                stepEvents.length
                                / 4
                            )
                        );

                    if (
                        index % interval === 0
                        && !selected.includes(
                            event.target
                        )
                    ) {
                        selected.push(
                            event.target
                        );
                    }
                }
            );
        }

        speakerPlanRef.current =
            new Set(selected);
    };


    const showSpeakers = (batch) => {
        batch.forEach((event) => {
            const personId =
                event.target;

            if (
                !speakerPlanRef.current.has(
                    personId
                )
            ) {
                return;
            }

            if (
                speakerIdsRef.current.includes(
                    personId
                )
            ) {
                return;
            }

            if (
                speakerIdsRef.current.length
                >= MAX_ACTIVE_SPEAKERS
            ) {
                return;
            }

            const next = [
                ...speakerIdsRef.current,
                personId,
            ];

            speakerIdsRef.current = next;
            setSpeakerIds(next);

            const speechTimer =
                setTimeout(() => {
                    const after =
                        speakerIdsRef.current
                            .filter(
                                (id) =>
                                    id
                                    !== personId
                            );

                    speakerIdsRef.current =
                        after;

                    setSpeakerIds(after);
                }, SPEECH_TIME);

            timersRef.current.push(
                speechTimer
            );
        });
    };


    const playStep = (
        step,
        lastStep,
        simulationData,
        runToken
    ) => {
        const data =
            simulationData
            || simulation;

        if (
            !data
            || !isRunningRef.current
            || runToken
            !== runTokenRef.current
        ) {
            return;
        }

        if (step > lastStep) {
            finishSimulation(runToken);
            return;
        }

        const stepEvents =
            (data.spread_events || [])
                .filter(
                    (event) =>
                        event.step === step
                );

        const peopleMap =
            createPersonMap(
                data.nodes || []
            );

        prepareStepSpeakers(
            stepEvents,
            peopleMap
        );

        setCurrentStep(step);
        setVisibleEventCount(0);
        setPhase("spreading");

        if (stepEvents.length === 0) {
            const emptyTimer =
                setTimeout(() => {
                    if (
                        !isRunningRef.current
                        || runToken
                        !== runTokenRef.current
                    ) {
                        return;
                    }

                    if (step >= lastStep) {
                        finishSimulation(runToken);
                        return;
                    }

                    setPhase("result");

                    const nextTimer =
                        setTimeout(
                            () => {
                                if (
                                    !isRunningRef.current
                                    || runToken
                                    !== runTokenRef.current
                                ) {
                                    return;
                                }

                                playStep(
                                    step + 1,
                                    lastStep,
                                    data,
                                    runToken
                                );
                            },
                            STEP_INTERVAL
                        );

                    timersRef.current.push(
                        nextTimer
                    );
                }, STEP_INTERVAL);

            timersRef.current.push(
                emptyTimer
            );
            return;
        }

        let revealed = 0;

        const revealNextBatch = () => {
            if (
                !isRunningRef.current
                || runToken
                !== runTokenRef.current
            ) {
                return;
            }

            const startIndex = revealed;
            const endIndex =
                Math.min(
                    startIndex
                    + EVENT_BATCH_SIZE,
                    stepEvents.length
                );

            const batch =
                stepEvents.slice(
                    startIndex,
                    endIndex
                );

            if (batch.length === 0) {
                if (step >= lastStep) {
                    finishSimulation(runToken);
                }
                return;
            }

            const batchIds =
                batch.map(getEventId);

            setActiveEventIds(
                (previousIds) => {
                    const nextIds =
                        new Set(previousIds);

                    batchIds.forEach(
                        (edgeId) => {
                            nextIds.add(edgeId);
                        }
                    );

                    return nextIds;
                }
            );

            revealed = endIndex;
            setVisibleEventCount(revealed);
            showSpeakers(batch);

            const activeTimer =
                setTimeout(() => {
                    if (
                        !isRunningRef.current
                        || runToken
                        !== runTokenRef.current
                    ) {
                        return;
                    }

                    setActiveEventIds(
                        (previousIds) => {
                            const nextIds =
                                new Set(previousIds);

                            batchIds.forEach(
                                (edgeId) => {
                                    nextIds.delete(edgeId);
                                }
                            );

                            return nextIds;
                        }
                    );
                }, EDGE_ACTIVE_TIME);

            timersRef.current.push(
                activeTimer
            );

            if (revealed < stepEvents.length) {
                const nextBatchTimer =
                    setTimeout(
                        () => {
                            if (
                                !isRunningRef.current
                                || runToken
                                !== runTokenRef.current
                            ) {
                                return;
                            }
                            revealNextBatch();
                        },
                        EVENT_INTERVAL
                    );

                timersRef.current.push(
                    nextBatchTimer
                );
                return;
            }

            const resultTimer =
                setTimeout(() => {
                    if (
                        !isRunningRef.current
                        || runToken
                        !== runTokenRef.current
                    ) {
                        return;
                    }

                    if (step >= lastStep) {
                        finishSimulation(runToken);
                        return;
                    }

                    setPhase("result");

                    const nextStepTimer =
                        setTimeout(
                            () => {
                                if (
                                    !isRunningRef.current
                                    || runToken
                                    !== runTokenRef.current
                                ) {
                                    return;
                                }

                                playStep(
                                    step + 1,
                                    lastStep,
                                    data,
                                    runToken
                                );
                            },
                            STEP_INTERVAL
                        );

                    timersRef.current.push(
                        nextStepTimer
                    );
                }, EVENT_INTERVAL);

            timersRef.current.push(
                resultTimer
            );
        };

        revealNextBatch();
    };

    const startSimulation = async () => {
        isRunningRef.current = false;
        runTokenRef.current += 1;
        clearTimers();

        const runToken =
            runTokenRef.current;

        isRunningRef.current = true;

        setError("");
        setLoading(true);

        try {
            const data =
                await getRumorSimulation({
                    population: 300,
                });

            if (
                !isRunningRef.current
                || runToken
                !== runTokenRef.current
            ) {
                return;
            }

            console.log(
                "Rumor Simulation:",
                data
            );

            cameraInitializedRef.current =
                false;

            lastZoomLevelRef.current =
                -1;

            /*
             * 새 시뮬레이션 결과를 즉시 저장합니다.
             * 이후 Graph Structure / Cypher 등으로 이동한 뒤
             * 다시 "/"로 돌아와도 같은 결과를 복원할 수 있습니다.
             */
            saveSimulationToSession(
                data
            );

            setSimulation(data);
            setCurrentStep(0);
            setVisibleEventCount(0);
            setActiveEventIds(new Set());
            setSpeakerIds([]);
            setSelectedCitizenId(null);
            setPhase("result");

            const timeline =
                data.timeline || [];

            const lastStep =
                timeline.length
                    ? Math.max(
                        ...timeline.map(
                            (item) =>
                                item.step
                        )
                    )
                    : 0;

            if (lastStep < 1) {
                finishSimulation(runToken);
                return;
            }

            const firstTimer =
                setTimeout(
                    () => {
                        if (
                            !isRunningRef.current
                            || runToken
                            !== runTokenRef.current
                        ) {
                            return;
                        }

                        playStep(
                            1,
                            lastStep,
                            data,
                            runToken
                        );
                    },
                    1250
                );

            timersRef.current.push(
                firstTimer
            );
        } catch (err) {
            console.error(err);

            if (
                runToken
                === runTokenRef.current
            ) {
                isRunningRef.current = false;
                setError(
                    "시뮬레이션 데이터를 불러오지 못했습니다."
                );
            }
        } finally {
            if (
                runToken
                === runTokenRef.current
            ) {
                setLoading(false);
            }
        }
    };

    const resetSimulation = () => {
        isRunningRef.current = false;
        runTokenRef.current += 1;

        clearTimers();

        cameraInitializedRef.current =
            false;

        lastZoomLevelRef.current =
            -1;

        try {
            sessionStorage.removeItem(
                LAST_SIMULATION_KEY
            );
        } catch (error) {
            console.error(
                "저장된 시뮬레이션 결과 삭제에 실패했습니다.",
                error
            );
        }

        restoredSimulationRef.current =
            null;

        setSimulation(null);
        setCurrentStep(0);
        setVisibleEventCount(0);
        setActiveEventIds(new Set());
        setSpeakerIds([]);
        setSelectedCitizenId(null);
        setPhase("ready");
        setError("");
    };

    useEffect(() => {
        return () => {
            isRunningRef.current = false;
            runTokenRef.current += 1;

            timersRef.current.forEach(
                (timer) =>
                    clearTimeout(timer)
            );

            timersRef.current = [];
        };
    }, []);

    const flowNodes =
        useMemo(() => {
            if (
                !simulation
                || phase === "ready"
            ) {
                return [];
            }

            return createFlowNodes({
                simulation,
                currentStep,
                positionMap,
                visibleEventCount,
                activeEventIds,
                speakerIds,
            });
        }, [
            simulation,
            currentStep,
            phase,
            positionMap,
            visibleEventCount,
            activeEventIds,
            speakerIds,
        ]);


    const flowEdges =
        useMemo(() => {
            if (
                !simulation
                || phase === "ready"
                || currentStep === 0
            ) {
                return [];
            }

            return createFlowEdges({
                simulation,
                currentStep,
                visibleEventCount,
                activeEventIds,
            });
        }, [
            simulation,
            currentStep,
            phase,
            visibleEventCount,
            activeEventIds,
        ]);


    const selectedCitizenDetail =
        useMemo(() => {
            if (
                !simulation
                || !selectedCitizenId
            ) {
                return null;
            }

            const peopleMap =
                createPersonMap(
                    simulation.nodes || []
                );

            const person =
                peopleMap.get(
                    selectedCitizenId
                )
                || (
                    selectedCitizenId
                    === simulation.starter.id
                        ? simulation.starter
                        : null
                );

            if (!person) {
                return null;
            }

            const primaryParentMap =
                createPrimaryParentMap(
                    simulation.spread_events || []
                );

            const receivedEvent =
                selectedCitizenId
                === simulation.starter.id
                    ? null
                    : (
                        primaryParentMap.get(
                            selectedCitizenId
                        ) || null
                    );

            const outgoingEvents =
                Array.from(
                    primaryParentMap.values()
                ).filter(
                    (event) =>
                        event.source
                        === selectedCitizenId
                );

            return {
                person,

                isStarter:
                    selectedCitizenId
                    === simulation.starter.id,

                receivedEvent,

                outgoingEvents,

                retransmitCount:
                outgoingEvents.length,

                stopped:
                    receivedEvent
                        ? (
                            receivedEvent
                                .will_retransmit
                            === false
                        )
                        : false,
            };
        }, [
            simulation,
            selectedCitizenId,
        ]);


    /*
     * =========================================================
     * AUTO CAMERA
     *
     * 발표 중 화면을 건드리지 않아도 되도록 자동 줌 유지.
     *
     * 중요한 원칙:
     * 1. 카메라 중심은 START(CITY_CENTER)에 한 번만 맞춘다.
     * 2. 이후에는 pan/fitView를 다시 하지 않는다.
     * 3. 노드 수가 커질 때 zoomTo()만 실행한다.
     *
     * 따라서 기존 fitView처럼 노드 범위를 매번 다시 계산하면서
     * 화면 중심이 튀거나 네트워크가 사라져 보이는 현상을 막는다.
     * =========================================================
     */

    const cameraInitializedRef =
        useRef(false);

    const lastZoomLevelRef =
        useRef(-1);


    /*
     * 시뮬레이션이 시작되면 START 위치를 화면 중심으로
     * 단 한 번만 맞춘다.
     */
    useEffect(() => {
        if (
            !simulation
            || !flowInstance
            || flowNodes.length === 0
            || cameraInitializedRef.current
        ) {
            return;
        }

        cameraInitializedRef.current = true;
        lastZoomLevelRef.current = 0;

        const timer =
            setTimeout(() => {
                flowInstance.setCenter(
                    CITY_CENTER.x,
                    CITY_CENTER.y,
                    {
                        zoom: 1.02,
                        duration: 0,
                    }
                );
            }, 80);

        return () =>
            clearTimeout(timer);
    }, [
        simulation,
        flowInstance,
        flowNodes.length,
    ]);


    /*
     * 이후에는 중심을 건드리지 않고
     * 노드 수에 따라 줌만 단계적으로 축소한다.
     */
    useEffect(() => {
        if (
            !simulation
            || !flowInstance
            || !cameraInitializedRef.current
            || flowNodes.length === 0
        ) {
            return;
        }

        let zoomLevel = 0;
        let targetZoom = 1.02;

        if (flowNodes.length >= 20) {
            zoomLevel = 1;
            targetZoom = 0.92;
        }

        if (flowNodes.length >= 45) {
            zoomLevel = 2;
            targetZoom = 0.82;
        }

        if (flowNodes.length >= 75) {
            zoomLevel = 3;
            targetZoom = 0.73;
        }

        if (flowNodes.length >= 110) {
            zoomLevel = 4;
            targetZoom = 0.65;
        }

        if (flowNodes.length >= 150) {
            zoomLevel = 5;
            targetZoom = 0.58;
        }

        if (flowNodes.length >= 200) {
            zoomLevel = 6;
            targetZoom = 0.52;
        }

        if (flowNodes.length >= 250) {
            zoomLevel = 7;
            targetZoom = 0.47;
        }

        /*
         * 같은 단계에서는 다시 zoomTo를 호출하지 않는다.
         */
        if (
            lastZoomLevelRef.current
            === zoomLevel
        ) {
            return;
        }

        lastZoomLevelRef.current =
            zoomLevel;

        flowInstance.zoomTo(
            targetZoom,
            {
                duration: 600,
            }
        );

    }, [
        simulation,
        flowInstance,
        flowNodes.length,
    ]);


    const goToAnalysis = () => {
        if (!simulation) {
            return;
        }

        /*
         * 새 분석 페이지에서 같은 시뮬레이션 결과를 사용한다.
         * location.state가 우선이고, 새로고침 시 sessionStorage를 fallback으로 사용.
         */
        saveSimulationToSession(
            simulation
        );

        navigate(
            "/graph-structure",
            {
                state: {
                    simulation,
                },
            }
        );
    };

    // =========================================================
    // VOICE COMMAND
    //
    // Trend City 페이지 전용 음성 명령 처리
    //
    // START_SIMULATION
    // → 시뮬레이션 시작
    //
    // RESET_SIMULATION
    // → 시뮬레이션 초기화
    //
    // PRIMARY_ACTION
    // → 현재 화면의 메인 버튼 실행
    //   simulation 없음 → START
    //   simulation 있음 → RESET
    //
    // ANALYZE_RESULT
    // → 결과 분석 페이지 이동
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
                    "[TREND CITY VOICE]",
                    type,
                    command
                );


                // =============================================
                // 현재 메인 버튼 실행
                //
                // simulation 없음
                // → START RUMOR
                //
                // simulation 있음
                // → RESET
                //
                // 예:
                //
                // 콩 → 버튼 눌러줘
                // 콩 → 저 버튼 눌러줘
                // 콩 → 메인 버튼 눌러줘
                // =============================================

                if (
                    type ===
                    "PRIMARY_ACTION"
                ) {

                    console.log(
                        "[TREND CITY PRIMARY ACTION]",
                        simulation
                            ? "RESET"
                            : "START"
                    );


                    if (
                        simulation
                    ) {

                        resetSimulation();

                    } else {

                        startSimulation();
                    }


                    return;
                }


                // =============================================
                // 시뮬레이션 시작
                //
                // 예:
                //
                // 콩 → 시작해줘
                // 콩 → 시뮬레이션 시작해줘
                // 콩 → 소문 시작해줘
                // 콩 → 실행해줘
                // =============================================

                if (
                    type ===
                    "START_SIMULATION"
                ) {

                    console.log(
                        "[TREND CITY START]"
                    );


                    startSimulation();


                    return;
                }


                // =============================================
                // 초기화
                //
                // 예:
                //
                // 콩 → 리셋해줘
                // 콩 → 리셉 버튼 눌러줘
                // 콩 → 리프 버튼 눌러줘
                // 콩 → 초기화해줘
                // =============================================

                if (
                    type ===
                    "RESET_SIMULATION"
                ) {

                    console.log(
                        "[TREND CITY RESET]"
                    );


                    resetSimulation();


                    return;
                }


                // =============================================
                // 결과 분석
                //
                // 예:
                //
                // 콩 → 결과 분석해줘
                // 콩 → 분석 페이지 보여줘
                // 콩 → 결과 보여줘
                // =============================================

                if (
                    type ===
                    "ANALYZE_RESULT"
                ) {

                    console.log(
                        "[TREND CITY ANALYZE]"
                    );


                    goToAnalysis();


                    return;
                }
            }


            window.addEventListener(
                "trend-city-voice-command",
                handleVoiceCommand
            );


            return () => {

                window.removeEventListener(
                    "trend-city-voice-command",
                    handleVoiceCommand
                );
            };

        },
        [
            simulation,
            startSimulation,
            resetSimulation,
            goToAnalysis,
        ]
    );


    const visiblePeople =
        flowNodes.length;

    const finished =
        simulation
        && currentStep === maxStep
        && phase === "result";


    return (
        <main className="trend-city flow-page">

            {/* 이전 페이지 */}
            <button
                type="button"
                className="trend-city-back-button"
                onClick={() =>
                    navigate("/trend-intro")
                }
            >
                <ArrowLeft size={16} />
                이전
            </button>


            <header className="flow-header">
                <div>
                    <p className="city-eyebrow">
                        FASHION NETWORK SIMULATION
                    </p>

                    <h1>
                        TREND CITY
                    </h1>
                </div>

                <div className="flow-legend">
                    <span>
                        <i className="legend-dot legend-spreading" />
                        전달 중
                    </span>

                    <span>
                        <i className="legend-dot legend-completed" />
                        전달 완료
                    </span>

                    <span>
                        <i className="legend-dot legend-stopped" />
                        전파 종료
                    </span>

                    <span className="legend-divider" />

                    <span>
                        <i className="channel-mark channel-word" />
                        입소문
                    </span>

                    <span>
                        <i className="channel-mark channel-sns" />
                        SNS
                    </span>

                    <span>
                        <i className="channel-mark channel-video" />
                        영상
                    </span>

                    <span>
                        <i className="channel-mark channel-community" />
                        커뮤니티
                    </span>
                </div>
            </header>

            <section className="flow-stage">
                {!simulation && (
                    <motion.div
                        className="simulation-ready-message"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span>
                            TODAY&apos;S RUMOR
                        </span>

                        <strong>
                            “소개팅에 스키니진 입고 가면
                            <br />
                            애프터 못 받는대.”
                        </strong>

                        <p>
                            START RUMOR를 눌러
                            소문의 흐름을 확인해보세요.
                        </p>
                    </motion.div>
                )}

                {simulation && (
                    <ReactFlow
                        nodes={flowNodes}
                        edges={flowEdges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onInit={setFlowInstance}

                        onNodeClick={(
                            event,
                            node
                        ) => {
                            event.stopPropagation();

                            setSelectedCitizenId(
                                node.id
                            );
                        }}

                        onPaneClick={() => {
                            setSelectedCitizenId(
                                null
                            );
                        }}


                        minZoom={0.1}
                        maxZoom={1.8}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable
                        panOnDrag
                        zoomOnScroll
                        proOptions={{
                            hideAttribution: true,
                        }}
                    >
                        <Background
                            gap={40}
                            size={1}
                            className="flow-background"
                        />
                    </ReactFlow>
                )}

                {simulation && (
                    <div className="channel-guide">
                        <span className="channel-guide-title">
                            TRANSMISSION
                        </span>

                        <span className="channel-chip channel-chip-word">
                            입소문
                        </span>

                        <span className="channel-chip channel-chip-sns">
                            SNS
                        </span>

                        <span className="channel-chip channel-chip-video">
                            영상
                        </span>

                        <span className="channel-chip channel-chip-community">
                            커뮤니티
                        </span>
                    </div>
                )}

                {simulation && (
                    <motion.div
                        className="simulation-step-info"
                        key={currentStep}
                        initial={{
                            opacity: 0,
                            y: -8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                    >
                        <span>STEP</span>
                        <strong>{currentStep}</strong>
                        <span>/</span>
                        <strong>{maxStep}</strong>

                        <i />

                        <span>현재 노출</span>
                        <strong>{visiblePeople}</strong>
                    </motion.div>
                )}

                {finished && (
                    <motion.div
                        className="simulation-finished"
                        initial={{
                            opacity: 0,
                            scale: 0.94,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                    >
                        <span>
                            RUMOR SPREAD COMPLETE
                        </span>

                        <strong>
                            {simulation.result.heard}
                            <small>
                                / {simulation.population || 300}
                            </small>
                        </strong>

                        <p>
                            도달률 {simulation.result.reach_percent}%
                        </p>

                        <button
                            type="button"
                            className="analysis-open-button"
                            onClick={goToAnalysis}
                        >
                            ANALYZE RESULT
                        </button>
                    </motion.div>
                )}
                {selectedCitizenDetail && (
                    <CitizenDetail
                        detail={
                            selectedCitizenDetail
                        }

                        onClose={() => {
                            setSelectedCitizenId(
                                null
                            );
                        }}
                    />
                )}

                {error && (
                    <div className="simulation-error">
                        {error}
                    </div>
                )}

                <div className="simulation-controls">
                    {!simulation ? (
                        <motion.button
                            className="flow-start-button inline-control"
                            onClick={startSimulation}
                            disabled={loading}
                            whileHover={
                                loading
                                    ? {}
                                    : { scale: 1.04 }
                            }
                            whileTap={
                                loading
                                    ? {}
                                    : { scale: 0.96 }
                            }
                        >
                            {loading ? (
                                <LoaderCircle
                                    size={16}
                                    className="loading-spin"
                                />
                            ) : (
                                <Play
                                    size={16}
                                    fill="currentColor"
                                />
                            )}

                            {loading
                                ? "LOADING"
                                : "START RUMOR"}
                        </motion.button>
                    ) : (
                        <motion.button
                            className="flow-start-button inline-control"
                            onClick={resetSimulation}
                            whileHover={{
                                scale: 1.04,
                            }}
                            whileTap={{
                                scale: 0.96,
                            }}
                        >
                            <RotateCcw size={15} />
                            RESET
                        </motion.button>
                    )}
                </div>
            </section>
        </main>
    );
}

export default TrendCityPage;

