import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Mic,
    Network,
    Radio,
    Route,
    Users,
} from "lucide-react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import "../styles/trendAnalysis.css";


const CHANNEL_META = {
    WORD_OF_MOUTH: {
        label: "입소문",
        className: "channel-word",
    },
    SNS: {
        label: "SNS",
        className: "channel-sns",
    },
    VIDEO: {
        label: "영상",
        className: "channel-video",
    },
    COMMUNITY: {
        label: "커뮤니티",
        className: "channel-community",
    },
};


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
            "분석 결과 저장 데이터를 읽지 못했습니다.",
            error
        );

        return null;
    }
}


function createHeardSet(simulation) {
    const heard = new Set();

    (simulation?.timeline || [])
        .forEach((item) => {
            (item.new_people || [])
                .forEach((personId) => {
                    heard.add(personId);
                });
        });

    if (simulation?.starter?.id) {
        heard.add(
            simulation.starter.id
        );
    }

    return heard;
}


function createSocialGraph(simulation) {
    const graph = new Map();

    const ensure = (personId) => {
        if (!graph.has(personId)) {
            graph.set(
                personId,
                new Set()
            );
        }

        return graph.get(personId);
    };

    (simulation?.nodes || [])
        .forEach((person) => {
            ensure(person.id);
        });

    /*
     * 백엔드에서 내려오는 실제 시민 관계망.
     * 소문 전파 경로(spread_events)가 아니라
     * 원래 연결되어 있던 social_edges를 사용한다.
     */
    (simulation?.social_edges || [])
        .forEach((edge) => {
            const source =
                edge.source
                ?? edge.from
                ?? edge.start;

            const target =
                edge.target
                ?? edge.to
                ?? edge.end;

            if (!source || !target) {
                return;
            }

            ensure(source).add(target);
            ensure(target).add(source);
        });

    return graph;
}


function createPrimarySpreadEvents(
    simulation
) {
    const eventMap = new Map();

    (simulation?.spread_events || [])
        .slice()
        .sort((a, b) => {
            const stepDiff =
                (a.step ?? 0)
                - (b.step ?? 0);

            if (stepDiff !== 0) {
                return stepDiff;
            }

            return String(a.target)
                .localeCompare(
                    String(b.target)
                );
        })
        .forEach((event) => {
            /*
             * 같은 사람이 여러 경로에서 전달 시도를 받았더라도
             * 최초 실제 도달 경로 하나만 분석 기준으로 사용.
             */
            if (
                event.target
                && !eventMap.has(
                    event.target
                )
            ) {
                eventMap.set(
                    event.target,
                    event
                );
            }
        });

    return Array.from(
        eventMap.values()
    );
}


function createUnreachedAnalysis(
    simulation
) {
    const people =
        simulation?.nodes || [];

    const heardSet =
        createHeardSet(simulation);

    const socialGraph =
        createSocialGraph(simulation);

    const unreached =
        people.filter(
            (person) =>
                !heardSet.has(person.id)
        );

    const reasons = {
        isolated: [],
        unreachedCluster: [],
        lowAffinity: [],
        stochasticBreak: [],
    };

    unreached.forEach((person) => {
        const neighbors =
            Array.from(
                socialGraph.get(person.id)
                || []
            );

        const heardNeighbors =
            neighbors.filter(
                (neighborId) =>
                    heardSet.has(neighborId)
            );

        const fashionInterest =
            Number(
                person.fashion_interest
                ?? 0.5
            );

        const activity =
            Number(
                person.activity
                ?? 0.5
            );

        if (neighbors.length <= 1) {
            reasons.isolated.push(person);
            return;
        }

        if (heardNeighbors.length === 0) {
            reasons.unreachedCluster.push(
                person
            );
            return;
        }

        if (
            fashionInterest < 0.35
            || activity < 0.30
        ) {
            reasons.lowAffinity.push(person);
            return;
        }

        reasons.stochasticBreak.push(person);
    });

    return {
        unreached,
        reasons,
    };
}


