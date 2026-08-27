import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    extractVoiceCommand,
    hasWakeWord,
} from "../../voice/voiceUtils";

import {
    detectGlobalCommand,
} from "../../voice/voiceCommands";

import {
    getNextRoute,
    getPreviousRoute,
} from "../../voice/voiceRoutes";

import {
    transcribeVoice,
} from "../../api/voiceApi";

import "./VoiceCommandBar.css";


// =========================================================
// SETTINGS
// =========================================================

// 평상시 녹음 길이
const RECORDING_TIME = 1100;

// 콩 인식 후 명령을 기다리는 최대 시간
const WAKE_WAIT_TIME = 12000;

// 잘린 명령 조각을 모으는 시간
const COMMAND_MERGE_TIME = 1800;

// 명령 실행 후 화면 표시 시간
const COMMAND_DISPLAY_TIME = 1200;

const WAKE_WORD_LABEL = "콩";


// =========================================================
// COMPONENT
// =========================================================

function VoiceCommandBar() {

    const location =
        useLocation();

    const navigate =
        useNavigate();


    // =====================================================
    // REFS
    // =====================================================

    const streamRef =
        useRef(null);

    const recorderRef =
        useRef(null);

    const recordingTimerRef =
        useRef(null);

    const commandTimerRef =
        useRef(null);

    const wakeTimerRef =
        useRef(null);

    const mergeTimerRef =
        useRef(null);

    const activeRef =
        useRef(false);

    const transcribingRef =
        useRef(false);

    const waitingForCommandRef =
        useRef(false);

    // Whisper가 처리 중일 때
    // 가장 최신 녹음 하나만 보관
    const pendingAudioRef =
        useRef(null);

    // 콩 이후 잘린 명령 조각 저장
    const commandPartsRef =
        useRef([]);

    const pathnameRef =
        useRef(
            location.pathname
        );


    // =====================================================
    // STATE
    // =====================================================

    const [
        status,
        setStatus,
    ] = useState(
        "starting"
    );

    const [
        displayText,
        setDisplayText,
    ] = useState(
        "마이크 연결 중..."
    );


    // =====================================================
    // PATH
    // =====================================================

    useEffect(
        () => {

            pathnameRef.current =
                location.pathname;


            // =====================================================
            // 페이지가 변경되면 이전 페이지 음성 명령 폐기
            // =====================================================

            clearCommandBuffer();

            clearWakeState();

            pendingAudioRef.current =
                null;


            console.log(
                "[VOICE PAGE CHANGED]",
                location.pathname
            );

        },
        [
            location.pathname,
        ]
    );


    // =====================================================
    // HIDDEN PAGE
    // =====================================================

    const hidden = false;


    // =====================================================
    // UI
    // =====================================================

    function showListening() {

        setStatus(
            "listening"
        );

        setDisplayText(
            `"${WAKE_WORD_LABEL}"이라고 말해 명령하세요`
        );
    }


    function showCommand(
        text
    ) {

        setStatus(
            "command"
        );

        setDisplayText(
            text
        );


        if (
            commandTimerRef.current
        ) {

            window.clearTimeout(
                commandTimerRef.current
            );
        }


        commandTimerRef.current =
            window.setTimeout(
                () => {

                    if (
                        !waitingForCommandRef.current
                    ) {

                        showListening();
                    }

                },
                COMMAND_DISPLAY_TIME
            );
    }


    // =====================================================
    // COMMAND BUFFER
    // =====================================================

    function clearCommandBuffer() {

        commandPartsRef.current =
            [];


        if (
            mergeTimerRef.current
        ) {

            window.clearTimeout(
                mergeTimerRef.current
            );

            mergeTimerRef.current =
                null;
        }
    }


    function getMergedCommand() {

        return commandPartsRef.current
            .join(" ")
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    // =====================================================
    // WAKE STATE
    // =====================================================

    function clearWakeState() {

        waitingForCommandRef.current =
            false;


        if (
            wakeTimerRef.current
        ) {

            window.clearTimeout(
                wakeTimerRef.current
            );

            wakeTimerRef.current =
                null;
        }
    }


    function activateWakeState() {

        clearWakeState();
        clearCommandBuffer();


        waitingForCommandRef.current =
            true;


        console.log(
            `[VOICE WAKE] ${WAKE_WORD_LABEL}`
        );


        setStatus(
            "command"
        );


        setDisplayText(
            `${WAKE_WORD_LABEL} · 명령을 말씀하세요`
        );


        wakeTimerRef.current =
            window.setTimeout(
                () => {

                    console.log(
                        "[VOICE WAKE TIMEOUT]"
                    );


                    const merged =
                        getMergedCommand();


                    if (
                        merged
                    ) {

                        tryExecuteMergedCommand();
                    }


                    clearWakeState();
                    clearCommandBuffer();

                    showListening();

                },
                WAKE_WAIT_TIME
            );
    }


    // =====================================================
    // CURRENT PAGE COMMAND
    // =====================================================

    function executeTrendIntroCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        // =================================================
        // 시뮬레이션 이동
        // =================================================

        const simulationWords = [
            "시뮬레이션",
            "시물레이션",
            "시뮬에이션",
            "실물레이천",
            "시뮬레이천",
            "시뮬",
            "시물"
        ];


        const isSimulation =
            simulationWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isSimulation
        ) {

            console.log(
                "[VOICE NAVIGATE]",
                "/trend-city"
            );


            navigate(
                "/trend-city"
            );


            return true;
        }


        // =================================================
        // TrendIntro 내부 명령
        // =================================================

        const trendKeywords = [
            "스키니",
            "스키니진",

            "떡볶이코트",
            "더플",
            "더플코트",

            "어그",
            "어그부츠",

            "로우라이즈",
            "로라이즈",

            "벨루어",
            "트랙수트",

            "전체",
            "모두",
            "전부",
        ];


        const isTrendCommand =
            trendKeywords.some(
                (keyword) =>
                    normalized.includes(
                        keyword
                    )
            );


        if (
            !isTrendCommand
        ) {

            return false;
        }


        window.dispatchEvent(
            new CustomEvent(
                "trend-intro-voice-command",
                {
                    detail: {
                        command,
                    },
                }
            )
        );


        console.log(
            "[VOICE PAGE COMMAND]",
            "TREND_INTRO",
            command
        );


        return true;
    }


    // =========================================================
// TREND CITY PAGE COMMAND
// =========================================================

    // =========================================================
