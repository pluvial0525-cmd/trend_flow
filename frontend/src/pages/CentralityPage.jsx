import {
    useEffect,
    useMemo,
    useState,
} from "react";import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CircleDot,
    GitBranch,
    Mic,
    Network,
    Share2,
    Users,
} from "lucide-react";

const PEOPLE = [
    {
        id: 1,
        name: "시민 72",
        emoji: "👩🏻",
        x: 11,
        y: 47,
        community: "A",
    },
    {
        id: 2,
        name: "시민 115",
        emoji: "👨🏿",
        x: 25,
        y: 29,
        community: "A",
    },
    {
        id: 3,
        name: "시민 183",
        emoji: "👨🏻",
        x: 27,
        y: 66,
        community: "A",
    },
    {
        id: 4,
        name: "시민 50",
        emoji: "👱🏻",
        x: 40,
        y: 19,
        community: "A",
    },
    {
        id: 5,
        name: "시민 74",
        emoji: "👩🏽",
        x: 49,
        y: 48,
        community: "BRIDGE",
    },
    {
        id: 6,
        name: "시민 188",
        emoji: "👵🏻",
        x: 64,
        y: 25,
        community: "B",
    },
    {
        id: 7,
        name: "시민 139",
        emoji: "👨🏿",
        x: 67,
        y: 66,
        community: "B",
    },
    {
        id: 8,
        name: "시민 204",
        emoji: "👱🏻‍♀️",
        x: 80,
        y: 42,
        community: "B",
    },
    {
        id: 9,
        name: "시민 91",
        emoji: "👨🏻",
        x: 84,
        y: 70,
        community: "B",
    },
    {
        id: 10,
        name: "시민 217",
        emoji: "👩🏻",
        x: 49,
        y: 79,
        community: "C",
    },
    {
        id: 11,
        name: "시민 132",
        emoji: "👨🏼",
        x: 37,
        y: 86,
        community: "C",
    },
    {
        id: 12,
        name: "시민 156",
        emoji: "👩🏾",
        x: 61,
        y: 88,
        community: "C",
    },
];

const LINKS = [
    // COMMUNITY A
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 3],
    [2, 4],
    [2, 5],
    [3, 4],
    [3, 5],
    [4, 5],

    // BRIDGE
    [5, 6],
    [5, 7],
    [5, 10],

    // COMMUNITY B
    [6, 7],
    [6, 8],
    [6, 9],
    [7, 8],
    [7, 9],
    [8, 9],

    // COMMUNITY C
    [10, 11],
    [10, 12],
    [11, 12],
];

const MODES = {
    degree: {
        english: "DEGREE",
        korean: "직접 연결이 많은 사람",
        short: "직접 연결 수",
        description:
            "한 사람에게 직접 연결된 Relationship이 몇 개인지 셉니다.",
        icon: Share2,
    },

    betweenness: {
        english: "BETWEENNESS",
        korean: "다른 집단으로 넘어가는 연결자",
        short: "집단 사이의 다리",
        description:
            "서로 다른 집단으로 이동하는 경로에 자주 등장하는 Node를 찾습니다.",
        icon: GitBranch,
    },

    community: {
        english: "COMMUNITY",
        korean: "서로 촘촘하게 연결된 집단",
        short: "관계가 밀집된 집단",
        description:
            "집단 내부 연결은 많고, 집단 밖 연결은 상대적으로 적은 구조를 찾습니다.",
        icon: Users,
    },
};

const COMMUNITY_INFO = {
    A: {
        title: "COMMUNITY A",
        subtitle: "내부 연결이 많은 집단",
        internalLinks: 6,
    },

    B: {
        title: "COMMUNITY B",
        subtitle: "내부 연결이 많은 집단",
        internalLinks: 6,
    },

    C: {
        title: "COMMUNITY C",
        subtitle: "소규모 밀집 집단",
        internalLinks: 3,
    },
};

function CentralityPage() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("degree");

    // =========================================================
