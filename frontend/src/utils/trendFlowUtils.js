/* =========================================================
   TREND META
========================================================= */

export const TREND_META = {
    DUFFLE: {
        id: "DUFFLE",
        slug: "duffle",
        ko: "떡볶이 코트",
        en: "DUFFLE COAT",
        color: "#9f72ff",
    },

    VELOUR: {
        id: "VELOUR",
        slug: "velour",
        ko: "벨루어 트랙수트",
        en: "VELOUR TRACKSUIT",
        color: "#ef70ad",
    },

    SKINNY: {
        id: "SKINNY",
        slug: "skinny",
        ko: "스키니진",
        en: "SKINNY JEANS",
        color: "#58a3ff",
    },

    LOW_RISE: {
        id: "LOW_RISE",
        slug: "low-rise",
        ko: "로우라이즈",
        en: "LOW-RISE",
        color: "#8bdf59",
    },

    UGG: {
        id: "UGG",
        slug: "ugg",
        ko: "어그부츠",
        en: "UGG BOOTS",
        color: "#ff9b47",
    },
};


export const TREND_ORDER = [
    "DUFFLE",
    "VELOUR",
    "SKINNY",
    "LOW_RISE",
    "UGG",
];


export function getTrendFromSlug(slug) {
    return Object.values(
        TREND_META
    ).find(
        (trend) =>
            trend.slug === slug
    );
}


/* =========================================================
   DATE PARSER
========================================================= */

export function parseDateToYearValue(
    rawValue
) {

    if (
        rawValue === null
        || rawValue === undefined
        || rawValue === ""
    ) {
        return null;
    }


    const value =
        String(rawValue).trim();


    /* 1990s */

    let match =
        value.match(
            /^(\d{4})s$/
        );


    if (match) {
        return Number(
            match[1]
        ) + 5;
    }


    /* 2001-2005 */

    match =
        value.match(
            /^(\d{4})-(\d{4})$/
        );


    if (match) {
        return (
            Number(match[1])
            + Number(match[2])
        ) / 2;
    }


    /* 2009-H1 */

    match =
        value.match(
            /^(\d{4})-H([12])$/i
        );


    if (match) {

        return (
            Number(match[1])
            + (
                Number(match[2]) === 1
                    ? 0.25
                    : 0.75
            )
        );
    }


    /* 2022-01/02 */

    match =
        value.match(
            /^(\d{4})-(\d{2})\/(\d{2})$/
        );


    if (match) {

        const year =
            Number(
                match[1]
            );


        const averageMonth =
            (
                Number(match[2])
                + Number(match[3])
            ) / 2;


        return (
            year
            + (
                averageMonth - 1
            ) / 12
        );
    }


    /* YYYY-MM-DD */

    match =
        value.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );


    if (match) {

        const year =
            Number(
                match[1]
            );

        const month =
            Number(
                match[2]
            );

        const day =
            Number(
                match[3]
            );


        return (
            year
            + (month - 1) / 12
            + (day - 1) / 365
        );
    }


    /* YYYY-MM */

    match =
        value.match(
            /^(\d{4})-(\d{2})$/
        );


    if (match) {

        const year =
            Number(
                match[1]
            );

        const month =
            Number(
                match[2]
            );


        return (
            year
            + (month - 1) / 12
        );
    }


    /* YYYY */

    match =
        value.match(
            /^(\d{4})$/
        );


    if (match) {

        return Number(
            match[1]
        );
    }


    /* 문자열 속 연도 */

    match =
        value.match(
            /(19|20)\d{2}/
        );


    if (match) {

        return Number(
            match[0]
        );
    }


    return null;
}


/* =========================================================
   NON-LINEAR TIME SCALE
========================================================= */

const TIME_SEGMENTS = [
    {
        startYear: 1990,
        endYear: 2000,
        startPercent: 0,
        endPercent: 8,
    },

    {
        startYear: 2000,
        endYear: 2010,
        startPercent: 8,
        endPercent: 26,
    },

    {
        startYear: 2010,
        endYear: 2020,
        startPercent: 26,
        endPercent: 50,
    },

    {
        startYear: 2020,
        endYear: 2026,
        startPercent: 50,
        endPercent: 94,
    },
];