// TREND CITY PAGE COMMAND
//
// /trend-city 안에서만 사용하는 명령
// =========================================================

    function executeTrendCityCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[TREND CITY COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 1. 결과 분석
        // =====================================================

        const analysisWords = [
            "결과분석",
            "결과분석해줘",
            "결과",

            "분석해줘",
            "분석해",

            "분석보여줘",
            "분석페이지",
            "분석페이지보여줘",

            "결과보여줘",
            "결과페이지",

            "그래프분석",
            "분석결과",
        ];


        const isAnalysis =
            analysisWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isAnalysis
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-city-voice-command",
                    {
                        detail: {
                            type:
                                "ANALYZE_RESULT",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_CITY",
                "ANALYZE_RESULT",
                command
            );


            return true;
        }


        // =====================================================
        // 2. RESET
        //
        // Whisper 오인식도 같이 허용
        //
        // 리셋
        // 리셉
        // 리프
        // =====================================================

        const resetWords = [
            "리셋",
            "리셋해",
            "리셋해줘",
            "리셋버튼",
            "리셋버튼눌러줘",

            // Whisper 오인식
            "리셉",
            "리셉해",
            "리셉해줘",
            "리셉버튼",
            "리셉버튼눌러줘",

            "리프",
            "리프해",
            "리프해줘",
            "리프버튼",
            "리프버튼눌러줘",

            "초기화",
            "초기화해",
            "초기화해줘",

            "처음부터",
            "처음부터해",
            "처음부터해줘",

            "다시초기화",
            "시뮬레이션초기화",
        ];


        const isReset =
            resetWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isReset
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-city-voice-command",
                    {
                        detail: {
                            type:
                                "RESET_SIMULATION",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_CITY",
                "RESET_SIMULATION",
                command
            );


            return true;
        }


        // =====================================================
        // 3. START
        // =====================================================

        const startWords = [
            "시작",
            "시작해",
            "시작해줘",

            "실행",
            "실행해",
            "실행해줘",

            "소문시작",
            "소문시작해",
            "소문시작해줘",

            "소문퍼뜨려",
            "소문퍼뜨려줘",

            "소문퍼트려",
            "소문퍼트려줘",

            "시뮬레이션시작",
            "시뮬레이션시작해줘",

            "시뮬레이션실행",
            "시뮬레이션실행해줘",

            "스타트",
            "스타트해",
            "스타트해줘",

            "스타트루머",
        ];


        const isStart =
            startWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isStart
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-city-voice-command",
                    {
                        detail: {
                            type:
                                "START_SIMULATION",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_CITY",
                "START_SIMULATION",
                command
            );


            return true;
        }


        // =====================================================
        // 4. 현재 메인 버튼
        //
        // 어떤 버튼인지 TrendCityPage가 판단
        //
        // simulation 없음
        // → START
        //
        // simulation 있음
        // → RESET
        // =====================================================

        const buttonWords = [
            "버튼눌러",
            "버튼눌러줘",

            "버튼클릭",
            "버튼클릭해",
            "버튼클릭해줘",

            "메인버튼",
            "메인버튼눌러",
            "메인버튼눌러줘",

            "저버튼",
            "저버튼눌러",
            "저버튼눌러줘",

            "이버튼",
            "이버튼눌러",
            "이버튼눌러줘",

            "눌러줘",
        ];


        const isButtonCommand =
            buttonWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isButtonCommand
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-city-voice-command",
                    {
                        detail: {
                            type:
                                "PRIMARY_ACTION",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_CITY",
                "PRIMARY_ACTION",
                command
            );


            return true;
        }


        // =====================================================
        // 5. 이전 Trend Intro 페이지로 이동
        // =====================================================

        const previousTarget =
            normalized.includes(
                "이전"
            )
            ||
            normalized.includes(
                "유행화면"
            )
            ||
            normalized.includes(
                "트렌드화면"
            )
            ||
            normalized.includes(
                "이전화면"
            )
            ||
            normalized.includes(
                "이전페이지"
            );


        const previousIntent =
            normalized.includes(
                "가줘"
            )
            ||
            normalized.includes(
                "돌아가"
            )
            ||
            normalized.includes(
                "이동"
            )
            ||
            normalized.includes(
                "넘어가"
            )
            ||
            normalized.includes(
                "보여줘"
            );


        if (
            previousTarget
            &&
            previousIntent
        ) {

            navigate(
                "/trend-intro"
            );


            console.log(
                "[VOICE NAVIGATE]",
                "/trend-intro"
            );


            return true;
        }


        // =====================================================
        // 해당 페이지 명령 아님
        // =====================================================

        return false;
    }

    // =========================================================
    // GRAPH STRUCTURE PAGE COMMAND
    //
    // 현재 페이지:
    // /graph-structure
    //
    // 이 페이지에서는
    //
    // 다음 / 사이퍼 / 쿼리
    // → /cypher
    //
    // 이전 / 시뮬레이션
    // → /trend-city
    //
    // 로 처리한다.
    // =========================================================

    function executeGraphStructureCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[GRAPH STRUCTURE COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 1. CYPHER 페이지 이동
        //
        // 발표 중 자연스럽게:
        //
        // "사이퍼 보여줘"
        // "사이퍼로 넘어가줘"
        // "사이퍼 페이지 보여줘"
        // "쿼리 보여줘"
        // "명령어 보여줘"
        // "다음 페이지 보여줘"
        // "다음으로 넘어가줘"
        //
        // Whisper 오인식도 일부 허용
        // =====================================================

        const cypherTargetWords = [
            "사이퍼",
            "싸이퍼",
            "사이파",
            "싸이파",
            "cypher",

            "쿼리",
            "쿼리문",

            "명령어",
            "그래프쿼리",
        ];


        const cypherIntentWords = [
            "보여줘",
            "보여",
            "열어줘",
            "열어",

            "넘어가",
            "넘어가줘",

            "이동",
            "이동해",
            "이동해줘",

            "가줘",
            "가자",

            "페이지",
        ];


        const hasCypherTarget =
            cypherTargetWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasCypherIntent =
            cypherIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        // "사이퍼"처럼 목적지가 아주 명확한 경우는
        // 이동 표현이 없어도 허용
        if (
            hasCypherTarget
            &&
            (
                hasCypherIntent
                ||
                normalized === "사이퍼"
                ||
                normalized === "싸이퍼"
                ||
                normalized === "사이파"
                ||
                normalized === "싸이파"
                ||
                normalized === "cypher"
                ||
                normalized === "쿼리"
            )
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPH_STRUCTURE",
                "GO_CYPHER",
                command
            );


            navigate(
                "/cypher",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 2. 다음 페이지
        //
        // Graph Structure에서 다음 페이지는 Cypher
        // =====================================================

        const nextTargetWords = [
            "다음",
            "다음페이지",
            "다음화면",
            "다음단계",
        ];


        const nextIntentWords = [
            "보여줘",
            "보여",

            "넘어가",
            "넘어가줘",

            "이동",
            "이동해",
            "이동해줘",

            "가줘",
            "가자",

            "열어줘",
            "열어",
        ];


        const hasNextTarget =
            nextTargetWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasNextIntent =
            nextIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasNextTarget
            &&
            hasNextIntent
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPH_STRUCTURE",
                "NEXT_TO_CYPHER",
                command
            );


            navigate(
                "/cypher",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 3. 시뮬레이션으로 돌아가기
        //
        // "시뮬레이션 보여줘"
        // "시뮬레이션으로 돌아가줘"
        // "시뮬레이션 페이지로 가줘"
        // =====================================================

        const simulationTargetWords = [
            "시뮬레이션",
            "시물레이션",
            "시뮬에이션",
            "시뮬레이천",
            "실물레이천",

            "트렌드시티",
            "트렌드씨티",
        ];


        const simulationIntentWords = [
            "돌아가",
            "돌아가줘",

            "보여줘",
            "보여",

            "가줘",
            "가자",

            "이동",
            "이동해",
            "이동해줘",

            "넘어가",
            "넘어가줘",

            "페이지",
        ];


        const hasSimulationTarget =
            simulationTargetWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasSimulationIntent =
            simulationIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasSimulationTarget
            &&
            hasSimulationIntent
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPH_STRUCTURE",
                "BACK_TO_SIMULATION",
                command
            );


            navigate(
                "/trend-city"
            );


            return true;
        }


        // =====================================================
        // 4. 이전 페이지
        //
        // Graph Structure에서 이전은 Trend City
        // =====================================================

        const previousTargetWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "전페이지",
            "전단계",
        ];


        const previousIntentWords = [
            "돌아가",
            "돌아가줘",

            "보여줘",
            "보여",

            "가줘",
            "가자",

            "이동",
            "이동해",
            "이동해줘",

            "넘어가",
            "넘어가줘",
        ];


        const hasPreviousTarget =
            previousTargetWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasPreviousIntent =
            previousIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPreviousTarget
            &&
            hasPreviousIntent
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPH_STRUCTURE",
                "PREVIOUS_TO_SIMULATION",
                command
            );


            navigate(
                "/trend-city"
            );


            return true;
        }


        // =====================================================
        // 이 페이지 명령 아님
        // =====================================================

        return false;
    }

    // =========================================================
    // CYPHER PAGE COMMAND
    //
    // 현재 페이지:
    // /cypher
    //
    // 페이지 내부:
    // CREATE / RELATIONSHIP / MATCH / WHERE
    //
    // 페이지 이동:
    // 이전 -> /graph-structure
    // 다음/PATH -> /path-traversal
    // =========================================================

    function executeCypherCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[CYPHER COMMAND CHECK]",
            normalized
        );


        function dispatchCypherCommand(
            type
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "cypher-voice-command",
                    {
                        detail: {
                            type,
                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "CYPHER",
                type,
                command
            );


            return true;
        }


        // =====================================================
        // 1. CREATE
        // =====================================================

        const createWords = [
            "create",
            "크리에이트",
            "크리에잇",
            "크리애이트",

            "노드만들기",
            "노드만들어",
            "노드만들어줘",

            "노드생성",
            "노드생성해",
            "노드생성해줘",

            "생성명령어",

            // 순서 명령
            "첫번째",
            "첫번째보여줘",
            "첫번째코드",
            "첫번째코드보여줘",
            "첫번째명령어",
            "첫번째명령어보여줘",

            "1번째",
            "1번째보여줘",
            "일번",
        ];


        const isCreate =
            createWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isCreate
        ) {

            return dispatchCypherCommand(
                "SHOW_CREATE"
            );
        }


        // =====================================================
        // 2. RELATIONSHIP
        // =====================================================

        const relationshipWords = [
            "relationship",
            "릴레이션십",
            "릴레이션쉽",
            "릴레이션",

            "관계만들기",
            "관계만들어",
            "관계만들어줘",

            "관계생성",
            "관계생성해",
            "관계생성해줘",

            "관계연결",
            "관계연결해",
            "관계연결해줘",

            "스프레드관계",
            "spread관계",

            // 순서 명령
            "두번째",
            "두번째보여줘",
            "두번째코드",
            "두번째코드보여줘",
            "두번째명령어",
            "두번째명령어보여줘",
            "두번",

            "2번째",
            "2번째보여줘",
            "이번"
        ];


        const isRelationship =
            relationshipWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isRelationship
        ) {

            return dispatchCypherCommand(
                "SHOW_RELATIONSHIP"
            );
        }


        // =====================================================
        // 3. MATCH
        // =====================================================

        const matchWords = [
            "match",
            "매치",
            "매칭",

            "관계찾기",
            "관계찾아",
            "관계찾아줘",

            "패턴찾기",
            "패턴찾아",
            "패턴찾아줘",

            "관계패턴",
            "관계패턴찾기",

            "조회",
            "조회해",
            "조회해줘",

            // 순서 명령
            "세번째",
            "세번째보여줘",
            "세번째코드",
            "세번째코드보여줘",
            "세번째명령어",
            "세번째명령어보여줘",

            "3번째",
            "3번째보여줘",
            "삼번"
        ];


        const isMatch =
            matchWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isMatch
        ) {

            return dispatchCypherCommand(
                "SHOW_MATCH"
            );
        }


        // =====================================================
        // 4. WHERE
        // =====================================================

        const whereWords = [
            "where",
            "웨어",
            "웨얼",

            "조건",
            "조건문",

            "조건으로좁혀",
            "조건으로좁혀줘",

            "필터",
            "필터링",

            "sns만",
            "sns관계",
            "sns만보여줘",
            "sns관계보여줘",

            // 순서 명령
            "네번째",
            "네번째보여줘",
            "네번째코드",
            "네번째코드보여줘",
            "네번째명령어",
            "네번째명령어보여줘",

            "4번째",
            "4번째보여줘",
            "사번"
        ];


        const isWhere =
            whereWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isWhere
        ) {

            return dispatchCypherCommand(
                "SHOW_WHERE"
            );
        }


        // =====================================================
        // 5. 이전 페이지
        // Cypher -> Graph Structure
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "뒤로",
            "돌아가",
            "돌아가줘",

            "그래프구조",
            "그래프스트럭처",
            "graphstructure",
        ];


        const hasPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPrevious
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "CYPHER",
                "PREVIOUS_TO_GRAPH_STRUCTURE",
                command
            );


            navigate(
                "/graph-structure",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 6. 다음 / PATH
        // Cypher -> Path Traversal
        // =====================================================

        const pathWords = [
            "path",
            "패스",
            "파스",

            "경로",
            "경로탐색",
            "경로페이지",

            "다음",
            "다음페이지",
            "다음화면",
            "다음단계",
        ];


        const hasPath =
            pathWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPath
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "CYPHER",
                "NEXT_TO_PATH",
                command
            );


            navigate(
                "/path-traversal",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 해당 페이지 명령 아님
        // =====================================================

        return false;
    }

    // =========================================================
    // PATH / TRAVERSAL PAGE COMMAND
    //
    // 현재 페이지:
    // /path-traversal
    //
    // 내부 기능:
    // Traversal
    // Path
    // Neighbor Search
    // 1단계
    // 2단계
    // Direction
    //
    // 페이지 이동:
    // 이전 -> /cypher
    // 다음 -> /rdb-vs-graph
    // =========================================================

    function executePathTraversalCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[PATH COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 내부 이벤트 전달
        // =====================================================

        function dispatchPathCommand(
            type
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "path-voice-command",
                    {
                        detail: {
                            type,
                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "PATH",
                type,
                command
            );


            return true;
        }


        // =====================================================
        // 1. NEIGHBOR 2단계
        //
        // 일반 Neighbor보다 먼저 검사
        // =====================================================

        const neighbor2Words = [
            "2단계",
            "이단계",
            "두단계",

            "2단계까지",
            "이단계까지",
            "두단계까지",

            "2단계연결",
            "두단계연결",

            "두번째연결",
        ];


        const isNeighbor2 =
            neighbor2Words.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isNeighbor2
        ) {

            return dispatchPathCommand(
                "SHOW_NEIGHBOR_2"
            );
        }


        // =====================================================
        // 2. NEIGHBOR 1단계
        // =====================================================

        const neighbor1Words = [
            "1단계",
            "일단계",
            "한단계",

            "1단계연결",
            "일단계연결",
            "한단계연결",

            "직접연결",
            "바로연결",
        ];


        const isNeighbor1 =
            neighbor1Words.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isNeighbor1
        ) {

            return dispatchPathCommand(
                "SHOW_NEIGHBOR_1"
            );
        }


        // =====================================================
        // 3. NEIGHBOR SEARCH
        // =====================================================

        const neighborWords = [
            "neighbor",
            "네이버",
            "네이버서치",
            "네이버검색",

            "이웃",
            "이웃검색",

            "주변",
            "주변연결",
            "주변사람",

            "연결된사람",
            "연결사람",

            "근처연결",

            // 순서 명령 추가
            "세번째",
            "세번째보여줘",
            "세번째보여",
            "3번째",
            "3번째보여줘",
        ];


        const isNeighbor =
            neighborWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isNeighbor
        ) {

            return dispatchPathCommand(
                "SHOW_NEIGHBOR"
            );
        }


        // =====================================================
        // 4. DIRECTION
        // =====================================================

        const directionWords = [
            "direction",
            "디렉션",
            "다이렉션",

            "방향",
            "방향성",

            "관계방향",
            "화살표방향",

            "받은관계",
            "보낸관계",

            "전달방향",
            "흐름방향",

            // 순서 명령 추가
            "네번째",
            "네번째보여줘",
            "네번째보여",
            "4번째",
            "4번째보여줘",
        ];


        const isDirection =
            directionWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isDirection
        ) {

            return dispatchPathCommand(
                "SHOW_DIRECTION"
            );
        }


        // =====================================================
        // 5. TRAVERSAL
        // =====================================================

        const traversalWords = [

            "traversal",

            "트래버설",
            "트레버설",
            "트래버셜",
            "트레버셜",

            "트리버설",
            "트리버셜",

            "트래버",
            "트레버",
            "트리버",

            "트레이버",
            "트레이보",
            "트레이보셨",
            "트레이보셨나요",

            "탐색",
            "그래프탐색",
            "연결탐색",
            "관계탐색",

            "하나씩따라",
            "하나씩따라가기",

            "관계따라가기",
            "연결따라가기",

            "노드따라가기",

            // 추가
            "첫번째",
            "첫번째보여줘",
            "첫번째설명",
            "첫번째설명해줘",
            "1번째",
            "1번째보여줘",
        ];


        const isTraversal =
            traversalWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isTraversal
        ) {

            return dispatchPathCommand(
                "SHOW_TRAVERSAL"
            );
        }


        // =====================================================
        // 6. PATH
        //
        // 주의:
        // "다음 페이지"의 페이지라는 단어 때문에
        // PATH로 오인식되지 않도록
        // "패스 / 경로" 중심으로 검사
        // =====================================================

        const pathWords = [
            "path",
            "패스",
            "파스",

            "경로",
            "전체경로",

            "지나온길",
            "전체길",

            "시작부터끝",
            "스타트부터타겟",

            // 추가
            "두번째",
            "두번째보여줘",
            "두번째설명",
            "두번째설명해줘",
            "2번째",
            "2번째보여줘",
        ];


        const isPath =
            pathWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isPath
        ) {

            return dispatchPathCommand(
                "SHOW_PATH"
            );
        }


        // =====================================================
        // 7. 이전 페이지
        // Path -> Cypher
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",

            "뒤로",
            "돌아가",
            "돌아가줘",

            "사이퍼",
            "싸이퍼",
            "cypher",
        ];


        const hasPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPrevious
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "PATH",
                "PREVIOUS_TO_CYPHER",
                command
            );


            navigate(
                "/cypher",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }




        // =====================================================
        // 8. 다음 / RDB VS GRAPH
        // =====================================================

        const nextWords = [
            "다음",
            "다음페이지",
            "다음화면",
            "다음단계",

            "rdb",
            "알디비",
            "rdbvsgraph",

            "rdb비교",
            "그래프비교",

            "관계형db",
            "관계형데이터베이스",

            "비교페이지",
        ];


        const hasNext =
            nextWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasNext
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "PATH",
                "NEXT_TO_RDB_GRAPH",
                command
            );


            navigate(
                "/rdb-vs-graph",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 해당 페이지 명령 아님
        // =====================================================

        return false;
    }

    // =========================================================