// VOICE COMMAND
// =========================================================

    useEffect(
        () => {

            function handleVoiceCommand(
                event
            ) {

                const {
                    type,
                    command,
                } =
                event.detail || {};


                console.log(
                    "[CENTRALITY VOICE]",
                    type,
                    command
                );


                // =============================================
                // DEGREE
                // =============================================

                if (
                    type === "SHOW_DEGREE"
                ) {

                    console.log(
                        "[CENTRALITY MODE]",
                        "DEGREE"
                    );


                    setMode(
                        "degree"
                    );


                    return;
                }


                // =============================================
                // BETWEENNESS
                // =============================================

                if (
                    type === "SHOW_BETWEENNESS"
                ) {

                    console.log(
                        "[CENTRALITY MODE]",
                        "BETWEENNESS"
                    );


                    setMode(
                        "betweenness"
                    );


                    return;
                }


                // =============================================
                // COMMUNITY
                // =============================================

                if (
                    type === "SHOW_COMMUNITY"
                ) {

                    console.log(
                        "[CENTRALITY MODE]",
                        "COMMUNITY"
                    );


                    setMode(
                        "community"
                    );
                }
            }


            window.addEventListener(
                "centrality-voice-command",
                handleVoiceCommand
            );


            return () => {

                window.removeEventListener(
                    "centrality-voice-command",
                    handleVoiceCommand
                );
            };

        },
        []
    );

    const degreeMap = useMemo(() => {
        const result = {};

        PEOPLE.forEach((person) => {
            result[person.id] = 0;
        });

        LINKS.forEach(([a, b]) => {
            result[a] += 1;
            result[b] += 1;
        });

        return result;
    }, []);

    const maxDegree = Math.max(
        ...Object.values(degreeMap)
    );

    const selectedMode = MODES[mode];

    const getPerson = (id) =>
        PEOPLE.find(
            (person) =>
                person.id === id
        );

    const getCommunityClass = (
        person
    ) => {
        if (
            person.community === "A"
        ) {
            return "community-a";
        }

        if (
            person.community === "B"
        ) {
            return "community-b";
        }

        if (
            person.community === "C"
        ) {
            return "community-c";
        }

        return "community-bridge";
    };

    const isBridgeLink = (
        a,
        b
    ) => {
        const bridgeLinks = [
            [1, 5],
            [5, 6],
            [5, 10],
        ];

        return bridgeLinks.some(
            ([x, y]) =>
                (
                    x === a
                    && y === b
                )
                ||
                (
                    x === b
                    && y === a
                )
        );
    };

    const getLinkClass = (
        a,
        b
    ) => {
        const p1 =
            getPerson(a);

        const p2 =
            getPerson(b);

        if (
            mode === "degree"
        ) {
            if (
                a === 5
                || b === 5
            ) {
                return (
                    "network-line "
                    + "degree-highlight"
                );
            }

            return (
                "network-line "
                + "degree-dim"
            );
        }

        if (
            mode === "betweenness"
        ) {
            if (
                isBridgeLink(a, b)
            ) {
                return (
                    "network-line "
                    + "bridge-highlight"
                );
            }

            if (
                p1.community
                === p2.community
                &&
                p1.community
                !== "BRIDGE"
            ) {
                return (
                    "network-line "
                    + "group-context"
                );
            }

            return (
                "network-line "
                + "bridge-dim"
            );
        }

        if (
            p1.community === "A"
            &&
            p2.community === "A"
        ) {
            return (
                "network-line "
                + "community-line-a"
            );
        }

        if (
            p1.community === "B"
            &&
            p2.community === "B"
        ) {
            return (
                "network-line "
                + "community-line-b"
            );
        }

        if (
            p1.community === "C"
            &&
            p2.community === "C"
        ) {
            return (
                "network-line "
                + "community-line-c"
            );
        }

        if (
            p1.community
            === "BRIDGE"
            ||
            p2.community
            === "BRIDGE"
        ) {
            return (
                "network-line "
                + "community-cross"
            );
        }

        return "network-line";
    };

    const getNodeState = (
        person
    ) => {
        if (
            mode === "degree"
        ) {
            if (
                degreeMap[
                    person.id
                    ]
                === maxDegree
            ) {
                return "highlight";
            }

            return "";
        }

        if (
            mode
            === "betweenness"
        ) {
            if (
                person.id === 5
            ) {
                return (
                    "highlight "
                    + "bridge-person"
                );
            }

            return (
                "betweenness-context"
            );
        }

        return "";
    };

    return (
        <div className="centrality-page">

            <style>{`
                * {
                    box-sizing:
                        border-box;
                }

                body {
                    margin: 0;
                    background:
                        #080a12;
                }

                button {
                    font-family:
                        inherit;
                }

                .centrality-page {
                    min-height:
                        100vh;

                    background:
                        radial-gradient(
                            circle at
                            20% 10%,
                            rgba(
                                112,
                                72,
                                255,
                                .08
                            ),
                            transparent
                            28%
                        ),
                        #080a12;

                    color:
                        #f7f5ff;

                    font-family:
                        Pretendard,
                        "Noto Sans KR",
                        Arial,
                        sans-serif;

                    padding:
                        18px
                        22px
                        24px;
                }

                /* =========================
                   TOP
                ========================= */

                .topbar {
                    height:
                        48px;

                    display:
                        flex;

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

                    margin-bottom:
                        8px;
                }

                .brand-small {
                    color:
                        #a57aff;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    letter-spacing:
                        2.2px;
                }

                .brand-title {
                    margin-top:
                        3px;

                    font-size:
                        20px;

                    font-weight:
                        900;

                    letter-spacing:
                        -1px;
                }

                .voice-chip {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        8px;

                    border:
                        1px solid
                        rgba(
                            158,
                            104,
                            255,
                            .28
                        );

                    background:
                        rgba(
                            105,
                            65,
                            190,
                            .09
                        );

                    border-radius:
                        999px;

                    color:
                        #c4a5ff;

                    padding:
                        8px
                        15px;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    letter-spacing:
                        .7px;
                }

                .back-button {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        8px;

                    padding:
                        9px
                        16px;

                    border-radius:
                        999px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .12
                        );

                    background:
                        transparent;

                    color:
                        #f3f1fa;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    cursor:
                        pointer;
                }

                /* =========================
                   SLIDE
                ========================= */

                .slide {
                    min-height:
                        calc(
                            100vh
                            - 96px
                        );

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .10
                        );

                    border-radius:
                        26px;

                    padding:
                        25px
                        30px
                        20px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    overflow:
                        hidden;
                }

                .section-label {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        12px;

                    margin-bottom:
                        5px;

                    color:
                        #696979;

                    font-size:
                        12px;

                    font-weight:
                        900;

                    letter-spacing:
                        2px;
                }

                .section-number {
                    color:
                        #a66cff;
                }

                .page-title {
                    margin:
                        0;

                    max-width:
                        950px;

                    font-size:
                        clamp(
                            42px,
                            3.25vw,
                            62px
                        );

                    line-height:
                        .98;

                    letter-spacing:
                        -3px;

                    font-weight:
                        900;
                }

                .page-title
                .accent {
                    color:
                        #b276ff;
                }

                .page-description {
                    margin-top:
                        12px;

                    color:
                        #7e8192;

                    font-size:
                        14px;
                }

                /* =========================
                   CONTENT
                ========================= */

                .content-grid {
                    flex:
                        1;

                    display:
                        grid;

                    grid-template-columns:
                        minmax(
                            0,
                            1.65fr
                        )
                        minmax(
                            430px,
                            .95fr
                        );

                    gap:
                        20px;

                    margin-top:
                        20px;

                    min-height:
                        0;
                }

                .panel {
                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .10
                        );

                    border-radius:
                        22px;

                    background:
                        rgba(
                            13,
                            15,
                            24,
                            .72
                        );

                    min-height:
                        0;
                }

                .graph-panel {
                    padding:
                        22px;

                    display:
                        flex;

                    flex-direction:
                        column;
                }

                .panel-heading {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        14px;
                }

                .heading-icon {
                    width:
                        45px;

                    height:
                        45px;

                    border-radius:
                        13px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    color:
                        #b278ff;

                    background:
                        rgba(
                            116,
                            72,
                            211,
                            .11
                        );

                    border:
                        1px solid
                        rgba(
                            154,
                            96,
                            255,
                            .22
                        );
                }

                .panel-heading h2 {
                    margin:
                        0;

                    font-size:
                        23px;

                    letter-spacing:
                        -.6px;
                }

                .panel-heading p {
                    margin:
                        4px
                        0
                        0;

                    color:
                        #6f7283;

                    font-size:
                        12px;
                }

                /* =========================
                   MODE
                ========================= */

                .mode-selector {
                    display:
                        flex;

                    gap:
                        9px;

                    margin-top:
                        18px;
                }

                .mode-button {
                    flex:
                        1;

                    min-height:
                        58px;

                    border-radius:
                        13px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .09
                        );

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            .015
                        );

                    color:
                        #777a89;

                    cursor:
                        pointer;

                    text-align:
                        left;

                    padding:
                        10px
                        14px;

                    transition:
                        .2s;
                }

                .mode-button strong {
                    display:
                        block;

                    color:
                        inherit;

                    font-size:
                        14px;

                    letter-spacing:
                        .8px;
                }

                .mode-button span {
                    display:
                        block;

                    margin-top:
                        3px;

                    font-size:
                        11px;
                }

                .mode-button.active {
                    color:
                        #d2b5ff;

                    border-color:
                        rgba(
                            176,
                            111,
                            255,
                            .55
                        );

                    background:
                        rgba(
                            122,
                            73,
                            218,
                            .10
                        );

                    box-shadow:
                        inset
                        3px
                        0
                        #9f62ff;
                }

                /* =========================
                   NETWORK
                ========================= */

                .network-area {
                    position:
                        relative;

                    flex:
                        1;

                    min-height:
                        360px;

                    margin-top:
                        12px;

                    border-radius:
                        17px;

                    overflow:
                        hidden;

                    background:
                        radial-gradient(
                            circle,
                            rgba(
                                131,
                                91,
                                207,
                                .12
                            )
                            1px,
                            transparent
                            1px
                        );

                    background-size:
                        24px
                        24px;
                }

                .network-svg {
                    position:
                        absolute;

                    inset:
                        0;

                    width:
                        100%;

                    height:
                        100%;

                    pointer-events:
                        none;

                    z-index:
                        2;
                }

                .network-line {
                    stroke:
                        rgba(
                            154,
                            135,
                            195,
                            .38
                        );

                    stroke-width:
                        1.5;

                    transition:
                        all
                        .25s ease;
                }

                /* DEGREE */

                .degree-highlight {
                    stroke:
                        #aa6cff;

                    stroke-width:
                        3.2;

                    filter:
                        drop-shadow(
                            0
                            0
                            5px
                            rgba(
                                170,
                                108,
                                255,
                                .65
                            )
                        );
                }

                .degree-dim {
                    stroke:
                        rgba(
                            138,
                            123,
                            172,
                            .28
                        );

                    stroke-width:
                        1.2;
                }

                /* BETWEENNESS */

                .bridge-highlight {
                    stroke:
                        #ffd35c;

                    stroke-width:
                        3.8;

                    filter:
                        drop-shadow(
                            0
                            0
                            7px
                            rgba(
                                255,
                                211,
                                92,
                                .55
                            )
                        );
                }

                .group-context {
                    stroke:
                        rgba(
                            174,
                            157,
                            210,
                            .48
                        );

                    stroke-width:
                        1.8;
                }

                .bridge-dim {
                    stroke:
                        rgba(
                            116,
                            108,
                            142,
                            .20
                        );

                    stroke-width:
                        1.1;
                }

                /* COMMUNITY */

                .community-line-a {
                    stroke:
                        rgba(
                            91,
                            142,
                            255,
                            .95
                        );

                    stroke-width:
                        2.6;
                }

                .community-line-b {
                    stroke:
                        rgba(
                            190,
                            111,
                            255,
                            .95
                        );

                    stroke-width:
                        2.6;
                }

                .community-line-c {
                    stroke:
                        rgba(
                            65,
                            215,
                            178,
                            .95
                        );

                    stroke-width:
                        2.6;
                }

                .community-cross {
                    stroke:
                        rgba(
                            255,
                            211,
                            92,
                            .72
                        );

                    stroke-width:
                        1.8;

                    stroke-dasharray:
                        2.2
                        1.3;
                }

                /* =========================
                   COMMUNITY AREA
                ========================= */

                .community-zone {
                    position:
                        absolute;

                    border-radius:
                        50%;

                    pointer-events:
                        none;

                    opacity:
                        0;

                    transition:
                        .25s;

                    z-index:
                        1;
                }

                .community-mode
                .community-zone,
                .betweenness-mode
                .community-zone {
                    opacity:
                        1;
                }

                .zone-a {
                    left:
                        4%;

                    top:
                        10%;

                    width:
                        40%;

                    height:
                        65%;

                    background:
                        radial-gradient(
                            circle,
                            rgba(
                                76,
                                132,
                                255,
                                .12
                            ),
                            transparent
                            70%
                        );

                    border:
                        1.5px
                        dashed
                        rgba(
                            91,
                            142,
                            255,
                            .55
                        );
                }

                .zone-b {
                    right:
                        4%;

                    top:
                        9%;

                    width:
                        40%;

                    height:
                        64%;

                    background:
                        radial-gradient(
                            circle,
                            rgba(
                                188,
                                92,
                                255,
                                .11
                            ),
                            transparent
                            70%
                        );

                    border:
                        1.5px
                        dashed
                        rgba(
                            185,
                            99,
                            255,
                            .55
                        );
                }

                .zone-c {
                    left:
                        31%;

                    bottom:
                        0;

                    width:
                        38%;

                    height:
                        34%;

                    background:
                        radial-gradient(
                            circle,
                            rgba(
                                57,
                                210,
                                176,
                                .11
                            ),
                            transparent
                            70%
                        );

                    border:
                        1.5px
                        dashed
                        rgba(
                            57,
                            210,
                            176,
                            .55
                        );
                }

                .community-label {
                    position:
                        absolute;

                    z-index:
                        6;

                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        3px;

                    opacity:
                        0;

                    pointer-events:
                        none;
                }

                .community-mode
                .community-label,
                .betweenness-mode
                .community-label {
                    opacity:
                        1;
                }

                .community-label strong {
                    font-size:
                        10px;

                    font-weight:
                        900;

                    letter-spacing:
                        1px;
                }

                .community-label span {
                    color:
                        rgba(
                            232,
                            230,
                            241,
                            .72
                        );

                    font-size:
                        9px;

                    font-weight:
                        700;
                }

                .community-count {
                    margin-top:
                        2px;

                    font-size:
                        9px;

                    font-weight:
                        900;
                }

                .label-a {
                    left:
                        7%;

                    top:
                        8%;

                    color:
                        #6699ff;
                }

                .label-b {
                    right:
                        7%;

                    top:
                        7%;

                    color:
                        #bd77ff;
                }

                .label-c {
                    left: 67%;
                    top: 82%;
                    transform: none;
                
                    color: #4ddab7;
                    text-align: left;
                    white-space: nowrap;
                }

                /* =========================
                   BRIDGE
                ========================= */

                .bridge-badge {
                    position:
                        absolute;

                    left:
                        49%;

                    top:
                        58%;

                    transform:
                        translateX(
                            -50%
                        );

                    z-index:
                        8;

                    display:
                        none;

                    padding:
                        7px
                        12px;

                    border-radius:
                        999px;

                    background:
                        rgba(
                            255,
                            197,
                            80,
                            .10
                        );

                    border:
                        1px solid
                        rgba(
                            255,
                            211,
                            92,
                            .30
                        );

                    color:
                        #ffd86d;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    white-space:
                        nowrap;

                    pointer-events:
                        none;
                }

                .betweenness-mode
                .bridge-badge {
                    display:
                        block;
                }

                /* =========================
                   PERSON
                ========================= */

                .person-node {
                    position:
                        absolute;

                    transform:
                        translate(
                            -50%,
                            -50%
                        );

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    transition:
                        .25s ease;

                    z-index:
                        4;
                }

                .person-circle {
                    width:
                        61px;

                    height:
                        61px;

                    border-radius:
                        50%;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    font-size:
                        34px;

                    background:
                        #171424;

                    border:
                        2px solid
                        rgba(
                            133,
                            87,
                            218,
                            .35
                        );

                    transition:
                        .25s ease;
                }

                .person-name {
                    margin-top:
                        6px;

                    color:
                        #eeeaf8;

                    font-size:
                        11px;

                    font-weight:
                        800;
                }

                .person-score {
                    margin-top:
                        2px;

                    color:
                        #89869a;

                    font-size:
                        9px;
                }

                .person-node.highlight
                .person-circle {
                    transform:
                        scale(
                            1.13
                        );

                    border:
                        3px solid
                        #b26cff;

                    box-shadow:
                        0
                        0
                        0
                        7px
                        rgba(
                            177,
                            105,
                            255,
                            .09
                        ),
                        0
                        0
                        25px
                        rgba(
                            177,
                            105,
                            255,
                            .30
                        );
                }

                .person-node.highlight
                .person-name {
                    color:
                        #c795ff;
                }

                .person-node
                .betweenness-context {
                    opacity:
                        .74;
                }

                .person-node
                .bridge-person {
                    opacity:
                        1;
                }

                .community-mode
                .community-a
                .person-circle {
                    border-color:
                        #5288ff;
                }

                .community-mode
                .community-b
                .person-circle {
                    border-color:
                        #b66dff;
                }

                .community-mode
                .community-c
                .person-circle {
                    border-color:
                        #39cfa9;
                }

                .community-mode
                .community-bridge
                .person-circle {
                    border-color:
                        #ffd35c;
                }

                /* =========================
                   RESULT
                ========================= */

                .graph-result {
                    min-height:
                        67px;

                    margin-top:
                        10px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .08
                        );

                    border-radius:
                        14px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            .015
                        );

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    gap:
                        13px;

                    padding:
                        10px
                        18px;
                }

                .result-label {
                    color:
                        #9b64ff;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    letter-spacing:
                        1px;
                }

                .result-main {
                    font-size:
                        15px;

                    font-weight:
                        800;
                }

                .result-main strong {
                    color:
                        #bf8aff;
                }

                /* =========================
                   RIGHT
                ========================= */

                .concept-panel {
                    padding:
                        20px;

                    display:
                        flex;

                    flex-direction:
                        column;
                }

                .concept-title {
                    margin:
                        0;

                    font-size:
                        22px;

                    font-weight:
                        900;
                }

                .concept-subtitle {
                    margin:
                        5px
                        0
                        16px;

                    color:
                        #747786;

                    font-size:
                        12px;
                }

                .concept-list {
                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        11px;

                    flex:
                        1;
                }

                .concept-card {
                    flex:
                        1;

                    min-height:
                        112px;

                    border-radius:
                        15px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            .09
                        );

                    padding:
                        17px
                        18px;

                    display:
                        grid;

                    grid-template-columns:
                        48px
                        1fr;

                    align-items:
                        center;

                    gap:
                        15px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            .015
                        );

                    cursor:
                        pointer;

                    transition:
                        .2s;
                }

                .concept-card.active {
                    border-color:
                        rgba(
                            177,
                            105,
                            255,
                            .50
                        );

                    background:
                        linear-gradient(
                            90deg,
                            rgba(
                                130,
                                77,
                                219,
                                .13
                            ),
                            rgba(
                                130,
                                77,
                                219,
                                .035
                            )
                        );

                    box-shadow:
                        inset
                        3px
                        0
                        #a366ff;
                }

                .concept-icon {
                    width:
                        48px;

                    height:
                        48px;

                    border-radius:
                        13px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    background:
                        rgba(
                            126,
                            76,
                            218,
                            .10
                        );

                    color:
                        #af76ff;
                }

                .concept-english {
                    color:
                        #b174ff;

                    font-size:
                        15px;

                    font-weight:
                        900;

                    letter-spacing:
                        .8px;
                }

                .concept-korean {
                    margin-top:
                        3px;

                    font-size:
                        20px;

                    font-weight:
                        900;

                    letter-spacing:
                        -.6px;
                }

                .concept-description {
                    margin-top:
                        6px;

                    color:
                        #777a89;

                    font-size:
                        11px;

                    line-height:
                        1.45;
                }

                /* =========================
                   KEY
                ========================= */

                .key-message {
                    margin-top:
                        12px;

                    min-height:
                        72px;

                    border-radius:
                        15px;

                    border:
                        1px solid
                        rgba(
                            174,
                            103,
                            255,
                            .25
                        );

                    background:
                        rgba(
                            103,
                            61,
                            177,
                            .08
                        );

                    display:
                        flex;

                    align-items:
                        center;

                    padding:
                        14px
                        18px;

                    gap:
                        13px;
                }

                .key-message svg {
                    color:
                        #b278ff;

                    flex-shrink:
                        0;
                }

                .key-message span {
                    color:
                        #a7a5b2;

                    font-size:
                        13px;

                    line-height:
                        1.5;
                }

                .key-message strong {
                    color:
                        #ffffff;

                    font-size:
                        14px;
                }

                /* =========================
                   FOOTER
                ========================= */

                .footer {
                    margin-top:
                        14px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        18px;
                }

                .footer-message {
                    color:
                        #9294a2;

                    font-size:
                        14px;
                }

                .footer-message strong {
                    color:
                        #f5f2ff;
                }

                .next-button {
                    flex-shrink:
                        0;

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;

                    border-radius:
                        999px;

                    border:
                        1px solid
                        rgba(
                            167,
                            102,
                            255,
                            .32
                        );

                    background:
                        rgba(
                            111,
                            67,
                            184,
                            .08
                        );

                    color:
                        #c395ff;

                    padding:
                        10px
                        17px;

                    font-size:
                        10px;

                    font-weight:
                        900;

                    cursor:
                        pointer;
                }

                @media (
                    max-width:
                    1200px
                ) {
                    .content-grid {
                        grid-template-columns:
                            1fr;
                    }

                    .concept-panel {
                        min-height:
                            430px;
                    }
                }
                
                /* =========================================================
       CENTRALITY PAGE - 1 SCREEN FINAL FIX
       ★ 기존 CSS 맨 마지막에 추가
    ========================================================= */
    
    /* 전체 페이지를 정확히 화면 높이에 고정 */
    .centrality-page {
        height: 100vh;
        min-height: 100vh;
    
        padding: 12px 22px 14px;
    
        display: flex;
        flex-direction: column;
    
        overflow: hidden;
    }
    
    
    /* =========================================================
       TOP BAR
    ========================================================= */
    
    .topbar {
        height: 46px;
        min-height: 46px;
    
        margin-bottom: 7px;
    
        flex-shrink: 0;
    }
    
    
    /* =========================================================
       전체 슬라이드
    
       남은 화면 높이를 정확히 사용
    ========================================================= */
    
    .slide {
        flex: 1;
    
        height: auto;
        min-height: 0;
    
        padding: 18px 26px 14px;
    
        display: flex;
        flex-direction: column;
    
        overflow: hidden;
    }
    
    
    /* =========================================================
       TITLE
    ========================================================= */
    
    .section-label {
        margin-bottom: 3px;
    
        font-size: 11px;
    }
    
    
    .page-title {
        font-size: clamp(36px, 3vw, 52px);
    
        line-height: 0.98;
    
        letter-spacing: -2.5px;
    }
    
    
    .page-description {
        margin-top: 8px;
    
        font-size: 12px;
    
        flex-shrink: 0;
    }
    
    
    /* =========================================================
       메인 콘텐츠
    
       ★ 남은 공간만 사용
    ========================================================= */
    
    .content-grid {
        flex: 1;
    
        min-height: 0;
    
        margin-top: 14px;
    
        gap: 16px;
    
        grid-template-columns:
            minmax(0, 1.65fr)
            minmax(380px, 0.95fr);
    
        overflow: hidden;
    }
    
    
    /* 양쪽 패널 */
    .panel {
        min-height: 0;
        height: 100%;
    
        overflow: hidden;
    }
    
    
    /* =========================================================
       LEFT GRAPH PANEL
    ========================================================= */
    
    .graph-panel {
        padding: 16px 18px 14px;
    
        min-height: 0;
    
        display: flex;
        flex-direction: column;
    }
    
    
    /* 왼쪽 제목 */
    .panel-heading {
        gap: 11px;
    
        flex-shrink: 0;
    }
    
    
    .heading-icon {
        width: 39px;
        height: 39px;
    
        border-radius: 11px;
    }
    
    
    .panel-heading h2 {
        font-size: 19px;
    }
    
    
    .panel-heading p {
        margin-top: 2px;
    
        font-size: 10px;
    }
    
    
    /* =========================================================
       DEGREE / BETWEENNESS / COMMUNITY
    ========================================================= */
    
    .mode-selector {
        margin-top: 12px;
    
        gap: 8px;
    
        flex-shrink: 0;
    }
    
    
    .mode-button {
        min-height: 48px;
        height: 48px;
    
        padding: 7px 12px;
    
        border-radius: 11px;
    }
    
    
    .mode-button strong {
        font-size: 12px;
    }
    
    
    .mode-button span {
        margin-top: 2px;
    
        font-size: 9px;
    }
    
    
    /* =========================================================
       NETWORK
    
       기존 min-height:360px 제거가 핵심
    ========================================================= */
    
    .network-area {
        flex: 1;
    
        min-height: 0 !important;
    
        margin-top: 8px;
    
        border-radius: 14px;
    
        overflow: hidden;
    }
    
    
    /* 사람 크기도 살짝 축소 */
    .person-circle {
        width: 52px;
        height: 52px;
    
        font-size: 29px;
    }
    
    
    .person-name {
        margin-top: 4px;
    
        font-size: 10px;
    }
    
    
    .person-score {
        margin-top: 1px;
    
        font-size: 8px;
    }
    
    
    /* 선택된 사람 */
    .person-node.highlight .person-circle {
        transform: scale(1.1);
    
        box-shadow:
            0 0 0 5px rgba(177, 105, 255, .09),
            0 0 18px rgba(177, 105, 255, .25);
    }
    
    
    /* =========================================================
       그래프 아래 결과 박스
    
       시민 74는 직접 연결...
    ========================================================= */
    
    .graph-result {
        min-height: 50px;
        height: 50px;
    
        margin-top: 7px;
    
        padding: 7px 14px;
    
        gap: 10px;
    
        flex-shrink: 0;
    }
    
    
    .result-label {
        font-size: 9px;
    }
    
    
    .result-main {
        font-size: 12px;
    }
    
    
    /* =========================================================
       RIGHT PANEL
    ========================================================= */
    
    .concept-panel {
        padding: 16px 17px 14px;
    
        min-height: 0;
    
        display: flex;
        flex-direction: column;
    }
    
    
    .concept-title {
        font-size: 19px;
    
        line-height: 1.1;
    
        flex-shrink: 0;
    }
    
    
    .concept-subtitle {
        margin: 4px 0 10px;
    
        font-size: 10px;
    
        flex-shrink: 0;
    }
    
    
    /* =========================================================
       오른쪽 3개 설명 카드
    ========================================================= */
    
    .concept-list {
        flex: 1;
    
        min-height: 0;
    
        gap: 8px;
    }
    
    
    .concept-card {
        flex: 1;
    
        min-height: 0 !important;
    
        padding: 10px 13px;
    
        grid-template-columns: 40px 1fr;
    
        gap: 11px;
    
        border-radius: 12px;
    }
    
    
    .concept-icon {
        width: 40px;
        height: 40px;
    
        border-radius: 10px;
    }
    
    
    .concept-english {
        font-size: 12px;
    }
    
    
    .concept-korean {
        margin-top: 2px;
    
        font-size: 16px;
    }
    
    
    .concept-description {
        margin-top: 4px;
    
        font-size: 9px;
    
        line-height: 1.35;
    }
    
    
    /* =========================================================
       오른쪽 맨 아래 핵심 설명
    
       직접 연결이 많은 사람과...
    ========================================================= */
    
    .key-message {
        min-height: 54px;
        height: 54px;
    
        margin-top: 8px;
    
        padding: 8px 13px;
    
        gap: 10px;
    
        flex-shrink: 0;
    
        border-radius: 12px;
    }
    
    
    .key-message span {
        font-size: 10px;
    
        line-height: 1.35;
    }
    
    
    .key-message strong {
        font-size: 11px;
    }
    
    
    /* =========================================================
       FOOTER
    
       ★ 이제 화면 안에서 항상 보임
    ========================================================= */
    
    .footer {
        min-height: 38px;
        height: 38px;
    
        margin-top: 8px;
    
        flex-shrink: 0;
    }
    
    
    .footer-message {
        font-size: 11px;
    }
    
    
    .next-button {
        height: 32px;
    
        padding: 0 14px;
    
        font-size: 9px;
    
        flex-shrink: 0;
    }
    
    
    /* =========================================================
       화면 높이가 조금 작은 PC용 추가 대응
    ========================================================= */
    
        @media (max-height: 850px) {
        
            .centrality-page {
                padding-top: 9px;
                padding-bottom: 10px;
            }
        
            .topbar {
                height: 42px;
                min-height: 42px;
                margin-bottom: 5px;
            }
        
            .slide {
                padding:
                    14px
                    22px
                    10px;
            }
        
            .page-title {
                font-size: 40px;
            }
        
            .page-description {
                margin-top: 6px;
                font-size: 11px;
            }
        
            .content-grid {
                margin-top: 10px;
            }
        
            .graph-panel,
            .concept-panel {
                padding: 13px 15px 11px;
            }
        
            .mode-selector {
                margin-top: 8px;
            }
        
            .mode-button {
                height: 43px;
                min-height: 43px;
            }
        
            .person-circle {
                width: 47px;
                height: 47px;
        
                font-size: 26px;
            }
        
            .graph-result {
                height: 44px;
                min-height: 44px;
            }
        
            .key-message {
                height: 48px;
                min-height: 48px;
            }
        
            .footer {
                height: 34px;
                min-height: 34px;
        
                margin-top: 6px;
            }
        }
            `}</style>

            <header className="topbar">
                <div>
                    <div className="brand-small">
                        FASHION NETWORK SIMULATION
                    </div>

                    <div className="brand-title">
                        TREND CITY
                    </div>
                </div>

                <div className="voice-chip">
                    <CircleDot size={8} />
                    <Mic size={12} />
                    VOICE PRESENTATION
                </div>

                <button
                    className="back-button"
                    onClick={() =>
                        navigate(
                            "/rdb-vs-graph"
                        )
                    }
                >
                    <ArrowLeft size={14} />

                    RDB VS GRAPH
                </button>
            </header>

            <main className="slide">

                <div className="section-label">
                    <span className="section-number">
                        07
                    </span>

                    CENTRALITY / COMMUNITY
                </div>

                <h1 className="page-title">
                    연결이 많다고,
                    <br />

                    <span className="accent">
                        가장 중요한 사람
                    </span>

                    일까?
                </h1>

                <div className="page-description">
                    같은 관계망도 무엇을 기준으로
                    분석하느냐에 따라 중요한 Node와
                    집단이 달라집니다.
                </div>

                <section className="content-grid">

                    {/* LEFT */}

                    <div className="panel graph-panel">

                        <div className="panel-heading">
                            <div className="heading-icon">
                                <Network size={24} />
                            </div>

                            <div>
                                <h2>
                                    같은 소문 네트워크를
                                    다르게 보기
                                </h2>

                                <p>
                                    분석 기준을 바꾸면
                                    같은 Graph에서도
                                    다른 특징이 보입니다.
                                </p>
                            </div>
                        </div>

                        <div className="mode-selector">
                            {Object.entries(
                                MODES
                            ).map(
                                (
                                    [
                                        key,
                                        item,
                                    ]
                                ) => (
                                    <button
                                        key={key}
                                        className={
                                            mode === key
                                                ? "mode-button active"
                                                : "mode-button"
                                        }
                                        onClick={() =>
                                            setMode(
                                                key
                                            )
                                        }
                                    >
                                        <strong>
                                            {
                                                item.english
                                            }
                                        </strong>

                                        <span>
                                            {
                                                item.short
                                            }
                                        </span>
                                    </button>
                                )
                            )}
                        </div>

                        <div
                            className={[
                                "network-area",
                                mode
                                ===
                                "community"
                                    ? "community-mode"
                                    : "",
                                mode
                                ===
                                "betweenness"
                                    ? "betweenness-mode"
                                    : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >

                            {/* COMMUNITY AREAS */}

                            <div className="community-zone zone-a" />
                            <div className="community-zone zone-b" />
                            <div className="community-zone zone-c" />

                            <div className="community-label label-a">
                                <strong>
                                    {
                                        COMMUNITY_INFO
                                            .A
                                            .title
                                    }
                                </strong>

                                <span>
                                    {
                                        COMMUNITY_INFO
                                            .A
                                            .subtitle
                                    }
                                </span>

                                <div className="community-count">
                                    내부 연결{" "}
                                    {
                                        COMMUNITY_INFO
                                            .A
                                            .internalLinks
                                    }
                                    개
                                </div>
                            </div>

                            <div className="community-label label-b">
                                <strong>
                                    {
                                        COMMUNITY_INFO
                                            .B
                                            .title
                                    }
                                </strong>

                                <span>
                                    {
                                        COMMUNITY_INFO
                                            .B
                                            .subtitle
                                    }
                                </span>

                                <div className="community-count">
                                    내부 연결{" "}
                                    {
                                        COMMUNITY_INFO
                                            .B
                                            .internalLinks
                                    }
                                    개
                                </div>
                            </div>

                            <div className="community-label label-c">
                                <strong>
                                    {
                                        COMMUNITY_INFO
                                            .C
                                            .title
                                    }
                                </strong>

                                <span>
                                    {
                                        COMMUNITY_INFO
                                            .C
                                            .subtitle
                                    }
                                </span>

                                <div className="community-count">
                                    내부 연결{" "}
                                    {
                                        COMMUNITY_INFO
                                            .C
                                            .internalLinks
                                    }
                                    개
                                </div>
                            </div>

                            {/* LINES */}

                            <svg
                                className="network-svg"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                {LINKS.map(
                                    (
                                        [a, b],
                                        index
                                    ) => {
                                        const p1 =
                                            getPerson(
                                                a
                                            );

                                        const p2 =
                                            getPerson(
                                                b
                                            );

                                        return (
                                            <line
                                                key={
                                                    index
                                                }
                                                x1={
                                                    p1.x
                                                }
                                                y1={
                                                    p1.y
                                                }
                                                x2={
                                                    p2.x
                                                }
                                                y2={
                                                    p2.y
                                                }
                                                className={
                                                    getLinkClass(
                                                        a,
                                                        b
                                                    )
                                                }
                                            />
                                        );
                                    }
                                )}
                            </svg>

                            {/* BETWEENNESS GUIDE */}

                            <div className="bridge-badge">
                                COMMUNITY A
                                {" "}→{" "}
                                시민 74
                                {" "}→{" "}
                                COMMUNITY B · C
                            </div>

                            {/* PEOPLE */}

                            {PEOPLE.map(
                                (
                                    person
                                ) => (
                                    <div
                                        key={
                                            person.id
                                        }
                                        className={[
                                            "person-node",
                                            getCommunityClass(
                                                person
                                            ),
                                            getNodeState(
                                                person
                                            ),
                                        ]
                                            .filter(
                                                Boolean
                                            )
                                            .join(
                                                " "
                                            )}
                                        style={{
                                            left:
                                                `${person.x}%`,
                                            top:
                                                `${person.y}%`,
                                        }}
                                    >
                                        <div className="person-circle">
                                            {
                                                person.emoji
                                            }
                                        </div>

                                        <div className="person-name">
                                            {
                                                person.name
                                            }
                                        </div>

                                        {mode ===
                                            "degree" && (
                                                <div className="person-score">
                                                    직접 연결{" "}
                                                    {
                                                        degreeMap[
                                                            person
                                                                .id
                                                            ]
                                                    }
                                                    개
                                                </div>
                                            )}
                                    </div>
                                )
                            )}
                        </div>

                        {/* RESULT */}

                        <div className="graph-result">
                            <span className="result-label">
                                {
                                    selectedMode
                                        .english
                                }
                            </span>

                            {mode ===
                                "degree" && (
                                    <span className="result-main">
                                    <strong>
                                        시민 74
                                    </strong>
                                    는 직접 연결{" "}
                                        <strong>
                                        {
                                            degreeMap[
                                                5
                                                ]
                                        }
                                            개
                                    </strong>
                                    로 이 네트워크에서
                                    Degree가 가장 높습니다.
                                </span>
                                )}

                            {mode ===
                                "betweenness" && (
                                    <span className="result-main">
                                    <strong>
                                        시민 74
                                    </strong>
                                    를 거치면{" "}
                                        <strong>
                                        서로 다른 집단으로
                                        이동
                                    </strong>
                                    할 수 있습니다.
                                </span>
                                )}

                            {mode ===
                                "community" && (
                                    <span className="result-main">
                                    <strong>
                                        같은 집단 안에서는
                                        서로 연결이 많고,
                                    </strong>
                                        {" "}
                                        다른 집단과의 연결은
                                    상대적으로 적습니다.
                                </span>
                                )}
                        </div>
                    </div>

                    {/* RIGHT */}

                    <aside className="panel concept-panel">

                        <h2 className="concept-title">
                            같은 Graph,
                            <br />
                            무엇을 보면 달라질까?
                        </h2>

                        <p className="concept-subtitle">
                            아래 개념을 선택하면
                            왼쪽에서 무엇을 봐야 하는지
                            바로 비교할 수 있습니다.
                        </p>

                        <div className="concept-list">

                            {Object.entries(
                                MODES
                            ).map(
                                (
                                    [
                                        key,
                                        item,
                                    ]
                                ) => {
                                    const Icon =
                                        item.icon;

                                    return (
                                        <div
                                            key={
                                                key
                                            }
                                            className={
                                                mode
                                                ===
                                                key
                                                    ? "concept-card active"
                                                    : "concept-card"
                                            }
                                            onClick={() =>
                                                setMode(
                                                    key
                                                )
                                            }
                                        >
                                            <div className="concept-icon">
                                                <Icon
                                                    size={
                                                        24
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <div className="concept-english">
                                                    {
                                                        item
                                                            .english
                                                    }
                                                </div>

                                                <div className="concept-korean">
                                                    {
                                                        item
                                                            .korean
                                                    }
                                                </div>

                                                <div className="concept-description">
                                                    {
                                                        item
                                                            .description
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        <div className="key-message">
                            <GitBranch size={25} />

                            <span>
                                <strong>
                                    직접 연결이 많은 사람
                                </strong>
                                과
                                <br />

                                <strong>
                                    다른 집단 사이의 연결자
                                </strong>
                                는 서로 다를 수 있습니다.
                            </span>
                        </div>
                    </aside>
                </section>

                <footer className="footer">

                    <div className="footer-message">
                        같은 Graph에서도{" "}
                        <strong>
                            연결 수 · 집단 사이의 경로 ·
                            관계 밀집도
                        </strong>
                        를 보면 서로 다른 특징을
                        찾을 수 있습니다.
                    </div>

                    <button
                        className="next-button"
                        onClick={() =>
                            navigate(
                                "/trend-flow"
                            )
                        }
                    >
                        TREND FLOW

                        <ArrowRight size={15} />
                    </button>
                </footer>
            </main>
        </div>
    );
}

export default CentralityPage;