export function getYearPercent(
    year
) {

    const segment =
        TIME_SEGMENTS.find(
            (item) =>
                year >= item.startYear
                &&
                year <= item.endYear
        );


    if (!segment) {

        return year < 1990
            ? 0
            : 94;
    }


    const ratio =
        (
            year
            - segment.startYear
        )
        /
        (
            segment.endYear
            - segment.startYear
        );


    return (
        segment.startPercent
        +
        ratio
        *
        (
            segment.endPercent
            - segment.startPercent
        )
    );
}


/* =========================================================
   RELATIONSHIP GROUP
========================================================= */

export function getRelationshipGroup(
    relationship
) {

    const source =
        relationship.source_group;

    const target =
        relationship.target_group;


    if (
        source
        &&
        TREND_META[source]
    ) {
        return source;
    }


    if (
        target
        &&
        TREND_META[target]
    ) {
        return target;
    }


    return null;
}


export function relationshipDate(
    relationship
) {

    return (
        relationship.date
        ||
        relationship.year
        ||
        null
    );
}


/* =========================================================
   PERIOD NORMALIZE
========================================================= */

export function normalizePeriod(
    period
) {

    const value =
        period
        ||
        "트렌드 변화";


    if (
        value.includes("과거")
    ) {
        return "과거 유행";
    }


    if (
        value.includes("도입")
    ) {
        return "도입";
    }


    if (
        value.includes("확산")
    ) {
        return "대중 확산";
    }


    if (
        value.includes("쇠퇴")
    ) {
        return "쇠퇴";
    }


    if (
        value.includes("전환")
    ) {
        return "전환";
    }


    if (
        value.includes("재등장")
        ||
        value.includes("재조명")
    ) {
        return "재등장";
    }


    if (
        value.includes("재해석")
    ) {
        return "재해석";
    }


    if (
        value.includes("확장")
    ) {
        return "확장";
    }


    if (
        value.includes("재론칭")
    ) {
        return "재론칭";
    }


    return value;
}


/* =========================================================
   OVERVIEW TARGETS

   year = 보여주고 싶은 대표 시기
   tolerance = 실제 데이터가 몇 년까지 떨어져 있어도 허용

   tolerance 밖이면 해당 대표 시점은 생략
========================================================= */

const REPRESENTATIVE_TARGETS = {

    DUFFLE: [
        {
            year: 1995,
            tolerance: 6,
        },
        {
            year: 2010,
            tolerance: 1.5,
        },
        {
            year: 2014,
            tolerance: 2,
        },
        {
            year: 2021,
            tolerance: 1.5,
        },
        {
            year: 2024,
            tolerance: 1.5,
        },
    ],


    VELOUR: [
        {
            year: 2003,
            tolerance: 3,
        },
        {
            year: 2019,
            tolerance: 1,
        },
        {
            year: 2020,
            tolerance: 0.8,
        },
        {
            year: 2021,
            tolerance: 0.8,
        },
    ],


    SKINNY: [
        {
            year: 2005,
            tolerance: 1,
        },
        {
            year: 2009,
            tolerance: 1,
        },
        {
            year: 2015,
            tolerance: 1.5,
        },
        {
            year: 2021,
            tolerance: 1,
        },
        {
            year: 2025.5,
            tolerance: 1.5,
        },
    ],


    LOW_RISE: [
        {
            year: 2021.8,
            tolerance: 0.8,
        },
        {
            year: 2022,
            tolerance: 0.8,
        },
    ],


    UGG: [
        {
            year: 2004,
            tolerance: 1.5,
        },
        {
            year: 2021,
            tolerance: 1,
        },
        {
            year: 2023,
            tolerance: 1,
        },
        {
            year: 2026,
            tolerance: 1,
        },
    ],
};