// RDB VS GRAPH PAGE COMMAND
//
// 현재 페이지:
// /rdb-vs-graph
//
// 내부 기능:
// 비교장면 1
// 비교장면 2
//
// 페이지 이동:
// 이전 -> /path-traversal
// 다음 -> /centrality
// =========================================================

    function executeRdbVsGraphCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[RDB VS GRAPH COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 이벤트 전달 함수
        // =====================================================

        function dispatchRdbCommand(
            type
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "rdb-vs-graph-voice-command",
                    {
                        detail: {
                            type,
                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "RDB_VS_GRAPH",
                type,
                command
            );


            return true;
        }


        // =====================================================
        // 1. 비교장면 1
        // =====================================================

        const sceneOneWords = [
            "비교장면1",
            "비교장면일",

            "장면1",
            "장면일",

            "첫번째장면",
            "첫장면",

            "첫번째비교",
            "첫번째비교장면",

            "비교1",
            "비교일",
        ];


        const isSceneOne =
            sceneOneWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isSceneOne
        ) {

            return dispatchRdbCommand(
                "SHOW_SCENE_1"
            );
        }


        // =====================================================
        // 2. 비교장면 2
        // =====================================================

        const sceneTwoWords = [
            "비교장면2",
            "비교장면이",

            "장면2",
            "장면이",

            "두번째장면",
            "둘째장면",

            "두번째비교",
            "두번째비교장면",

            "비교2",
            "비교이",
            "두번째"
        ];


        const isSceneTwo =
            sceneTwoWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isSceneTwo
        ) {

            return dispatchRdbCommand(
                "SHOW_SCENE_2"
            );
        }


        // =====================================================
        // 3. 다음 장면
        //
        // 중요:
        // "다음 페이지"와 구분하기 위해
        // 반드시 '장면'이 포함된 경우만 처리
        // =====================================================

        const nextSceneWords = [
            "다음장면",
            "다음장면보여줘",
            "다음장면으로",
            "다음장면넘어가",
            "다음장면넘어가줘",

            "다음비교장면",
            "다음비교",
        ];


        const isNextScene =
            nextSceneWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isNextScene
        ) {

            return dispatchRdbCommand(
                "NEXT_SCENE"
            );
        }


        // =====================================================
        // 4. 이전 장면
        //
        // 페이지 이동보다 먼저 검사해야 함
        // =====================================================

        const previousSceneWords = [
            "이전장면",
            "이전장면보여줘",
            "이전장면으로",
            "이전장면돌아가",
            "이전장면돌아가줘",

            "이전비교장면",
            "이전비교",
        ];


        const isPreviousScene =
            previousSceneWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isPreviousScene
        ) {

            return dispatchRdbCommand(
                "PREVIOUS_SCENE"
            );
        }


        // =====================================================
        // 5. 이전 페이지 -> PATH
        // =====================================================

        const previousPageWords = [
            "이전페이지",
            "이전화면",
            "전페이지",

            "패스페이지",
            "패스화면",

            "경로페이지",
            "경로탐색페이지",

            "path",
            "path페이지",
        ];


        const hasPreviousPage =
            previousPageWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPreviousPage
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "RDB_VS_GRAPH",
                "PREVIOUS_TO_PATH",
                command
            );


            navigate(
                "/path-traversal",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 6. 다음 페이지 -> CENTRALITY
        // =====================================================

        const nextPageWords = [
            "다음페이지",
            "다음화면",
            "다음단계",

            "중심성",
            "중심성페이지",
            "중심성화면",

            "센트럴리티",
            "centrality",
        ];


        const hasNextPage =
            nextPageWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasNextPage
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "RDB_VS_GRAPH",
                "NEXT_TO_CENTRALITY",
                command
            );


            navigate(
                "/centrality",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 해당 페이지 명령 아님
        // =====================================================

        return false;
    }

    // =========================================================
// CENTRALITY PAGE COMMAND
//
// 현재 페이지:
// /centrality
//
// 페이지 내부:
// DEGREE / BETWEENNESS / COMMUNITY
//
// 페이지 이동:
// 이전 -> /rdb-vs-graph
// 다음 -> /trend-flow
// =========================================================

    function executeCentralityCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[CENTRALITY COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 내부 이벤트 보내기
        // =====================================================

        function dispatchCentralityCommand(
            type
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "centrality-voice-command",
                    {
                        detail: {
                            type,
                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "CENTRALITY",
                type,
                command
            );


            return true;
        }


        // =====================================================
        // 1. DEGREE
        // =====================================================

        const degreeWords = [
            // =====================================================
            // DEGREE - 정상 표현
            // =====================================================

            "degree",
            "디그리",
            "디그리중심성",
            "디그리중앙성",

            // =====================================================
            // DEGREE - Whisper 오인식
            // =====================================================

            "디글이",
            "비글이",
            "디거리",
            "디글리",
            "디그",
            "드그리",
            "딕그리",
            "디크리",
            "피그리",

            // =====================================================
            // DEGREE - 자연어 표현
            // =====================================================

            "연결중심성",
            "연결중앙성",

            "연결많은사람",
            "연결이많은사람",

            "연결많은노드",
            "연결이많은노드",

            "직접연결많은사람",
            "직접연결이많은사람",

            "연결수많은사람",
            "연결개수많은사람",

            "연결수",
            "연결개수",

            // 순서 명령 추가
            "첫번째",
            "첫번째보여줘",
            "첫번째보여",
            "1번째",
            "1번째보여줘",
        ];


        const isDegree =
            degreeWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isDegree
        ) {

            return dispatchCentralityCommand(
                "SHOW_DEGREE"
            );
        }


        // =====================================================
        // 2. BETWEENNESS
        //
        // Whisper가
        // 비트위니스 / 비트윈니스 / 비트니스 등으로
        // 들을 수 있으므로 여러 형태 허용
        // =====================================================

        const betweennessWords = [
            // =====================================================
            // BETWEENNESS - 정상 표현
            // =====================================================

            "betweenness",

            "비트위니스",
            "비트윈니스",
            "비트위니즈",
            "비트윈니즈",
            "비트니스",

            // =====================================================
            // BETWEENNESS - Whisper 실제 오인식
            // =====================================================

            "피트미니스",
            "피트미니",
            "피트니스",

            "키트비니스",
            "키트위니스",

            "히트위니스",
            "히트윈니스",

            "위니스",
            "윈니스",

            "pca위니스",
            "pca윈니스",

            // ★ 방금 실제로 발생한 오인식
            // 매개 중심성 → 맥의 중심성
            "맥의중심성",
            "맥의중심",

            "매게중심성",
            "매게중심",

            "매계중심성",
            "매계중심",

            // =====================================================
            // BETWEENNESS - 정상 한국어
            // =====================================================

            "매개중심성",
            "매개중심",

            // =====================================================
            // BETWEENNESS - 자연어 표현
            // =====================================================

            "연결자",
            "중간연결자",
            "집단연결자",
            "집단사이연결자",

            "다리역할",
            "다리역할하는사람",

            "매개역할",
            "매개역할하는사람",

            "연결역할",
            "연결역할하는사람",

            "중간역할",
            "중간역할하는사람",

            "다른집단으로넘어가는연결자",

            // 순서 명령 추가
            "두번째",
            "두번째보여줘",
            "두번째보여",
            "2번째",
            "2번째보여줘",
        ];


        const isBetweenness =
            betweennessWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isBetweenness
        ) {

            return dispatchCentralityCommand(
                "SHOW_BETWEENNESS"
            );
        }


        // =====================================================
        // 3. COMMUNITY
        // =====================================================

        const communityWords = [
            "community",
            "커뮤니티",
            "커뮤니티탐지",
            "커뮤니티보여줘",

            "집단",
            "집단보여줘",
            "집단분석",

            "밀집집단",
            "연결집단",

            "서로촘촘하게연결된집단",
            "관계가밀집된집단",

            // 순서 명령 추가
            "세번째",
            "세번째보여줘",
            "세번째보여",
            "3번째",
            "3번째보여줘",
        ];


        const isCommunity =
            communityWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isCommunity
        ) {

            return dispatchCentralityCommand(
                "SHOW_COMMUNITY"
            );
        }


        // =====================================================
        // 4. 이전 페이지
        // Centrality -> RDB VS GRAPH
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "전페이지",
            "전단계",

            "뒤로",
            "돌아가",
            "돌아가줘",

            "rdb",
            "rdbvsgraph",
            "비교페이지",
            "비교화면",
        ];


        const previousIntentWords = [
            "돌아가",
            "돌아가줘",

            "보여줘",
            "보여",

            "가줘",
            "가자",

            "이동",
            "이동해",
            "이동해줘",

            "넘어가",
            "넘어가줘",

            "들어가",
            "들어가줘",
        ];


        const hasPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasPreviousIntent =
            previousIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasPrevious
            &&
            hasPreviousIntent
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "CENTRALITY",
                "PREVIOUS_TO_RDB_GRAPH",
                command
            );


            navigate(
                "/rdb-vs-graph",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }


        // =====================================================
        // 5. 다음 페이지
        // Centrality -> Trend Flow
        // =====================================================

        const nextWords = [
            "다음",
            "다음페이지",
            "다음화면",
            "다음단계",

            "트렌드플로우",
            "트렌드플로",
            "trendflow",
        ];


        const nextIntentWords = [
            "보여줘",
            "보여",

            "넘어가",
            "넘어가줘",

            "이동",
            "이동해",
            "이동해줘",

            "가줘",
            "가자",

            "열어",
            "열어줘",

            "들어가",
            "들어가줘",
        ];


        const hasNext =
            nextWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        const hasNextIntent =
            nextIntentWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasNext
            &&
            hasNextIntent
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "CENTRALITY",
                "NEXT_TO_TREND_FLOW",
                command
            );


            navigate(
                "/trend-flow",
                {
                    state: {
                        simulation:
                        location.state
                            ?.simulation,
                    },
                }
            );


            return true;
        }

        // =========================================================