function createSpreaderAnalysis(
    simulation
) {
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
        createPrimarySpreadEvents(
            simulation
        );

    const childrenMap =
        new Map();

    const directCounts =
        new Map();

    events.forEach((event) => {
        if (
            !event.source
            || !event.target
        ) {
            return;
        }

        if (
            !childrenMap.has(
                event.source
            )
        ) {
            childrenMap.set(
                event.source,
                []
            );
        }

        childrenMap
            .get(event.source)
            .push(event.target);

        directCounts.set(
            event.source,
            (
                directCounts.get(
                    event.source
                )
                || 0
            ) + 1
        );
    });

    const countDescendants = (
        personId
    ) => {
        const visited =
            new Set();

        const stack = [
            ...(
                childrenMap.get(personId)
                || []
            ),
        ];

        while (stack.length) {
            const current =
                stack.pop();

            if (
                !current
                || visited.has(current)
            ) {
                continue;
            }

            visited.add(current);

            (
                childrenMap.get(current)
                || []
            ).forEach(
                (childId) => {
                    stack.push(childId);
                }
            );
        }

        return visited.size;
    };

    return Array.from(
        directCounts.entries()
    )
        .map(
            ([
                 personId,
                 directCount,
             ]) => {
                const person =
                    peopleMap.get(
                        personId
                    )
                    || {
                        id: personId,
                        name: personId,
                    };

                const downstreamCount =
                    countDescendants(
                        personId
                    );

                return {
                    ...person,
                    directCount,
                    downstreamCount,

                    /*
                     * 직접 전달을 더 중요하게 보고,
                     * 이후 연결된 하위 확산도 함께 반영.
                     */
                    score:
                        directCount * 3
                        + downstreamCount,
                };
            }
        )
        .sort(
            (a, b) =>
                b.score - a.score
                || b.directCount
                - a.directCount
        )
        .slice(0, 5);
}


function createChannelAnalysis(
    simulation
) {
    const events =
        createPrimarySpreadEvents(
            simulation
        );

    const counts = {
        WORD_OF_MOUTH: 0,
        SNS: 0,
        VIDEO: 0,
        COMMUNITY: 0,
    };

    events.forEach((event) => {
        const channel =
            event.channel
            || "WORD_OF_MOUTH";

        if (
            counts[channel]
            === undefined
        ) {
            counts[channel] = 0;
        }

        counts[channel] += 1;
    });

    const total =
        Object.values(counts)
            .reduce(
                (sum, value) =>
                    sum + value,
                0
            );

    return Object.entries(counts)
        .map(
            ([channel, count]) => {
                const meta =
                    CHANNEL_META[channel]
                    || {
                        label: channel,
                        className: "",
                    };

                return {
                    channel,
                    count,
                    label:
                    meta.label,
                    className:
                    meta.className,
                    percent:
                        total
                            ? Number(
                                (
                                    count
                                    / total
                                    * 100
                                ).toFixed(1)
                            )
                            : 0,
                };
            }
        )
        .sort(
            (a, b) =>
                b.count - a.count
        );
}


function percent(value) {
    return `${Math.round(
        Number(value || 0) * 100
    )}%`;
}


function TrendAnalysisPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const simulation =
        location.state?.simulation
        || getSimulationFromStorage();

    const [analysisStep, setAnalysisStep] =
        useState(0);

    const analysis =
        useMemo(() => {
            if (!simulation) {
                return null;
            }

            return {
                unreached:
                    createUnreachedAnalysis(
                        simulation
                    ),
                spreaders:
                    createSpreaderAnalysis(
                        simulation
                    ),
                channels:
                    createChannelAnalysis(
                        simulation
                    ),
            };
        }, [simulation]);

    /*
     * 발표용 음성 명령.
     * 브라우저 Web Speech API를 사용해 화면 전환만 담당한다.
     * 인식 실패 시에도 페이지 자체는 정상 동작한다.
     */
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition
            || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return undefined;
        }

        const recognition =
            new SpeechRecognition();

        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = false;

        let stopped = false;

        const moveBySpeech = (text) => {
            const command =
                String(text || "")
                    .replace(/\s+/g, "");

            if (
                command.includes("핵심확산")
                || command.includes("가장많이확산")
                || command.includes("누가가장많이")
                || command.includes("확산자")
            ) {
                setAnalysisStep(0);
                return;
            }

            if (
                command.includes("확산되지않")
                || command.includes("미도달")
                || command.includes("못들은")
                || command.includes("도달하지않")
            ) {
                setAnalysisStep(1);
                return;
            }

            if (
                command.includes("채널")
                || command.includes("전달방식")
                || command.includes("어떤방식")
                || command.includes("어떻게퍼")
            ) {
                setAnalysisStep(2);
                return;
            }

            if (
                command.includes("그래프DB")
                || command.includes("그래프디비")
                || command.includes("왜그래프")
                || command.includes("결론")
            ) {
                setAnalysisStep(3);
                return;
            }

            if (
                command.includes("다음")
                || command.includes("넘어가")
            ) {
                setAnalysisStep(
                    (step) =>
                        Math.min(step + 1, 3)
                );
                return;
            }

            if (
                command.includes("이전")
                || command.includes("뒤로")
            ) {
                setAnalysisStep(
                    (step) =>
                        Math.max(step - 1, 0)
                );
            }
        };

        recognition.onresult = (event) => {
            const last =
                event.results[
                event.results.length - 1
                    ];

            if (!last?.isFinal) {
                return;
            }

            moveBySpeech(
                last[0]?.transcript
            );
        };

        recognition.onend = () => {
            if (stopped) {
                return;
            }

            try {
                recognition.start();
            } catch {
                // 이미 시작 중이면 무시
            }
        };

        try {
            recognition.start();
        } catch {
            // 권한/중복 시작 오류는 화면 렌더링을 막지 않음
        }

        return () => {
            stopped = true;

            try {
                recognition.stop();
            } catch {
                // 종료 중 오류 무시
            }
        };
    }, []);

    if (
        !simulation
        || !analysis
    ) {
        return (
            <main className="voice-analysis-page">
                <section className="voice-empty">
                    <span>
                        RUMOR ANALYSIS
                    </span>

                    <h1>
                        분석할 시뮬레이션 결과가 없습니다.
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

    const result =
        simulation.result || {};

    const unreached =
        analysis.unreached;

    const reasons = [
        {
            key: "isolated",
            title: "연결 자체가 적음",
            description:
                "사회적 연결이 0~1개인 시민",
            count:
            unreached.reasons
                .isolated.length,
        },
        {
            key: "unreachedCluster",
            title: "주변 집단도 미도달",
            description:
                "연결된 이웃 누구도 소문을 듣지 못한 경우",
            count:
            unreached.reasons
                .unreachedCluster.length,
        },
        {
            key: "lowAffinity",
            title: "관심·활동성이 낮음",
            description:
                "패션 관심도 또는 활동성이 낮은 연결 구간",
            count:
            unreached.reasons
                .lowAffinity.length,
        },
        {
            key: "stochasticBreak",
            title: "확률적 경로 단절",
            description:
                "도달한 이웃은 있었지만 전달이 이어지지 않은 경우",
            count:
            unreached.reasons
                .stochasticBreak.length,
        },
    ].sort(
        (a, b) =>
            b.count - a.count
    );

    const topSpreader =
        analysis.spreaders[0];

    const topChannel =
        analysis.channels[0];

    const population =
        simulation.population || 300;

    const heard =
        result.heard
        ?? createHeardSet(simulation).size;

    const notHeard =
        result.not_heard
        ?? unreached.unreached.length;

    const reachPercent =
        result.reach_percent
        ?? (
            population
                ? (
                    heard
                    / population
                    * 100
                ).toFixed(1)
                : 0
        );

    const maxSpreaderScore =
        Math.max(
            ...analysis.spreaders.map(
                (person) =>
                    person.downstreamCount
            ),
            1
        );

    const pages = [
        {
            eyebrow: "KEY SPREADER",
            question:
                "누가 가장 많이 확산시켰을까?",
            command:
                "“누가 가장 많이 확산시켰는지 보여줘”",
        },
        {
            eyebrow: "WHY NOT REACHED?",
            question:
                "왜 모두에게 도달하지 않았을까?",
            command:
                "“확산되지 않은 사람들 보여줘”",
        },
        {
            eyebrow: "CHANNEL IMPACT",
            question:
                "어떤 전달 방식이 확산을 주도했을까?",
            command:
                "“어떤 방식으로 가장 많이 퍼졌어?”",
        },
        {
            eyebrow: "WHY GRAPH DB?",
            question:
                "그래서 왜 GraphDB일까?",
            command:
                "“왜 GraphDB인지 보여줘”",
        },
    ];

    const currentPage =
        pages[analysisStep];

    return (
        <main className="voice-analysis-page">
            <header className="voice-analysis-header">
                <div className="voice-brand">
                    <span>
                        FASHION NETWORK SIMULATION
                    </span>
                    <strong>
                        TREND CITY
                    </strong>
                </div>

                <div className="voice-listening">
                    <i />
                    <Mic size={15} />
                    VOICE CONTROL
                </div>

                <button
                    type="button"
                    className="voice-back"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    <ArrowLeft size={16} />
                    SIMULATION
                </button>
            </header>

            <section
                className="analysis-stage"
                key={analysisStep}
            >
                <div className="stage-heading">
                    <div>
                        <p className="stage-eyebrow">
                            0{analysisStep + 1}
                            {" / "}
                            04
                            <span>
                                {currentPage.eyebrow}
                            </span>
                        </p>

                        <h1>
                            {currentPage.question}
                        </h1>
                    </div>

                    <div className="heard-summary">
                        <span>
                            SIMULATION RESULT
                        </span>
                        <strong>
                            {heard}
                            <small>
                                / {population}
                            </small>
                        </strong>
                        <em>
                            도달률 {reachPercent}%
                        </em>
                    </div>
                </div>

                {analysisStep === 0 && (
                    <section className="spreader-stage">
                        <div className="hero-spreader">
                            <div className="hero-spreader-icon">
                                <Network size={30} />
                            </div>

                            <span>
                                MOST INFLUENTIAL
                            </span>

                            <h2>
                                {topSpreader?.name || "-"}
                            </h2>

                            <p>
                                직접 전달
                                <strong>
                                    {topSpreader?.directCount || 0}명
                                </strong>
                                을 시작으로
                                <strong>
                                    {topSpreader?.downstreamCount || 0}명
                                </strong>
                                의 후속 확산 경로에 연결
                            </p>

                            <div className="hero-insight">
                                <Route size={19} />
                                <span>
                                    많이 말한 사람보다
                                    <b>
                                        {" "}많은 확산 경로를 만든 사람
                                    </b>
                                    이 핵심입니다.
                                </span>
                            </div>
                        </div>

                        <div className="ranking-visual">
                            <div className="visual-label">
                                확산 영향력 TOP 5
                                <span>
                                    하위 도달 기준
                                </span>
                            </div>

                            {analysis.spreaders.map(
                                (person, index) => {
                                    const width =
                                        Math.max(
                                            8,
                                            person.downstreamCount
                                            / maxSpreaderScore
                                            * 100
                                        );

                                    return (
                                        <div
                                            className="ranking-bar-row"
                                            key={person.id}
                                        >
                                            <span className="rank-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>

                                            <div className="rank-person">
                                                <strong>
                                                    {person.name}
                                                </strong>
                                                <span>
                                                    직접 {person.directCount}명
                                                </span>
                                            </div>

                                            <div className="rank-track">
                                                <i
                                                    style={{
                                                        width:
                                                            `${width}%`,
                                                    }}
                                                />
                                            </div>

                                            <strong className="rank-value">
                                                {person.downstreamCount}
                                                <small>명</small>
                                            </strong>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </section>
                )}

                {analysisStep === 1 && (
                    <section className="unreached-stage">
                        <div className="unreached-hero">
                            <span>
                                NOT REACHED
                            </span>

                            <strong>
                                {notHeard}
                                <small>명</small>
                            </strong>

                            <p>
                                전체 {population}명 중
                                <b>
                                    {" "}{notHeard}명
                                </b>
                                은 최종 확산 경로에 포함되지 않았습니다.
                            </p>

                            <div className="unreached-dots">
                                {unreached.unreached
                                    .slice(0, 18)
                                    .map(
                                        (person) => (
                                            <i
                                                key={person.id}
                                                title={person.name}
                                            >
                                                {String(
                                                        person.name
                                                        || "•"
                                                    )
                                                        .replace(
                                                            /[^0-9]/g,
                                                            ""
                                                        )
                                                        .slice(-2)
                                                    || "•"}
                                            </i>
                                        )
                                    )}
                            </div>
                        </div>

                        <div className="reason-visual">
                            <div className="visual-label">
                                미도달 원인 분석
                                <span>연결망 + 시민 속성 기준 추정</span>
                            </div>

                            {reasons.map((reason, index) => {
                                const ratio =
                                    notHeard > 0
                                        ? (reason.count / notHeard) * 100
                                        : 0;

                                return (
                                    <article
                                        key={reason.key}
                                        className={`reason-card ${
                                            index === 0 ? "dominant" : ""
                                        }`}
                                    >
                                        <div className="reason-info">
                    <span>
                        {String(index + 1).padStart(2, "0")}
                    </span>

                                            <strong>
                                                {reason.title}
                                            </strong>

                                            <p>
                                                {reason.description}
                                            </p>
                                        </div>

                                        <div className="reason-big-value">
                                            <strong>
                                                {reason.count}
                                                <small>명</small>
                                            </strong>

                                            <span>
                        {ratio.toFixed(1)}%
                    </span>
                                        </div>

                                        <div className="reason-progress">
                                            <i
                                                style={{
                                                    width: `${Math.min(
                                                        Math.max(ratio, 0),
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </article>
                                );
                            })}

                            <p className="estimate-note">
                                ※ 원인 라벨은 시뮬레이션의 실제 연결 관계와
                                시민 속성을 이용한 추정 분류입니다.
                            </p>
                        </div>
                    </section>
                )}

                {analysisStep === 2 && (
                    <section className="channel-stage">
                        <div className="channel-winner">
                            <div className="channel-winner-icon">
                                <Radio size={28} />
                            </div>

                            <span>
                                #1 TRANSMISSION CHANNEL
                            </span>

                            <h2>
                                {topChannel?.label || "-"}
                            </h2>

                            <strong>
                                {topChannel?.percent || 0}
                                <small>%</small>
                            </strong>

                            <p>
                                최초 도달 경로를 기준으로
                                가장 많은 전파를 만든 채널입니다.
                            </p>
                        </div>

                        <div className="channel-bars-large">
                            {analysis.channels.map(
                                (item, index) => (
                                    <div
                                        className={
                                            index === 0
                                                ? "channel-large-row winner"
                                                : "channel-large-row"
                                        }
                                        key={item.channel}
                                    >
                                        <div className="channel-large-label">
                                            <span>
                                                0{index + 1}
                                            </span>
                                            <strong>
                                                {item.label}
                                            </strong>
                                        </div>

                                        <div className="channel-large-track">
                                            <i
                                                className={
                                                    item.className
                                                }
                                                style={{
                                                    width:
                                                        `${item.percent}%`,
                                                }}
                                            />
                                        </div>

                                        <strong className="channel-large-percent">
                                            {item.percent}%
                                        </strong>

                                        <span className="channel-large-count">
                                            {item.count}건
                                        </span>
                                    </div>
                                )
                            )}

                            <div className="channel-insight">
                                <span>
                                    채널마다 전달 확률이 달라지면
                                <b>
                                    {" "}같은 네트워크에서도 확산 결과가 달라집니다.
                                </b>
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                {analysisStep === 3 && (
                    <section className="graph-stage">
                        <div className="graph-message">
                            <span>
                                RELATIONSHIP MATTERS
                            </span>

                            <h2>
                                확산의 핵심은
                                <b> ‘관계’</b>에 있었습니다.
                            </h2>

                            <p>
                                이번 시뮬레이션에서 중요한 것은
                                단순한 도달 인원이 아니라
                                <strong>
                                    누가 → 누구를 → 어떤 방식으로
                                </strong>
                                연결했는지입니다.
                            </p>
                        </div>

                        <div className="graph-comparison">
                            <article className="compare-card muted">
                                <span>
                                    TABLE / AGGREGATION
                                </span>
                                <h3>
                                    몇 명에게 퍼졌는가?
                                </h3>
                                <strong>
                                    {heard}명
                                </strong>
                                <p>
                                    결과 집계에는 충분합니다.
                                </p>
                            </article>

                            <div className="compare-arrow">
                                <ChevronRight size={28} />
                            </div>

                            <article className="compare-card graph">
                                <span>
                                    GRAPH / RELATIONSHIP
                                </span>
                                <h3>
                                    어떻게 퍼졌는가?
                                </h3>

                                <div className="mini-network">
                                    <i>A</i>
                                    <b>→</b>
                                    <i>B</i>
                                    <b>→</b>
                                    <i>C</i>
                                    <b>→</b>
                                    <i>D</i>
                                </div>

                                <p>
                                    확산자 · 경로 · 단절 지점을
                                    관계를 따라 분석합니다.
                                </p>
                            </article>
                        </div>

                        <div className="final-statement">
                            <Route size={24} />
                            <p>
                                <span>
                                    TREND FLOW
                                </span>
                                관계를 이해하면,
                                <b>
                                    {" "}유행이 시작되는 지점과
                                    확산되는 흐름
                                </b>
                                을 발견할 수 있습니다.
                            </p>
                        </div>
                    </section>
                )}

                <footer className="voice-stage-footer">
                    <div className="voice-command">
                        <Mic size={15} />
                        <span>
                            VOICE COMMAND
                        </span>
                        <strong>
                            {currentPage.command}
                        </strong>
                    </div>

                    <div className="stage-progress">
                        {pages.map(
                            (_, index) => (
                                <i
                                    key={index}
                                    className={
                                        index === analysisStep
                                            ? "active"
                                            : ""
                                    }
                                />
                            )
                        )}
                    </div>

                    <div className="keyboard-fallback">
                        <button
                            type="button"
                            aria-label="이전 분석"
                            disabled={
                                analysisStep === 0
                            }
                            onClick={() =>
                                setAnalysisStep(
                                    (step) =>
                                        Math.max(
                                            step - 1,
                                            0
                                        )
                                )
                            }
                        >
                            <ChevronLeft size={17} />
                        </button>

                        <span>
                            {analysisStep + 1} / 4
                        </span>

                        <button
                            type="button"
                            aria-label="다음 분석"
                            disabled={
                                analysisStep === 3
                            }
                            onClick={() =>
                                setAnalysisStep(
                                    (step) =>
                                        Math.min(
                                            step + 1,
                                            3
                                        )
                                )
                            }
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>
                </footer>
            </section>
        </main>
    );
}


export default TrendAnalysisPage;