/* =========================================================
   대표 노드 간 최소 간격
========================================================= */

const MIN_YEAR_GAP = {
    DUFFLE: 0.7,
    VELOUR: 0.55,
    SKINNY: 1.1,
    LOW_RISE: 0.55,
    UGG: 0.75,
};


/* =========================================================
   OVERVIEW ROWS
========================================================= */

export function buildOverviewRows(
    relationships
) {

    const normalized =
        relationships
            .map(
                (
                    relationship,
                    index
                ) => {

                    const group =
                        getRelationshipGroup(
                            relationship
                        );


                    const date =
                        relationshipDate(
                            relationship
                        );


                    const yearValue =
                        parseDateToYearValue(
                            date
                        );


                    return {
                        ...relationship,

                        _index:
                        index,

                        _group:
                        group,

                        _date:
                        date,

                        _yearValue:
                        yearValue,
                    };
                }
            )
            .filter(
                (relationship) =>
                    relationship._group
                    &&
                    relationship._yearValue
                    !== null
            );


    return TREND_ORDER.map(
        (groupId) => {

            const groupRelationships =
                normalized.filter(
                    (relationship) =>
                        relationship._group
                        === groupId
                );


            const targets =
                REPRESENTATIVE_TARGETS[
                    groupId
                    ] || [];


            const usedIndexes =
                new Set();


            const chosen =
                [];


            targets.forEach(
                (
                    target,
                    targetIndex
                ) => {

                    const candidates =
                        groupRelationships
                            .filter(
                                (relationship) =>
                                    !usedIndexes.has(
                                        relationship._index
                                    )
                            )
                            .map(
                                (relationship) => ({
                                    relationship,

                                    distance:
                                        Math.abs(
                                            relationship._yearValue
                                            - target.year
                                        ),
                                })
                            )
                            .filter(
                                (candidate) =>
                                    candidate.distance
                                    <=
                                    target.tolerance
                            )
                            .sort(
                                (a, b) =>
                                    a.distance
                                    - b.distance
                            );


                    const picked =
                        candidates[0]
                            ?.relationship;


                    if (!picked) {
                        return;
                    }


                    const minGap =
                        MIN_YEAR_GAP[
                            groupId
                            ] || 0.7;


                    const overlaps =
                        chosen.some(
                            (point) =>
                                Math.abs(
                                    point.yearValue
                                    - picked._yearValue
                                )
                                < minGap
                        );


                    if (overlaps) {
                        return;
                    }


                    usedIndexes.add(
                        picked._index
                    );


                    chosen.push({
                        id:
                            `${groupId}-${targetIndex}-${picked._index}`,

                        yearValue:
                        picked._yearValue,

                        yearLabel:
                            String(
                                picked._date
                                ||
                                Math.round(
                                    picked._yearValue
                                )
                            ),

                        title:
                            normalizePeriod(
                                picked.period
                            ),

                        relationship:
                        picked,
                    });
                }
            );


            chosen.sort(
                (a, b) =>
                    a.yearValue
                    - b.yearValue
            );


            return {
                ...TREND_META[
                    groupId
                    ],

                points:
                chosen,
            };
        }
    );
}


/* =========================================================
   DETAIL GROUP DATA
========================================================= */

export function getGroupRelationships(
    relationships,
    groupId
) {

    return relationships.filter(
        (relationship) =>
            getRelationshipGroup(
                relationship
            )
            === groupId
    );
}


export function getGroupNodes(
    nodes,
    relationships,
    groupId
) {

    const groupRelationships =
        getGroupRelationships(
            relationships,
            groupId
        );


    const ids =
        new Set();


    groupRelationships.forEach(
        (relationship) => {

            if (
                relationship.source_id
            ) {

                ids.add(
                    relationship.source_id
                );
            }


            if (
                relationship.target_id
            ) {

                ids.add(
                    relationship.target_id
                );
            }
        }
    );


    return nodes.filter(
        (node) =>
            ids.has(
                node.node_id
            )
    );
}