// TREND IMAGE ANALYSIS 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/trend-image-analysis"
        ) {

            const pageExecuted =
                executeTrendImageAnalysisCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            console.log(
                "[IMAGE ANALYSIS VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
        // GRAPH RAG 현재 페이지 명령
        // =========================================================

        if (
            currentPath ===
            "/trend-graphrag"
        ) {

            const pageExecuted =
                executeTrendGraphRAGCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            console.log(
                "[GRAPHRAG VOICE BLOCKED]",
                command
            );


            return false;
        }


        // =====================================================
        // 이 페이지 명령 아님
        // =====================================================

        console.log(
            "[CENTRALITY VOICE WAIT]",
            command
        );


        return false;
    }

    // =========================================================
// TREND FLOW PAGE COMMAND
//
// 현재 페이지:
// /trend-flow
//
// 패션 선택:
// 스키니진 / 어그부츠 / 로우라이즈 / 떡볶이 코트 / 벨루어
//
// 페이지 이동:
// 이전 -> /centrality
// 다음 -> /trend-image-analysis
// =========================================================

    function executeTrendFlowCommand(
        command
    ) {
        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );

        console.log(
            "[TREND FLOW COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 1. 스키니진
        // =====================================================

        const skinnyWords = [
            "스키니",
            "스키니진",
            "스키니진보여줘",
            "스키니보여줘",
            "스키니진으로",
            "스키니진으로가",
        ];

        if (
            skinnyWords.some(
                (word) =>
                    normalized.includes(word)
            )
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "GO_SKINNY",
                command
            );

            navigate(
                "/trend-flow/skinny"
            );

            return true;
        }


        // =====================================================
        // 2. 어그부츠
        // =====================================================

        const uggWords = [
            "어그",
            "어그부츠",
            "어그부츠보여줘",
            "어그보여줘",
            "어그부츠로",
            "어그부츠로가",
            "ugg",
        ];

        if (
            uggWords.some(
                (word) =>
                    normalized.includes(word)
            )
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "GO_UGG",
                command
            );

            navigate(
                "/trend-flow/ugg"
            );

            return true;
        }


        // =====================================================
        // 3. 로우라이즈
        // =====================================================

        const lowRiseWords = [
            "로우라이즈",
            "로라이즈",
            "로우라이즈보여줘",
            "로라이즈보여줘",
            "로우라이즈로",
            "로우라이즈로가",
        ];

        if (
            lowRiseWords.some(
                (word) =>
                    normalized.includes(word)
            )
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "GO_LOW_RISE",
                command
            );

            navigate(
                "/trend-flow/low-rise"
            );

            return true;
        }


        // =====================================================
        // 4. 떡볶이 코트 / 더플 코트
        // =====================================================

        const duffleWords = [
            "떡볶이",
            "떡볶이코트",
            "더플",
            "더플코트",
            "더플코트보여줘",
            "떡볶이코트보여줘",
        ];

        if (
            duffleWords.some(
                (word) =>
                    normalized.includes(word)
            )
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "GO_DUFFLE",
                command
            );

            navigate(
                "/trend-flow/duffle"
            );

            return true;
        }


        // =====================================================
        // 5. 벨루어
        // =====================================================

        const velourWords = [
            "벨루어",
            "벨루아",
            "벨로어",
            "벨루어트랙수트",
            "벨루어보여줘",
            "트랙수트",
        ];

        if (
            velourWords.some(
                (word) =>
                    normalized.includes(word)
            )
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "GO_VELOUR",
                command
            );

            navigate(
                "/trend-flow/velour"
            );

            return true;
        }


        // =====================================================
        // 6. 이전 페이지 -> CENTRALITY
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "뒤로",
            "중심성",
            "센트럴리티",
            "centrality",
        ];

        const hasPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(word)
            );

        if (
            hasPrevious
        ) {
            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "PREVIOUS_TO_CENTRALITY",
                command
            );

            navigate(
                "/centrality"
            );

            return true;
        }


        // =====================================================
// 7. 다음 페이지 -> 유형 분석
// =====================================================

        const nextWords = [
            "다음",
            "다음페이지",
            "다음화면",
            "다음단계",

            "유형분석",
            "유행유형",
            "유행유형분석",
            "패턴분석",
            "트렌드패턴",
        ];


        const hasNext =
            nextWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            hasNext
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_FLOW",
                "NEXT_TO_TREND_PATTERN",
                command
            );


            navigate(
                "/trend-pattern"
            );


            return true;
        }


        // =====================================================
        // 해당 페이지 명령 아님
        // =====================================================

        console.log(
            "[TREND FLOW VOICE WAIT]",
            command
        );

        return false;
    }

    function executeTrendImageAnalysisCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[IMAGE ANALYSIS COMMAND CHECK]",
            normalized
        );


        function dispatchImageAnalysisCommand(
            type
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-image-analysis-voice-command",
                    {
                        detail: {
                            type,
                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "IMAGE_ANALYSIS",
                type,
                command
            );


            return true;
        }


        // ==========================================
        // 전체 비교
        // ==========================================

        if (
            normalized.includes("전체")
            ||
            normalized.includes("모두")
            ||
            normalized.includes("전부")
            ||
            normalized.includes("전체비교")
        ) {

            return dispatchImageAnalysisCommand(
                "SHOW_ALL"
            );
        }


        // ==========================================
        // 과거 스키니
        // ==========================================

        if (
            normalized.includes("과거")
            ||
            normalized.includes("과거스키니")
            ||
            normalized.includes("예전스키니")
        ) {

            return dispatchImageAnalysisCommand(
                "SHOW_PAST"
            );
        }


        // ==========================================
        // 와이드 전성기
        // ==========================================

        if (
            normalized.includes("와이드")
            ||
            normalized.includes("와이드전성기")
        ) {

            return dispatchImageAnalysisCommand(
                "SHOW_WIDE"
            );
        }


        // ==========================================
// 최근 실루엣
// ==========================================

        if (
            normalized.includes("최근")
            ||
            normalized.includes("최근실루엣")
            ||
            normalized.includes("최근실루")
            ||
            normalized.includes("최근실로엣")
            ||
            normalized.includes("최근실루에트")
            ||
            normalized.includes("최신")
            ||
            normalized.includes("최신실루엣")
            ||
            normalized.includes("요즘실루엣")
            ||
            normalized.includes("모던")
            ||
            normalized.includes("모던실루엣")
            ||
            normalized.includes("현대")
            ||
            normalized.includes("현대실루엣")
            ||
            normalized.includes("실루엣")
        ) {

            return dispatchImageAnalysisCommand(
                "SHOW_MODERN"
            );
        }


        // ==========================================
// 이전 페이지 -> Trend Pattern
// ==========================================

        if (
            normalized.includes(
                "이전페이지"
            )
            ||
            normalized.includes(
                "이전화면"
            )
            ||
            normalized.includes(
                "뒤로"
            )
            ||
            normalized.includes(
                "유형분석"
            )
            ||
            normalized.includes(
                "유행유형"
            )
            ||
            normalized.includes(
                "트렌드패턴"
            )
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "IMAGE_ANALYSIS",
                "PREVIOUS_TO_TREND_PATTERN",
                command
            );


            navigate(
                "/trend-pattern"
            );


            return true;
        }




        // ==========================================
        // 다음 페이지 -> GraphRAG
        // ==========================================

        if (
            normalized.includes("다음페이지")
            ||
            normalized.includes("다음화면")
            ||
            normalized.includes("다음단계")
            ||
            normalized.includes("그래프래그")
            ||
            normalized.includes("graphrag")
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "IMAGE_ANALYSIS",
                "NEXT_TO_GRAPHRAG",
                command
            );


            navigate(
                "/trend-graphrag"
            );


            return true;
        }


        console.log(
            "[IMAGE ANALYSIS VOICE WAIT]",
            command
        );


        return false;
    }

    // =========================================================
