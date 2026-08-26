from __future__ import annotations

import re
import sys
from collections import OrderedDict
from datetime import datetime

from neo4j import GraphDatabase


# ============================================================
# NEO4J
# ============================================================

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "trendflow1234"


# ============================================================
# TREND INFO
# ============================================================

TREND_INFO = {
    "skinny_jeans": {
        "label": "스키니진",
        "keywords": [
            "스키니진",
            "스키니",
            "skinny jeans",
            "skinny jean",
        ],
    },

    "duffle_coat": {
        "label": "떡볶이 코트",
        "keywords": [
            "떡볶이 코트",
            "떡볶이코트",
            "더플코트",
            "더플 코트",
            "duffle coat",
            "duffle",
        ],
    },

    "ugg": {
        "label": "어그부츠",
        "keywords": [
            "어그부츠",
            "어그 부츠",
            "어그",
            "ugg boots",
            "ugg",
        ],
    },

    "low_rise": {
        "label": "로우라이즈",
        "keywords": [
            "로우라이즈",
            "로우 라이즈",
            "low rise",
            "low-rise",
        ],
    },

    "velour_tracksuit": {
        "label": "벨루어 트랙수트",
        "keywords": [
            "벨루어 트랙수트",
            "벨루어",
            "벨벳 트레이닝",
            "벨벳 트랙수트",
            "velour tracksuit",
            "velour",
            "juicy couture",
            "쥬시 꾸뛰르",
        ],
    },
}


# ============================================================
# CYPHER
# ============================================================

QUERY = """
MATCH (a)-[r]->(b)
WHERE r.trend_scope = $trend_scope

RETURN
    a.name AS source_node,
    labels(a) AS source_labels,

    type(r) AS relationship,

    b.name AS target_node,
    labels(b) AS target_labels,

    r.date AS date,
    r.period AS period,
    r.trend_state AS trend_state,
    r.evidence_level AS evidence_level,
    r.evidence_type AS evidence_type,

    r.context AS context,
    r.source_note AS source_note,
    r.source_title AS source_title,
    r.source_url AS source_url,

    r.relationship_id AS relationship_id
"""


# ============================================================
# QUESTION -> TREND
# ============================================================

def detect_trend(question: str) -> str | None:
    """
    사용자 질문에서 어떤 패션 트렌드에 대한 질문인지 찾는다.
    """

    normalized = question.lower().strip()

    matches = []

    for scope, info in TREND_INFO.items():

        for keyword in info["keywords"]:

            keyword_normalized = keyword.lower()

            if keyword_normalized in normalized:

                matches.append(
                    (
                        len(keyword_normalized),
                        scope,
                    )
                )

    if not matches:
        return None

    # 긴 키워드를 우선
    matches.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return matches[0][1]


# ============================================================
# DATE SORT
# ============================================================

def date_sort_key(value) -> tuple:
    """
    Neo4j의 date가
    2005
    2009-01
    2025-02-09
    2025-2026
    등 여러 문자열 형태여도
    시작 연/월/일 기준으로 정렬한다.
    """

    if value is None:
        return (9999, 12, 31)

    text = str(value).strip()

    numbers = re.findall(
        r"\d+",
        text,
    )

    if not numbers:
        return (9999, 12, 31)

    year = int(numbers[0])

    month = 1
    day = 1

    # 2025-2026 같은 연도 범위는
    # 두 번째 숫자를 월로 취급하면 안 됨.
    if (
        len(numbers) >= 2
        and len(numbers[1]) <= 2
    ):
        month = int(numbers[1])

    if (
        len(numbers) >= 3
        and len(numbers[2]) <= 2
    ):
        day = int(numbers[2])

    return (
        year,
        month,
        day,
    )


# ============================================================
# GET EVIDENCE
# ============================================================

def get_evidence(
    trend_scope: str,
) -> list[dict]:

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(
            NEO4J_USER,
            NEO4J_PASSWORD,
        ),
    )

    try:

        with driver.session() as session:

            result = session.run(
                QUERY,
                trend_scope=trend_scope,
            )

            evidence = []

            for record in result:

                evidence.append(
                    {
                        "source":
                            record["source_node"],

                        "source_labels":
                            record["source_labels"],

                        "relationship":
                            record["relationship"],

                        "target":
                            record["target_node"],

                        "target_labels":
                            record["target_labels"],

                        "date":
                            record["date"],

                        "period":
                            record["period"],

                        "trend_state":
                            record["trend_state"],

                        "evidence_level":
                            record["evidence_level"],

                        "evidence_type":
                            record["evidence_type"],

                        "context":
                            record["context"],

                        "source_note":
                            record["source_note"],

                        "source_title":
                            record["source_title"],

                        "source_url":
                            record["source_url"],

                        "relationship_id":
                            record["relationship_id"],
                    }
                )

            evidence.sort(
                key=lambda item:
                    date_sort_key(
                        item["date"]
                    )
            )

            return evidence

    finally:
        driver.close()


# ============================================================
# GROUP BY PERIOD
# ============================================================

