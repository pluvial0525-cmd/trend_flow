import { useMemo } from "react";
import "../../styles/trendCity.css";

const SKIN_TONES = [
    "#F1C7A8",
    "#E7B78F",
    "#D99A72",
    "#C9855E",
    "#9D6748",
];

const HAIR_COLORS = [
    "#1D1A1B",
    "#302522",
    "#4B3429",
    "#6F4B35",
    "#A16B3F",
    "#D0A26A",
];

const CLOTHES = [
    "#6E5BE8",
    "#405FA0",
    "#446A54",
    "#98536A",
    "#AA6638",
    "#565B6D",
    "#79528A",
    "#355D75",
];

const HAIR_TYPES = [
    "short",
    "parted",
    "bob",
    "wave",
    "bun",
    "cap",
    "side",
    "curly",
];

function numberFromId(id) {
    const match = String(id).match(/\d+/);

    return match
        ? Number(match[0])
        : 0;
}

function CitizenAvatar({
                           id = "person_0",
                           reaction = "neutral",
                           size = 72,
                           active = false,
                       }) {
    const traits = useMemo(() => {
        const seed = numberFromId(id);

        return {
            skin:
                SKIN_TONES[
                seed % SKIN_TONES.length
                    ],

            hair:
                HAIR_COLORS[
                (seed * 3 + 2) %
                HAIR_COLORS.length
                    ],

            clothes:
                CLOTHES[
                (seed * 5 + 1) %
                CLOTHES.length
                    ],

            hairType:
                HAIR_TYPES[
                (seed * 7 + 3) %
                HAIR_TYPES.length
                    ],

            glasses:
                seed % 7 === 0,

            blush:
                seed % 4 === 0,

            collar:
                seed % 3 === 0,

            hoodie:
                seed % 5 === 0,
        };
    }, [id]);

    const expression =
        getExpression(reaction);

    return (
        <div
            className={`citizen-avatar ${
                active ? "is-active" : ""
            }`}
            style={{
                width: size,
                height: size,
            }}
        >
            <svg
                viewBox="0 0 120 120"
                className="citizen-avatar-svg"
                aria-hidden="true"
            >
                {active && (
                    <>
                        <circle
                            cx="60"
                            cy="62"
                            r="49"
                            className="avatar-ring ring-outer"
                        />

                        <circle
                            cx="60"
                            cy="62"
                            r="42"
                            className="avatar-ring ring-inner"
                        />
                    </>
                )}

                {/* 어깨 / 상반신 */}
                <path
                    d="
            M26 120
            C28 95 39 83 60 83
            C81 83 92 95 94 120
            Z
          "
                    fill={traits.clothes}
                />

                {/* 목 */}
                <rect
                    x="52"
                    y="72"
                    width="16"
                    height="17"
                    rx="5"
                    fill={traits.skin}
                />

                <ClothesDetail
                    traits={traits}
                />

                {/* 귀 */}
                <ellipse
                    cx="30"
                    cy="56"
                    rx="6"
                    ry="9"
                    fill={traits.skin}
                />

                <ellipse
                    cx="90"
                    cy="56"
                    rx="6"
                    ry="9"
                    fill={traits.skin}
                />

                {/* 얼굴 */}
                <path
                    d="
            M32 43
            C34 25 45 16 60 16
            C76 16 87 26 88 44
            L87 60
            C85 75 75 82 60 82
            C45 82 35 75 33 60
            Z
          "
                    fill={traits.skin}
                />

                <Hair
                    type={traits.hairType}
                    color={traits.hair}
                />

                {/* 눈썹 */}
                <path
                    d={expression.leftBrow}
                    fill="none"
                    stroke="#33282B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />

                <path
                    d={expression.rightBrow}
                    fill="none"
                    stroke="#33282B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />

                <Eye
                    x={47}
                    reaction={reaction}
                />

                <Eye
                    x={73}
                    reaction={reaction}
                />

                {traits.glasses && (
                    <Glasses />
                )}

                {traits.blush && (
                    <>
                        <ellipse
                            cx="42"
                            cy="64"
                            rx="5"
                            ry="2.4"
                            fill="rgba(211,111,116,.22)"
                        />

                        <ellipse
                            cx="78"
                            cy="64"
                            rx="5"
                            ry="2.4"
                            fill="rgba(211,111,116,.22)"
                        />
                    </>
                )}

                {/* 코 */}
                <path
                    d="M59 55 Q57 60 61 60"
                    fill="none"
                    stroke="rgba(120,80,65,.35)"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                />

                {/* 입 */}
                <path
                    d={expression.mouth}
                    fill={
                        expression.fillMouth
                            ? "#74424A"
                            : "none"
                    }
                    stroke="#74424A"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

function ClothesDetail({
                           traits,
                       }) {
    if (traits.hoodie) {
        return (
            <>
                <path
                    d="M42 89 Q60 76 78 89"
                    fill="none"
                    stroke="rgba(255,255,255,.18)"
                    strokeWidth="3"
                />

                <line
                    x1="55"
                    y1="88"
                    x2="55"
                    y2="104"
                    stroke="rgba(255,255,255,.35)"
                    strokeWidth="1.5"
                />

                <line
                    x1="65"
                    y1="88"
                    x2="65"
                    y2="104"
                    stroke="rgba(255,255,255,.35)"
                    strokeWidth="1.5"
                />
            </>
        );
    }

    if (traits.collar) {
        return (
            <>
                <path
                    d="M49 84 L60 96 L56 83"
                    fill="rgba(255,255,255,.72)"
                />

                <path
                    d="M71 84 L60 96 L64 83"
                    fill="rgba(255,255,255,.72)"
                />
            </>
        );
    }

    return (
        <path
            d="M51 84 L60 94 L69 84"
            fill="rgba(255,255,255,.16)"
        />
    );
}

function Eye({
                 x,
                 reaction,
             }) {
    if (
        reaction === "surprised" ||
        reaction === "sharing"
    ) {
        return (
            <ellipse
                cx={x}
                cy="52"
                rx="4"
                ry="5.1"
                fill="#292327"
            />
        );
    }

    if (
        reaction === "uninterested"
    ) {
        return (
            <path
                d={`M${x - 5} 53 Q${x} 55 ${
                    x + 5
                } 53`}
                fill="none"
                stroke="#292327"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
        );
    }

    if (
        reaction === "skeptical"
    ) {
        return (
            <ellipse
                cx={x}
                cy="53"
                rx="3.8"
                ry="2.5"
                fill="#292327"
            />
        );
    }

    return (
        <ellipse
            cx={x}
            cy="52"
            rx="3.6"
            ry="4.4"
            fill="#292327"
        />
    );
}

function Glasses() {
    return (
        <g
            fill="none"
            stroke="#272429"
            strokeWidth="2"
        >
            <rect
                x="38"
                y="46"
                width="18"
                height="13"
                rx="5"
            />

            <rect
                x="64"
                y="46"
                width="18"
                height="13"
                rx="5"
            />

            <path d="M56 52 H64" />
        </g>
    );
}

function Hair({
                  type,
                  color,
              }) {
    switch (type) {
        case "bob":
            return (
                <g fill={color}>
                    <path
                        d="
              M30 54
              C26 28 38 11 60 11
              C83 11 94 29 90 60
              L82 61
              C83 42 77 30 60 29
              C43 30 37 41 38 60
              Z
            "
                    />

                    <rect
                        x="28"
                        y="39"
                        width="10"
                        height="33"
                        rx="6"
                    />

                    <rect
                        x="82"
                        y="39"
                        width="10"
                        height="33"
                        rx="6"
                    />
                </g>
            );

        case "wave":
            return (
                <g fill={color}>
                    <path
                        d="
              M30 52
              C27 27 40 11 60 10
              C83 10 93 29 89 57
              C84 45 78 36 67 31
              C57 35 48 34 39 29
              C34 36 32 44 33 54
              Z
            "
                    />

                    <circle
                        cx="31"
                        cy="57"
                        r="8"
                    />

                    <circle
                        cx="89"
                        cy="57"
                        r="8"
                    />
                </g>
            );

        case "bun":
            return (
                <g fill={color}>
                    <circle
                        cx="68"
                        cy="12"
                        r="11"
                    />

                    <path
                        d="
              M31 52
              C29 27 42 14 60 14
              C80 14 91 30 88 55
              C80 41 74 33 60 31
              C44 32 38 41 34 54
              Z
            "
                    />
                </g>
            );

        case "parted":
            return (
                <g fill={color}>
                    <path
                        d="
              M30 48
              C30 24 42 10 61 10
              C82 10 91 25 89 47
              C83 38 75 31 63 28
              C57 36 46 39 34 38
              Z
            "
                    />

                    <path
                        d="
              M58 11
              C53 23 44 31 32 34
              C36 17 45 10 58 11
              Z
            "
                    />
                </g>
            );

        case "cap":
            return (
                <>
                    <path
                        d="
              M31 46
              C32 29 42 19 60 19
              C79 19 88 29 89 46
              Z
            "
                        fill={color}
                    />

                    <path
                        d="
              M28 29
              C39 16 52 13 67 17
              C80 20 87 27 90 35
              L30 35
              Z
            "
                        fill="#2D3038"
                    />

                    <rect
                        x="70"
                        y="32"
                        width="27"
                        height="5"
                        rx="2.5"
                        fill="#2D3038"
                    />
                </>
            );

        case "side":
            return (
                <path
                    d="
            M31 48
            C30 26 42 11 60 11
            C79 11 89 24 89 45
            C75 42 64 34 57 25
            C51 35 41 39 32 38
            Z
          "
                    fill={color}
                />
            );

        case "curly":
            return (
                <g fill={color}>
                    <circle
                        cx="39"
                        cy="29"
                        r="10"
                    />
                    <circle
                        cx="50"
                        cy="20"
                        r="10"
                    />
                    <circle
                        cx="63"
                        cy="19"
                        r="11"
                    />
                    <circle
                        cx="76"
                        cy="23"
                        r="10"
                    />
                    <circle
                        cx="84"
                        cy="34"
                        r="9"
                    />
                    <path
                        d="M31 47 C31 36 35 28 42 23 L83 29 C88 34 90 40 89 48 Z"
                    />
                </g>
            );

        default:
            return (
                <path
                    d="
            M31 48
            C28 25 41 11 60 11
            C81 11 91 28 89 49
            C81 38 74 32 65 29
            C55 35 45 35 34 31
            C31 37 30 42 31 48
            Z
          "
                    fill={color}
                />
            );
    }
}

function getExpression(
    reaction
) {
    switch (reaction) {
        case "surprised":
            return {
                leftBrow:
                    "M40 41 Q47 36 54 41",

                rightBrow:
                    "M66 41 Q73 36 80 41",

                mouth:
                    "M56 68 Q60 72 64 68 Q60 76 56 68",

                fillMouth: true,
            };

        case "skeptical":
            return {
                leftBrow:
                    "M40 43 Q47 40 54 42",

                rightBrow:
                    "M66 39 Q73 35 80 38",

                mouth:
                    "M54 69 Q60 67 66 69",

                fillMouth: false,
            };

        case "sharing":
            return {
                leftBrow:
                    "M40 41 Q47 38 54 41",

                rightBrow:
                    "M66 41 Q73 38 80 41",

                mouth:
                    "M52 66 Q60 76 68 66",

                fillMouth: false,
            };

        case "uninterested":
            return {
                leftBrow:
                    "M40 44 Q47 43 54 44",

                rightBrow:
                    "M66 44 Q73 43 80 44",

                mouth:
                    "M55 70 L65 70",

                fillMouth: false,
            };

        default:
            return {
                leftBrow:
                    "M40 42 Q47 39 54 42",

                rightBrow:
                    "M66 42 Q73 39 80 42",

                mouth:
                    "M54 68 Q60 72 66 68",

                fillMouth: false,
            };
    }
}

export default CitizenAvatar;