// TREND PATTERN PAGE COMMAND
//
// /trend-pattern
//
// 지속형
// 급등·소멸형
// 재등장형
//
// 이전 -> /trend-flow
// 다음 -> /trend-image-analysis
// =========================================================

    function executeTrendPatternCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~·]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[TREND PATTERN COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 1. 지속형
        // =====================================================

        const steadyWords = [
            "지속형",
            "지속",
            "지속형보여줘",
            "어그",
            "어그부츠",
            "ugg",
        ];


        if (
            steadyWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            )
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-pattern-voice-command",
                    {
                        detail: {
                            type:
                                "SELECT_STEADY",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_PATTERN",
                "SELECT_STEADY",
                command
            );


            return true;
        }


        // =====================================================
        // 2. 급등 · 소멸형
        // =====================================================

        const spikeWords = [
            "급등소멸형",
            "급등소멸",
            "급등형",
            "급등",
            "소멸형",
            "벨루어",
            "벨로어",
            "벨루아",
            "펠루어",
            "트랙수트",
            "급등소멸령",
            "소멸령",
            "두번째",
            "두번"
        ];


        if (
            spikeWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            )
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-pattern-voice-command",
                    {
                        detail: {
                            type:
                                "SELECT_SPIKE",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_PATTERN",
                "SELECT_SPIKE",
                command
            );


            return true;
        }


        // =====================================================
        // 3. 재등장형
        // =====================================================

        const revivalWords = [
            "재등장형",
            "재등장",
            "제등장형",
            "제등장",
            "재유행",
            "로우라이즈",
            "로라이즈",
        ];


        if (
            revivalWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            )
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-pattern-voice-command",
                    {
                        detail: {
                            type:
                                "SELECT_REVIVAL",

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_PATTERN",
                "SELECT_REVIVAL",
                command
            );


            return true;
        }


        // =====================================================
        // 4. 이전 -> Trend Flow
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "뒤로",
            "트렌드플로우",
            "그래프로돌아가",
        ];


        if (
            previousWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            )
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_PATTERN",
                "PREVIOUS_TO_TREND_FLOW",
                command
            );


            navigate(
                "/trend-flow"
            );


            return true;
        }


        // =====================================================
        // 5. 다음 -> PCA / 이미지 분석
        // =====================================================

        const nextWords = [
            "다음",
            "다음페이지",
            "다음화면",
            "다음분석",
            "pca",
            "피씨에이",
            "피시에이",
            "실루엣분석",
            "이미지분석",
        ];


        if (
            nextWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            )
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_PATTERN",
                "NEXT_TO_IMAGE_ANALYSIS",
                command
            );


            navigate(
                "/trend-image-analysis"
            );


            return true;
        }


        console.log(
            "[TREND PATTERN VOICE WAIT]",
            command
        );


        return false;
    }

    // =========================================================
    // GRAPH RAG PAGE COMMAND
    // =========================================================

    function executeTrendGraphRAGCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[GRAPHRAG COMMAND CHECK]",
            normalized
        );


        function dispatchGraphRAGCommand(
            question
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "trend-graphrag-voice-command",
                    {
                        detail: {
                            type:
                                "ANALYZE_TREND",

                            question,

                            command,
                        },
                    }
                )
            );


            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPHRAG",
                "ANALYZE_TREND",
                question,
                command
            );


            return true;
        }


        // =====================================================
        // 1. 스키니진
        // =====================================================

        if (
            normalized.includes("스키니")
            ||
            normalized.includes("스키니진")
        ) {

            return dispatchGraphRAGCommand(
                "스키니진은 다시 유행하고 있어?"
            );
        }


        // =====================================================
        // 2. 어그부츠
        // =====================================================

        if (
            normalized.includes("어그")
            ||
            normalized.includes("어그부츠")
        ) {

            return dispatchGraphRAGCommand(
                "어그부츠는 왜 다시 등장했어?"
            );
        }


        // =====================================================
        // 3. 벨루어 트랙수트
        // =====================================================

        if (
            normalized.includes("벨루어")
            ||
            normalized.includes("트랙수트")
        ) {

            return dispatchGraphRAGCommand(
                "벨루어 트랙수트는 왜 다시 등장했어?"
            );
        }


        // =====================================================
        // 4. 떡볶이 코트
        // =====================================================

        if (
            normalized.includes("떡볶이")
            ||
            normalized.includes("떡볶이코트")
            ||
            normalized.includes("더플")
            ||
            normalized.includes("더플코트")
        ) {

            return dispatchGraphRAGCommand(
                "떡볶이 코트는 다시 유행할 가능성이 있어?"
            );
        }


        // =====================================================
        // 5. 로우라이즈
        // =====================================================

        if (
            normalized.includes("로우라이즈")
            ||
            normalized.includes("로라이즈")
        ) {

            return dispatchGraphRAGCommand(
                "로우라이즈는 다시 유행하고 있어?"
            );
        }


        // =====================================================
        // 6. 이전 페이지 -> 이미지 분석
        // =====================================================

        if (
            normalized.includes("이전페이지")
            ||
            normalized.includes("이전화면")
            ||
            normalized.includes("뒤로")
            ||
            normalized.includes("이미지분석")
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPHRAG",
                "PREVIOUS_TO_IMAGE_ANALYSIS",
                command
            );


            navigate(
                "/trend-image-analysis"
            );


            return true;
        }


        // =====================================================
        // 7. 다음 페이지 -> 프로젝트 마무리
        // =====================================================

        if (
            normalized.includes("다음페이지")
            ||
            normalized.includes("다음화면")
            ||
            normalized.includes("다음단계")
            ||
            normalized.includes("마무리")
            ||
            normalized.includes("프로젝트마무리")
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "GRAPHRAG",
                "NEXT_TO_INSIGHT",
                command
            );


            navigate(
                "/trend-insight"
            );


            return true;
        }


        // =====================================================
        // GraphRAG 페이지에서는 다른 전역 명령으로 보내지 않음
        // =====================================================

        console.log(
            "[GRAPHRAG VOICE WAIT]",
            command
        );


        return false;
    }

    // =========================================================
// TREND INSIGHT PAGE COMMAND
// =========================================================

    function executeTrendInsightCommand(
        command
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(
                    /[.,!?~]/g,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        console.log(
            "[TREND INSIGHT COMMAND CHECK]",
            normalized
        );


        // =====================================================
        // 1. 이전 페이지 -> GraphRAG
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "뒤로",
            "돌아가",
            "돌아가줘",

            "그래프래그",
            "그래프rag",
            "graphrag",
        ];


        const isPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isPrevious
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_INSIGHT",
                "PREVIOUS_TO_GRAPHRAG",
                command
            );


            navigate(
                "/trend-graphrag"
            );


            return true;
        }


        // =====================================================
        // 2. 처음으로 -> HOME
        // =====================================================

        const homeWords = [
            "처음",
            "처음으로",
            "처음화면",
            "첫화면",

            "홈",
            "홈으로",
            "홈화면",

            "메인",
            "메인으로",
            "메인화면",

            "시작화면",
            "처음부터",
        ];


        const isHome =
            homeWords.some(
                (word) =>
                    normalized.includes(
                        word
                    )
            );


        if (
            isHome
        ) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_INSIGHT",
                "GO_HOME",
                command
            );


            navigate(
                "/"
            );


            return true;
        }


        console.log(
            "[TREND INSIGHT VOICE WAIT]",
            command
        );


        return false;
    }

    function executeCommand(
        command
    ) {

        const currentPath =
            pathnameRef.current;


        console.log(
            "[VOICE EXECUTE]",
            command
        );


        console.log(
            "[VOICE CURRENT PATH]",
            currentPath
        );


        // =================================================
        // 현재 페이지 명령을 가장 먼저 처리
        // =================================================

        if (
            currentPath ===
            "/trend-intro"
        ) {

            const pageExecuted =
                executeTrendIntroCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }
        }


        // =========================================================