def group_by_period(
    evidence: list[dict],
) -> OrderedDict:

    sections = OrderedDict()

    # evidence 자체가 이미 날짜순이므로
    # 처음 등장하는 period 순서대로 묶으면 된다.
    for item in evidence:

        period = (
            item.get("period")
            or "기타"
        )

        if period not in sections:
            sections[period] = []

        sections[period].append(
            item
        )

    return sections


# ============================================================
# BUILD CONTEXT
# ============================================================

def build_context(
    evidence: list[dict],
    trend_scope: str,
) -> str:

    trend_label = (
        TREND_INFO[
            trend_scope
        ]["label"]
    )

    sections = group_by_period(
        evidence
    )

    lines = []

    lines.append(
        "=" * 72
    )

    lines.append(
        "GRAPH RAG CONTEXT"
    )

    lines.append(
        "=" * 72
    )

    lines.append(
        f"Trend Scope : {trend_scope}"
    )

    lines.append(
        f"Trend Label : {trend_label}"
    )

    lines.append(
        f"Evidence    : {len(evidence)}"
    )

    for period, items in sections.items():

        lines.append("")

        lines.append(
            f"[{period}]"
        )

        lines.append(
            "-" * 72
        )

        for item in items:

            date = (
                item.get("date")
                or "-"
            )

            source = (
                item.get("source")
                or "UNKNOWN"
            )

            relationship = (
                item.get("relationship")
                or "RELATED_TO"
            )

            target = (
                item.get("target")
                or "UNKNOWN"
            )

            lines.append(
                f"{date} | "
                f"{source} "
                f"-[{relationship}]-> "
                f"{target}"
            )

            if item.get(
                "trend_state"
            ):
                lines.append(
                    "Trend State: "
                    f"{item['trend_state']}"
                )

            if item.get(
                "evidence_level"
            ):
                lines.append(
                    "Evidence: "
                    f"{item['evidence_level']}"
                )

            if item.get(
                "evidence_type"
            ):
                lines.append(
                    "Type: "
                    f"{item['evidence_type']}"
                )

            if item.get(
                "context"
            ):
                lines.append(
                    "Context: "
                    f"{item['context']}"
                )

            if item.get(
                "source_note"
            ):
                lines.append(
                    "Caution: "
                    f"{item['source_note']}"
                )

            if item.get(
                "source_title"
            ):
                lines.append(
                    "Source: "
                    f"{item['source_title']}"
                )

            if item.get(
                "source_url"
            ):
                lines.append(
                    "URL: "
                    f"{item['source_url']}"
                )

            if item.get(
                "relationship_id"
            ):
                lines.append(
                    "Relationship ID: "
                    f"{item['relationship_id']}"
                )

            lines.append("")

    return "\n".join(
        lines
    )


# ============================================================
# QUESTION -> CONTEXT
# ============================================================

def build_context_from_question(
    question: str,
) -> dict:

    trend_scope = detect_trend(
        question
    )

    if trend_scope is None:

        return {
            "success": False,
            "question": question,
            "trend_scope": None,
            "trend_label": None,
            "evidence_count": 0,
            "context": None,
            "message":
                "질문에서 지원하는 패션 트렌드를 찾지 못했습니다.",
        }

    evidence = get_evidence(
        trend_scope
    )

    context = build_context(
        evidence,
        trend_scope,
    )

    return {
        "success": True,
        "question": question,
        "trend_scope": trend_scope,
        "trend_label":
            TREND_INFO[
                trend_scope
            ]["label"],
        "evidence_count":
            len(evidence),
        "evidence":
            evidence,
        "context":
            context,
    }


# ============================================================
# CLI
# ============================================================

def print_supported_trends():

    print("지원 패션:")

    for scope, info in TREND_INFO.items():

        print(
            f"  - {scope:<18} "
            f"({info['label']})"
        )


def main():

    print(
        "=" * 72
    )

    print(
        "GraphRAG Context Builder"
    )

    print(
        "=" * 72
    )

    if len(sys.argv) < 2:

        print()
        print(
            '질문을 입력해주세요.'
        )

        print()
        print(
            '예:'
        )

        print(
            'uv run python '
            'graphrag\\build_context.py '
            '"스키니진은 다시 유행하고 있어?"'
        )

        print()

        print_supported_trends()

        raise SystemExit(1)

    # 여러 단어로 입력해도 하나의 질문으로 합침
    question = " ".join(
        sys.argv[1:]
    ).strip()

    result = (
        build_context_from_question(
            question
        )
    )

    print()
    print(
        f"Question: {question}"
    )

    if not result["success"]:

        print()
        print(
            "[ERROR] "
            f"{result['message']}"
        )

        print()
        print_supported_trends()

        raise SystemExit(1)

    print(
        f"Detected Trend: "
        f"{result['trend_label']} "
        f"({result['trend_scope']})"
    )

    print(
        f"[OK] Evidence count: "
        f"{result['evidence_count']}"
    )

    print()
    print(
        result["context"]
    )


if __name__ == "__main__":
    main()