// TREND CITY 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/trend-city"
        ) {

            const pageExecuted =
                executeTrendCityCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // 중요
            //
            // Trend City 시뮬레이션 페이지에서는
            // 현재 페이지 전용 명령이 아닌 음성을
            // Global Command로 넘기지 않는다.
            //
            // 예:
            // 스키니진
            // 어그부츠
            // RDB
            // GraphRAG
            //
            // 같은 단어가 Whisper 오인식으로 들어와도
            // 다른 페이지로 이동하지 않게 차단
            // =====================================================

            console.log(
                "[TREND CITY VOICE BLOCKED]",
                command
            );


            return false;
        }

        // =========================================================
        // GRAPH STRUCTURE 현재 페이지 명령
        // =========================================================

        if (
            currentPath ===
            "/graph-structure"
        ) {

            const pageExecuted =
                executeGraphStructureCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }
        }


        // =========================================================
        // CYPHER 현재 페이지 명령
        // =========================================================

        // =========================================================
        // CYPHER 현재 페이지 명령
        // =========================================================

        if (
            currentPath ===
            "/cypher"
        ) {

            const pageExecuted =
                executeCypherCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // 중요
            //
            // Cypher 페이지에서는
            // 인식 실패한 음성을 Global Command로 넘기지 않는다.
            //
            // 예:
            // "벨루어 트랙수트"
            // "스키니진"
            // 등의 오인식 때문에 다른 패션 페이지로
            // 갑자기 이동하는 현상 방지
            // =====================================================

            console.log(
                "[CYPHER VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
        // PATH / TRAVERSAL 현재 페이지 명령
        // =========================================================

        if (
            currentPath ===
            "/path-traversal"
        ) {

            const pageExecuted =
                executePathTraversalCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // Path 페이지에서도
            // 인식 실패한 문장을 Global Command로 넘기지 않는다.
            //
            // 패션명이나 다른 단어를 잘못 인식해서
            // 갑자기 다른 페이지로 이동하는 현상 방지
            // =====================================================

            console.log(
                "[PATH VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
// RDB VS GRAPH 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/rdb-vs-graph"
        ) {

            const pageExecuted =
                executeRdbVsGraphCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // 중요
            //
            // RDB VS GRAPH 페이지에서는
            // 페이지 전용 명령으로 인식되지 않은 음성을
            // Global Command로 넘기지 않는다.
            //
            // 발표 중 "RDB", "GraphDB", "관계형 DB" 등의
            // 단어 때문에 갑자기 다른 페이지로 이동하는 것 방지
            // =====================================================

            console.log(
                "[RDB VS GRAPH VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
        // CENTRALITY 현재 페이지 명령
        // =========================================================

        if (
            currentPath ===
            "/centrality"
        ) {

            console.log(
                "[CENTRALITY ROUTE ENTER]",
                command
            );


            const pageExecuted =
                executeCentralityCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // Centrality 페이지에서는
            // 인식되지 않은 음성을 Global Command로 넘기지 않는다.
            // =====================================================

            console.log(
                "[CENTRALITY VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
// TREND DETAIL 현재 페이지 명령
// =========================================================

        if (
            currentPath.startsWith(
                "/trend-flow/"
            )
        ) {

            const pageExecuted =
                executeTrendDetailCommand(
                    command,
                    currentPath
                );


            if (
                pageExecuted
            ) {
                return true;
            }


            // 상세 페이지에서는
            // 잘못 들은 음성이 Global Command로 넘어가서
            // 다른 패션/페이지로 이동하지 않게 차단
            console.log(
                "[TREND DETAIL VOICE WAIT]",
                command
            );


            return false;
        }

        // =========================================================
// TREND FLOW 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/trend-flow"
        ) {
            const pageExecuted =
                executeTrendFlowCommand(
                    command
                );

            if (
                pageExecuted
            ) {
                return true;
            }


            // Trend Flow에서도 인식 실패 문장을
            // Global Command로 넘기지 않는다.
            console.log(
                "[TREND FLOW VOICE WAIT]",
                command
            );

            return false;
        }

        // =========================================================
// TREND PATTERN 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/trend-pattern"
        ) {

            const pageExecuted =
                executeTrendPatternCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            console.log(
                "[TREND PATTERN VOICE BLOCKED]",
                command
            );


            return false;
        }

        // =========================================================
// TREND IMAGE ANALYSIS 현재 페이지 명령
// =========================================================

        if (
            currentPath ===
            "/trend-image-analysis"
        ) {

            const pageExecuted =
                executeTrendImageAnalysisCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // =====================================================
            // 중요
            //
            // 이미지 분석 페이지에서 인식하지 못한 음성은
            // Global Command로 넘기지 않는다.
            //
            // 예:
            // 어그부츠
            // 스키니진
            // 떡볶이코트
            //
            // 같은 단어가 잘못 인식되어
            // 다른 트렌드 페이지로 이동하는 현상 방지
            // =====================================================

            console.log(
                "[IMAGE ANALYSIS VOICE BLOCKED]",
                command
            );


            return false;
        }

        // =========================================================
// GRAPH RAG 현재 페이지 명령
// 반드시 GLOBAL COMMAND보다 먼저 실행
// =========================================================

        if (
            currentPath ===
            "/trend-graphrag"
        ) {

            const pageExecuted =
                executeTrendGraphRAGCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            // GraphRAG 화면에서는
            // 실패한 음성을 Global Command로 넘기지 않는다.
            console.log(
                "[GRAPHRAG VOICE BLOCKED]",
                command
            );


            return false;
        }

        // =========================================================
// TREND INSIGHT 현재 페이지 명령
// 반드시 GLOBAL COMMAND보다 먼저 실행
// =========================================================

        if (
            currentPath ===
            "/trend-insight"
        ) {

            const pageExecuted =
                executeTrendInsightCommand(
                    command
                );


            if (
                pageExecuted
            ) {

                return true;
            }


            console.log(
                "[TREND INSIGHT VOICE BLOCKED]",
                command
            );


            return false;
        }

        // =================================================
        // GLOBAL COMMAND
        // =================================================

        const detectedCommand =
            detectGlobalCommand(
                command
            );


        console.log(
            "[VOICE DETECTED]",
            detectedCommand
        );


        if (
            !detectedCommand
        ) {

            return false;
        }


        const type =
            detectedCommand.type;


        // =================================================
        // START
        // =================================================

        if (
            type ===
            "START_PRESENTATION"
        ) {

            if (
                currentPath === "/"
            ) {

                navigate(
                    "/trend-intro"
                );
            }


            return true;
        }


        // =================================================
        // TREND FLOW
        // =================================================

        if (
            type ===
            "GO_TREND_FLOW"
        ) {

            navigate(
                "/trend-flow"
            );

            return true;
        }


        // =================================================
        // GRAPH STRUCTURE
        // =================================================

        if (
            type ===
            "GO_GRAPH_STRUCTURE"
        ) {

            navigate(
                "/graph-structure"
            );

            return true;
        }


        // =================================================
        // CYPHER
        // =================================================

        if (
            type ===
            "GO_CYPHER"
        ) {

            navigate(
                "/cypher"
            );

            return true;
        }


        // =================================================
        // RDB VS GRAPH
        // =================================================

        if (
            type ===
            "GO_RDB_VS_GRAPH"
        ) {

            navigate(
                "/rdb-vs-graph"
            );

            return true;
        }


        // =================================================
        // CENTRALITY
        // =================================================

        if (
            type ===
            "GO_CENTRALITY"
        ) {

            navigate(
                "/centrality"
            );

            return true;
        }


        // =================================================
        // GRAPH RAG
        // =================================================

        if (
            type ===
            "GO_GRAPHRAG"
        ) {

            navigate(
                "/trend-graphrag"
            );

            return true;
        }


        // =================================================
        // TREND DETAIL
        // =================================================

        if (
            type ===
            "GO_SKINNY"
        ) {

            navigate(
                "/trend-flow/skinny"
            );

            return true;
        }


        if (
            type ===
            "GO_UGG"
        ) {

            navigate(
                "/trend-flow/ugg"
            );

            return true;
        }


        if (
            type ===
            "GO_LOW_RISE"
        ) {

            navigate(
                "/trend-flow/low-rise"
            );

            return true;
        }


        if (
            type ===
            "GO_DUFFLE"
        ) {

            navigate(
                "/trend-flow/duffle"
            );

            return true;
        }


        if (
            type ===
            "GO_VELOUR"
        ) {

            navigate(
                "/trend-flow/velour"
            );

            return true;
        }


        // =================================================
        // NEXT
        // =================================================

        if (
            type ===
            "NEXT_PAGE"
        ) {

            const route =
                getNextRoute(
                    currentPath
                );


            if (
                route
            ) {

                navigate(
                    route
                );
            }


            return true;
        }


        // =================================================
        // PREVIOUS
        // =================================================

        if (
            type ===
            "PREVIOUS_PAGE"
        ) {

            const route =
                getPreviousRoute(
                    currentPath
                );


            if (
                route
            ) {

                navigate(
                    route
                );
            }


            return true;
        }


        // =================================================
        // HOME
        // =================================================

        if (
            type ===
            "GO_HOME"
        ) {

            navigate(
                "/"
            );

            return true;
        }


        // =================================================
        // 아직 route 미연결
        // =================================================

        if (
            type ===
            "GO_SIMULATION"
            ||
            type ===
            "GO_PCA"
        ) {

            console.log(
                "[VOICE ROUTE NOT CONNECTED]",
                type
            );

            return false;
        }


        return false;
    }

    // =========================================================
// TREND DETAIL PAGE COMMAND
//
// /trend-flow/skinny
// /trend-flow/ugg
// /trend-flow/velour
// /trend-flow/low-rise
// /trend-flow/duffle
// =========================================================

    function executeTrendDetailCommand(
        command,
        currentPath
    ) {

        const normalized =
            command
                .toLowerCase()
                .replace(/[.,!?~]/g, "")
                .replace(/\s+/g, "");


        console.log(
            "[TREND DETAIL COMMAND CHECK]",
            currentPath,
            normalized
        );


        // =====================================================
        // 이전 화면 -> /trend-flow
        // =====================================================

        const previousWords = [
            "이전",
            "이전페이지",
            "이전화면",
            "뒤로",
            "돌아가",
            "돌아가줘",
            "이전으로",
            "이전으로돌아가",
            "이전으로돌아가줘",
            "패션목록",
            "트렌드플로우",
        ];


        const isPrevious =
            previousWords.some(
                (word) =>
                    normalized.includes(word)
            );


        if (isPrevious) {

            console.log(
                "[VOICE PAGE COMMAND]",
                "TREND_DETAIL",
                "BACK_TO_TREND_FLOW",
                command
            );

            navigate(
                "/trend-flow"
            );

            return true;
        }


        // =====================================================
        // 현재 패션 확인
        // =====================================================

        let trendKey = null;

        if (
            currentPath ===
            "/trend-flow/skinny"
        ) {
            trendKey = "SKINNY";
        }

        else if (
            currentPath ===
            "/trend-flow/ugg"
        ) {
            trendKey = "UGG";
        }

        else if (
            currentPath ===
            "/trend-flow/velour"
        ) {
            trendKey = "VELOUR";
        }

        else if (
            currentPath ===
            "/trend-flow/low-rise"
        ) {
            trendKey = "LOW_RISE";
        }

        else if (
            currentPath ===
            "/trend-flow/duffle"
        ) {
            trendKey = "DUFFLE";
        }


        if (!trendKey) {
            return false;
        }

        // =====================================================
        // 스키니진 상세 -> 다음 페이지(유행 유형)
        // =====================================================

        if (
            trendKey === "SKINNY"
        ) {

            const nextPageWords = [
                "다음페이지",
                "다음페이지로이동",
                "다음페이지로이동해줘",
                "다음페이지로넘어가",
                "다음페이지로넘어가줘",
                "다음화면",
                "다음화면보여줘",
            ];


            const isNextPage =
                nextPageWords.some(
                    (word) =>
                        normalized.includes(
                            word
                        )
                );


            if (
                isNextPage
            ) {

                console.log(
                    "[VOICE PAGE COMMAND]",
                    "TREND_DETAIL",
                    "SKINNY",
                    "NEXT_TO_TREND_PATTERN",
                    command
                );


                navigate(
                    "/trend-pattern"
                );


                return true;
            }
        }

        // =====================================================
// 상세 페이지 순차 탐색
//
// SKINNY / UGG만 사용
// =====================================================

        const sequenceEnabled =
            trendKey === "SKINNY"
            ||
            trendKey === "UGG";


        if (sequenceEnabled) {

            /* =============================================
               전체 그래프
            ============================================= */

            const showAllWords = [
                "전체",
                "전체보여줘",
                "전체보여",
                "전체보기",

                "모두",
                "모두보여줘",
                "모두보여",

                "전부",
                "전부보여줘",
                "전부보여",

                "전체그래프",
                "전체그래프보여줘",
            ];


            const isShowAll =
                showAllWords.some(
                    (word) =>
                        normalized.includes(
                            word
                        )
                );


            if (isShowAll) {

                window.dispatchEvent(
                    new CustomEvent(
                        "trend-detail-voice-command",
                        {
                            detail: {
                                type:
                                    "SHOW_ALL",

                                command,
                            },
                        }
                    )
                );


                console.log(
                    "[VOICE PAGE COMMAND]",
                    "TREND_DETAIL",
                    trendKey,
                    "SHOW_ALL",
                    command
                );


                return true;
            }


            /* =============================================
   첫 번째 핵심 노드
   "첫 번째 노드 보여줘"
   "대표 노드 보여줘"
============================================= */

            const firstNodeWords = [
                "첫번째",
                "첫번째노드",
                "첫번째노드보여줘",
                "첫번째노드보여",
                "첫노드",
                "첫노드보여줘",
                "첫노드보여",

                "대표노드",
                "대표노드보여줘",
                "대표노드보여",

                "처음노드",
                "처음노드보여줘",
                "처음부터",
            ];


            const isFirstNode =
                firstNodeWords.some(
                    (word) =>
                        normalized.includes(
                            word
                        )
                );


            if (isFirstNode) {

                window.dispatchEvent(
                    new CustomEvent(
                        "trend-detail-voice-command",
                        {
                            detail: {
                                type:
                                    "FIRST_NODE",

                                command,
                            },
                        }
                    )
                );


                console.log(
                    "[VOICE PAGE COMMAND]",
                    "TREND_DETAIL",
                    trendKey,
                    "FIRST_NODE",
                    command
                );


                return true;
            }


            /* =============================================
               다음 핵심 노드
            ============================================= */

            /* =============================================
               다음 핵심 노드
            ============================================= */

            const nextNodeWords = [

                // 정상 인식
                "다음",
                "다음보여줘",
                "다음보여",
                "다음노드",
                "다음노드보여줘",
                "다음거",
                "다음거보여줘",
                "다음으로",
                "다음으로넘어가",
                "다음으로넘어가줘",

                // Whisper 오인식 대응
                "다우",
                "다운",
                "다움",
                "다믐",
                "다은",
            ];


            const isNextNode =
                nextNodeWords.some(
                    (word) =>
                        normalized.includes(
                            word
                        )
                );


            if (isNextNode) {

                window.dispatchEvent(
                    new CustomEvent(
                        "trend-detail-voice-command",
                        {
                            detail: {
                                type:
                                    "NEXT_NODE",

                                command,
                            },
                        }
                    )
                );


                console.log(
                    "[VOICE PAGE COMMAND]",
                    "TREND_DETAIL",
                    trendKey,
                    "NEXT_NODE",
                    command
                );


                return true;
            }


            /* =============================================
               이전 핵심 노드
            ============================================= */

            const previousNodeWords = [
                "이전",
                "이전노드",
                "이전노드보여줘",
                "이전거",
                "이전거보여줘",
                "전노드",
                "전노드보여줘",
                "앞에거",
                "앞에거보여줘",
            ];


            const isPreviousNode =
                previousNodeWords.some(
                    (word) =>
                        normalized.includes(
                            word
                        )
                );


            if (isPreviousNode) {

                window.dispatchEvent(
                    new CustomEvent(
                        "trend-detail-voice-command",
                        {
                            detail: {
                                type:
                                    "PREVIOUS_NODE",

                                command,
                            },
                        }
                    )
                );


                console.log(
                    "[VOICE PAGE COMMAND]",
                    "TREND_DETAIL",
                    trendKey,
                    "PREVIOUS_NODE",
                    command
                );


                return true;
            }
        }


        // =====================================================
        // 25개 핵심 노드
        // =====================================================

        const nodeCommands = {

            SKINNY: [

                {
                    nodeName: "Hedi Slimane",
                    words: [
                        "헤디슬리먼",
                        "헤디슬리만",
                        "헤디슬리맨",
                        "헤디",
                        "슬리먼",
                    ],
                },

                {
                    nodeName: "소녀시대",
                    words: [
                        "소녀시대",
                        "소시",
                    ],
                },

                {
                    nodeName: "SPAO",
                    words: [
                        "스파오",
                        "spao",
                    ],
                },

                {
                    nodeName: "코르티스",
                    words: [
                        "코르티스",
                        "코티스",
                        "커티스",
                        "코트커티스",
                        "코트커티스보여줘",
                    ],
                },

                {
                    nodeName: "Modern Slim Silhouette",
                    words: [
                        "모던슬림실루엣",
                        "모던슬림",
                        "오던슬림",
                        "모던실루엣",
                        "슬림실루엣",
                        "현대적재해석",
                    ],
                },
            ],


            VELOUR: [

                {
                    nodeName: "Paris Hilton",
                    words: [
                        "패리스힐튼",
                        "파리스힐튼",
                        "패리스",
                        "힐튼",
                    ],
                },

                {
                    nodeName: "Juicy Couture",
                    words: [
                        "쥬시꾸뛰르",
                        "주시꾸뛰르",
                        "쥬시쿠튀르",
                        "쥬시",
                        "꾸뛰르",
                    ],
                },

                {
                    nodeName: "One-Mile Wear",
                    words: [
                        "원마일웨어",
                        "원마일",
                        "원마일룩",
                    ],
                },

                {
                    nodeName: "Jennie",
                    words: [
                        "제니",
                        "jennie",
                    ],
                },

                {
                    nodeName: "Y2K",
                    words: [
                        "와이투케이",
                        "y2k",
                        "와이투케이패션",
                    ],
                },
            ],


            UGG: [

                {
                    nodeName: "임수정",
                    words: [
                        "임수정",
                    ],
                },

                {
                    nodeName: "소연",
                    words: [
                        "소연",
                        "전소연",
                    ],
                },

                {
                    nodeName: "10~20대",
                    words: [
                        "십이십대",
                        "십대이십대",
                        "10대20대",
                        "1020대",
                        "젊은소비층",
                    ],
                },

                {
                    nodeName: "연준",
                    words: [
                        "연준",
                        "투바투연준",
                    ],
                },

                {
                    nodeName: "All-Season Fashion",
                    words: [
                        "올시즌패션",
                        "올시즌",
                        "사계절패션",
                        "사계절",
                    ],
                },
            ],


            LOW_RISE: [

                {
                    nodeName: "Y2K",
                    words: [
                        "와이투케이",
                        "y2k",
                    ],
                },

                {
                    nodeName: "Miu Miu SS22",
                    words: [
                        "미우미우에스에스이십이",
                        "미우미우ss22",
                        "미우미우컬렉션",
                        "미우미우런웨이",
                        "에스에스이십이",
                    ],
                },

                {
                    nodeName: "Miu Miu",
                    words: [
                        "미우미우",
                        "미우",
                    ],
                },

                {
                    nodeName: "Zigzag",
                    words: [
                        "지그재그",
                        "zigzag",
                    ],
                },

                {
                    nodeName: "Low-Rise Micro Skirt",
                    words: [
                        "로우라이즈마이크로스커트",
                        "마이크로스커트",
                        "마이크로미니스커트",
                        "로우라이즈스커트",
                    ],
                },
            ],


            DUFFLE: [

                {
                    nodeName: "School Uniform",
                    words: [
                        "스쿨유니폼",
                        "스쿨유니폼",
                        "교복",
                        "학생복",
                    ],
                },

                {
                    nodeName: "강다니엘",
                    words: [
                        "강다니엘",
                        "다니엘",
                    ],
                },

                {
                    nodeName: "Preppy Style",
                    words: [
                        "프레피스타일",
                        "프레피",
                        "프래피",
                    ],
                },

                {
                    nodeName: "Oversized Duffle Coat",
                    words: [
                        "오버사이즈더플코트",
                        "오버사이즈더플",
                        "오버핏더플코트",
                        "오버사이즈떡볶이코트",
                    ],
                },

                {
                    nodeName: "Recto",
                    words: [
                        "렉토",
                        "recto",
                    ],
                },
            ],
        };


        const currentNodes =
            nodeCommands[
                trendKey
                ] || [];


        const matchedNode =
            currentNodes.find(
                (item) =>
                    item.words.some(
                        (word) =>
                            normalized.includes(
                                word
                            )
                    )
            );


        if (!matchedNode) {

            console.log(
                "[TREND DETAIL VOICE WAIT]",
                trendKey,
                command
            );

            return false;
        }


        // =====================================================
        // TrendDetailPage로 선택할 노드 전달
        // =====================================================

        window.dispatchEvent(
            new CustomEvent(
                "trend-detail-voice-command",
                {
                    detail: {
                        nodeName:
                        matchedNode.nodeName,

                        command,
                    },
                }
            )
        );


        console.log(
            "[VOICE PAGE COMMAND]",
            "TREND_DETAIL",
            trendKey,
            matchedNode.nodeName,
            command
        );


        return true;
    }



    // =====================================================
    // MERGED COMMAND EXECUTION
    // =====================================================

    function tryExecuteMergedCommand() {

        const merged =
            getMergedCommand();


        if (
            !merged
        ) {

            return false;
        }


        console.log(
            "[VOICE MERGED COMMAND]",
            merged
        );


        const executed =
            executeCommand(
                merged
            );


        if (
            !executed
        ) {

            console.log(
                "[VOICE WAIT MORE]",
                merged
            );

            return false;
        }


        console.log(
            "[VOICE ACCEPTED]",
            merged
        );


        clearWakeState();
        clearCommandBuffer();


        showCommand(
            `${WAKE_WORD_LABEL} · ${merged}`
        );


        return true;
    }


    // =====================================================
    // COMMAND PART
    // =====================================================

    function addCommandPart(
        text
    ) {

        const part =
            text
                ?.trim();


        if (
            !part
        ) {

            return;
        }


        commandPartsRef.current.push(
            part
        );


        console.log(
            "[VOICE COMMAND PART]",
            part
        );


        console.log(
            "[VOICE COMMAND BUFFER]",
            getMergedCommand()
        );


        setStatus(
            "command"
        );


        setDisplayText(
            `${WAKE_WORD_LABEL} · ${getMergedCommand()}`
        );


        // 이전 실행 예약 취소
        if (
            mergeTimerRef.current
        ) {

            window.clearTimeout(
                mergeTimerRef.current
            );
        }


        // =====================================================
        // 중요
        //
        // Whisper가 문장을 여러 조각으로 나눠서 보내므로
        // 조각 하나가 들어올 때마다 바로 실행하지 않는다.
        //
        // 마지막 음성이 들어온 뒤 COMMAND_MERGE_TIME 동안
        // 추가 음성이 없을 때 전체 문장을 한 번만 실행한다.
        // =====================================================

        mergeTimerRef.current =
            window.setTimeout(
                () => {

                    console.log(
                        "[VOICE MERGE COMPLETE]",
                        getMergedCommand()
                    );


                    tryExecuteMergedCommand();

                },
                COMMAND_MERGE_TIME
            );
    }


    // =========================================================
// WHISPER HALLUCINATION FILTER
// - 무음/잡음에서 같은 단어를 반복 생성하는 현상 제거
//
// 예:
// "RDB, RDB, RDB, RDB..."
// "네 네 네 네 네..."
// =========================================================

    function isWhisperHallucination(text = "") {

        const cleaned =
            text
                .replace(/[.,!?~]/g, " ")
                .replace(/\s+/g, " ")
                .trim();


        if (!cleaned) {
            return true;
        }


        const words =
            cleaned.split(" ");


        // 너무 긴 STT 결과
        if (words.length >= 20) {

            const counts = {};

            for (const word of words) {

                counts[word] =
                    (counts[word] || 0) + 1;
            }


            const maxCount =
                Math.max(
                    ...Object.values(counts)
                );


            // 전체 단어의 60% 이상이 같은 단어면
            // Whisper 반복 환각으로 판단
            if (
                maxCount /
                words.length
                >= 0.6
            ) {

                return true;
            }
        }


        // 연속으로 같은 단어가 5번 이상 반복
        let repeatCount = 1;

        for (
            let i = 1;
            i < words.length;
            i++
        ) {

            if (
                words[i] ===
                words[i - 1]
            ) {

                repeatCount++;

                if (
                    repeatCount >= 5
                ) {

                    return true;
                }

            } else {

                repeatCount = 1;
            }
        }


        return false;
    }

    // =====================================================
    // TRANSCRIPT
    // =====================================================

    function handleTranscript(
        rawText
    ) {

        const text =
            rawText
                ?.trim();


        if (
            !text
        ) {

            return;
        }


        console.log(
            "[WHISPER TEXT]",
            text
        );


        // =====================================================
        // Whisper 반복 환각 제거
        // =====================================================

        if (
            isWhisperHallucination(
                text
            )
        ) {

            console.log(
                "[WHISPER HALLUCINATION IGNORED]",
                text
            );


            return;
        }


        // =================================================
        // 이미 콩을 인식한 상태
        // =================================================

        if (
            waitingForCommandRef.current
        ) {

            // -------------------------------------------------
            // 또 콩이 들어온 경우
            // -------------------------------------------------

            if (
                hasWakeWord(
                    text
                )
            ) {

                const afterWake =
                    extractVoiceCommand(
                        text
                    );


                // 콩만 또 말함
                if (
                    !afterWake
                ) {

                    console.log(
                        "[VOICE WAKE REFRESH]"
                    );


                    activateWakeState();

                    return;
                }


                // 콩 + 명령
                addCommandPart(
                    afterWake
                );

                return;
            }


            // -------------------------------------------------
            // 콩 다음 STT 결과는 명령 후보로 누적
            // -------------------------------------------------

            addCommandPart(
                text
            );

            return;
        }


        // =================================================
        // 평상시에는 콩이 없으면 무조건 무시
        // =================================================

        if (
            !hasWakeWord(
                text
            )
        ) {

            console.log(
                "[VOICE IGNORE - NO WAKE WORD]",
                text
            );

            return;
        }


        // =================================================
        // 콩 발견
        // =================================================

        const command =
            extractVoiceCommand(
                text
            );


        // 콩만 들음
        if (
            !command
        ) {

            activateWakeState();

            return;
        }


        // 콩 + 명령이 한 STT에 같이 들어옴
        activateWakeState();


        addCommandPart(
            command
        );
    }


    // =====================================================
    // TEST
    // =====================================================

    useEffect(
        () => {

            window.testWakeVoice =
                (text) => {

                    console.log(
                        "[TEST WAKE VOICE]",
                        text
                    );


                    handleTranscript(
                        text
                    );
                };


            window.testVoiceCommand =
                (text) => {

                    console.log(
                        "[TEST VOICE COMMAND]",
                        text
                    );


                    executeCommand(
                        text
                    );
                };


            console.log(
                "[VOICE TEST READY]"
            );


            return () => {

                delete window
                    .testWakeVoice;

                delete window
                    .testVoiceCommand;
            };

        },
        []
    );


    // =====================================================
    // WHISPER
    //
    // 이전 방식:
    // 처리 중이면 새 음성을 바로 버림
    //
    // 현재 방식:
    // 처리 중이면 "가장 최신 음성 하나"만 저장
    //
    // A 처리 중
    // B 들어옴 → pending B
    // C 들어옴 → pending C로 교체
    //
    // A 완료
    // → 가장 최신 C 처리
    //
    // 오래된 음성 큐가 쌓이지 않으면서
    // 명령을 통째로 잃어버릴 가능성을 줄임
    // =====================================================

    async function processAudio(
        audioBlob
    ) {

        if (
            !audioBlob
            ||
            audioBlob.size < 1000
        ) {

            return;
        }


        if (
            transcribingRef.current
        ) {

            pendingAudioRef.current =
                audioBlob;


            console.log(
                "[WHISPER PENDING] latest audio saved"
            );


            return;
        }


        transcribingRef.current =
            true;


        try {

            const result =
                await transcribeVoice(
                    audioBlob
                );


            handleTranscript(
                result?.text
                ||
                ""
            );

        } catch (
            error
            ) {

            console.error(
                "[WHISPER ERROR]",
                error
            );


            setStatus(
                "error"
            );


            setDisplayText(
                error?.message
                ||
                "Whisper 음성 인식 오류"
            );

        } finally {

            transcribingRef.current =
                false;


            // =================================================
            // 최신 pending 하나 처리
            // =================================================

            const pending =
                pendingAudioRef.current;


            pendingAudioRef.current =
                null;


            if (
                pending
                &&
                activeRef.current
            ) {

                console.log(
                    "[WHISPER PENDING] processing latest audio"
                );


                processAudio(
                    pending
                );
            }
        }
    }


    // =====================================================
    // RECORDING
    // =====================================================

    function startRecordingCycle() {

        if (
            !activeRef.current
        ) {

            return;
        }


        const stream =
            streamRef.current;


        if (
            !stream
        ) {

            return;
        }


        // 이미 recorder가 녹음 중이면 중복 시작 금지
        if (
            recorderRef.current
            &&
            recorderRef.current.state ===
            "recording"
        ) {

            return;
        }


        let recorder;


        try {

            recorder =
                new MediaRecorder(
                    stream,
                    {
                        mimeType:
                            "audio/webm",
                    }
                );

        } catch {

            recorder =
                new MediaRecorder(
                    stream
                );
        }


        recorderRef.current =
            recorder;


        const chunks = [];


        recorder.ondataavailable =
            (event) => {

                if (
                    event.data
                    &&
                    event.data.size > 0
                ) {

                    chunks.push(
                        event.data
                    );
                }
            };


        recorder.onstop =
            () => {

                if (
                    recordingTimerRef.current
                ) {

                    window.clearTimeout(
                        recordingTimerRef.current
                    );

                    recordingTimerRef.current =
                        null;
                }


                const audioBlob =
                    new Blob(
                        chunks,
                        {
                            type:
                                recorder.mimeType
                                ||
                                "audio/webm",
                        }
                    );


                // recorderRef가 현재 recorder일 때만 제거
                if (
                    recorderRef.current ===
                    recorder
                ) {

                    recorderRef.current =
                        null;
                }


                // =================================================
                // 먼저 현재 음성을 Whisper로 전달
                // =================================================

                processAudio(
                    audioBlob
                );


                // =================================================
                // 그 다음 새 녹음 시작
                // =================================================

                if (
                    activeRef.current
                ) {

                    window.setTimeout(
                        () => {

                            startRecordingCycle();

                        },
                        30
                    );
                }
            };


        recorder.onerror =
            (event) => {

                console.error(
                    "[RECORDER ERROR]",
                    event
                );
            };


        try {

            recorder.start();


            recordingTimerRef.current =
                window.setTimeout(
                    () => {

                        if (
                            recorder.state ===
                            "recording"
                        ) {

                            recorder.stop();
                        }

                    },
                    RECORDING_TIME
                );

        } catch (
            error
            ) {

            console.error(
                "[RECORDER START ERROR]",
                error
            );
        }
    }


    // =====================================================
    // MICROPHONE
    // =====================================================

    useEffect(
        () => {

            let cancelled =
                false;


            activeRef.current =
                true;


            async function initializeMicrophone() {

                // =================================================
                // 이미 연결된 스트림이 있으면 또 만들지 않음
                // =================================================

                if (
                    streamRef.current
                ) {

                    console.log(
                        "[MIC] already initialized"
                    );

                    return;
                }


                if (
                    !navigator.mediaDevices
                    ||
                    !navigator
                        .mediaDevices
                        .getUserMedia
                ) {

                    setStatus(
                        "error"
                    );


                    setDisplayText(
                        "마이크를 사용할 수 없습니다."
                    );

                    return;
                }


                if (
                    !window.MediaRecorder
                ) {

                    setStatus(
                        "error"
                    );


                    setDisplayText(
                        "MediaRecorder를 지원하지 않습니다."
                    );

                    return;
                }


                try {

                    setStatus(
                        "starting"
                    );


                    setDisplayText(
                        "마이크 연결 중..."
                    );


                    const stream =
                        await navigator
                            .mediaDevices
                            .getUserMedia(
                                {
                                    audio: {
                                        echoCancellation:
                                            true,

                                        noiseSuppression:
                                            true,

                                        autoGainControl:
                                            true,
                                    },

                                    video:
                                        false,
                                }
                            );


                    if (
                        cancelled
                        ||
                        !activeRef.current
                    ) {

                        stream
                            .getTracks()
                            .forEach(
                                (track) =>
                                    track.stop()
                            );

                        return;
                    }


                    // 혹시 비동기 중복 요청으로
                    // 이미 stream이 생겼다면 새 stream 폐기
                    if (
                        streamRef.current
                    ) {

                        stream
                            .getTracks()
                            .forEach(
                                (track) =>
                                    track.stop()
                            );

                        return;
                    }


                    streamRef.current =
                        stream;


                    const track =
                        stream
                            .getAudioTracks()
                            [0];


                    console.log(
                        "[MIC] microphone connected"
                    );


                    console.log(
                        "[MIC DEVICE]",
                        track?.label
                    );


                    showListening();


                    startRecordingCycle();

                } catch (
                    error
                    ) {

                    if (
                        cancelled
                    ) {

                        return;
                    }


                    console.error(
                        "[MIC ERROR]",
                        error
                    );


                    setStatus(
                        "error"
                    );


                    if (
                        error?.name ===
                        "NotAllowedError"
                    ) {

                        setDisplayText(
                            "마이크 권한이 차단되었습니다."
                        );

                    } else if (
                        error?.name ===
                        "NotFoundError"
                    ) {

                        setDisplayText(
                            "사용 가능한 마이크를 찾을 수 없습니다."
                        );

                    } else {

                        setDisplayText(
                            `마이크 오류: ${
                                error?.name
                                ||
                                "unknown"
                            }`
                        );
                    }
                }
            }


            initializeMicrophone();


            return () => {

                cancelled =
                    true;

                activeRef.current =
                    false;


                clearWakeState();
                clearCommandBuffer();


                pendingAudioRef.current =
                    null;


                if (
                    recordingTimerRef.current
                ) {

                    window.clearTimeout(
                        recordingTimerRef.current
                    );

                    recordingTimerRef.current =
                        null;
                }


                if (
                    commandTimerRef.current
                ) {

                    window.clearTimeout(
                        commandTimerRef.current
                    );

                    commandTimerRef.current =
                        null;
                }


                const recorder =
                    recorderRef.current;


                recorderRef.current =
                    null;


                if (
                    recorder
                    &&
                    recorder.state ===
                    "recording"
                ) {

                    try {

                        recorder.stop();

                    } catch {

                        // ignore
                    }
                }


                const stream =
                    streamRef.current;


                streamRef.current =
                    null;


                if (
                    stream
                ) {

                    stream
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop()
                        );
                }
            };

        },
        []
    );


    // =====================================================
    // HIDDEN
    // =====================================================

    if (
        hidden
    ) {

        return null;
    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <div
            className={
                `voice-command-bar ${status}`
            }
        >

            <div
                className="voice-indicator"
            >

                <span
                    className="voice-dot"
                />


                <span
                    className="voice-status"
                >

                    {
                        status === "command"

                            ? "COMMAND"

                            : status === "error"

                                ? "ERROR"

                                : status === "starting"

                                    ? "STARTING"

                                    : "LISTENING"
                    }

                </span>

            </div>


            <div
                className="voice-text"
            >

                {displayText}

            </div>


            <div
                className="voice-wake-word"
            >

                <span>
                    WAKE WORD
                </span>


                <strong>
                    {WAKE_WORD_LABEL}
                </strong>

            </div>

        </div>
    );
}


export default VoiceCommandBar;