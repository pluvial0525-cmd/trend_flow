from __future__ import annotations

import sys
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from graphrag.build_context import (
    build_context_from_question,
)


# ============================================================
# ENV / OPENAI
# ============================================================

load_dotenv()

client = OpenAI()


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
너는 패션 트렌드 GraphRAG 분석 시스템이다.

반드시 제공된 GRAPH CONTEXT만 사용해서 답변해야 한다.
외부 지식이나 추측을 섞지 않는다.

규칙:
1. FACT와 ASSOCIATION을 구분해서 해석한다.
2. 셀럽 착용이나 미디어 언급만으로
   대중적 유행이 확정되었다고 판단하지 않는다.
3. 판매량, 검색량, 거래량 등 정량 근거가 없다면
   부족한 근거로 명시한다.
4. 관계의 source_note / caution 내용을 반드시 반영한다.
5. 인과관계가 확인되지 않은 관계는
   인과로 표현하지 않는다.
6. 결론은 과도하게 단정하지 않는다.
7. 답변은 한국어로 작성한다.
8. 제공된 그래프 데이터에서 확인되지 않는 사실은
   만들어내지 않는다.

답변 형식:

[관찰된 근거]
핵심적인 FACT와 ASSOCIATION을 구분해 설명

[흐름 분석]
과거 → 변화 → 최근의 흐름을 설명

[부족한 근거]
현재 그래프 데이터에서 확인되지 않는 부분

[현재 판단]
질문에 대한 최종 판단
"""


# ============================================================
# OPENAI ANALYSIS
# ============================================================

def generate_answer(
    question: str,
    trend_label: str,
    graph_context: str,
) -> str:

    user_prompt = f"""
사용자 질문:
{question}

분석 대상:
{trend_label}

아래 GRAPH CONTEXT만 사용해서 질문에 답하세요.

================ GRAPH CONTEXT ================
{graph_context}
================================================

질문에 직접 필요한 근거를 우선 사용하세요.
모든 근거를 억지로 언급할 필요는 없습니다.

FACT와 ASSOCIATION을 구분하세요.

미디어 언급, 셀럽 착용, 제품 출시만으로
대중적 유행이 확정되었다고 판단하지 마세요.

정량적인 판매·검색·거래 근거가 없다면
그 한계를 반드시 명시하세요.
"""

    response = client.responses.create(
        model="gpt-5.6-luna",
        instructions=SYSTEM_PROMPT,
        input=user_prompt,
    )

    return response.output_text


# ============================================================
# GRAPH RAG
# ============================================================

def analyze_question_detail(
    question: str,
) -> dict[str, Any]:

    retrieval = (
        build_context_from_question(
            question
        )
    )

    # --------------------------------------------
    # Trend detection failed
    # --------------------------------------------

    if not retrieval["success"]:

        return {
            "success": False,
            "question": question,

            "trend": None,

            "evidence_count": 0,

            "answer": None,

            "evidence": [],

            "message":
                retrieval["message"],
        }


    # --------------------------------------------
    # Graph retrieval result
    # --------------------------------------------

    trend_scope = (
        retrieval[
            "trend_scope"
        ]
    )

    trend_label = (
        retrieval[
            "trend_label"
        ]
    )

    evidence = (
        retrieval.get(
            "evidence",
            [],
        )
    )

    graph_context = (
        retrieval[
            "context"
        ]
    )


    # --------------------------------------------
    # LLM
    # --------------------------------------------

    answer = generate_answer(
        question=question,
        trend_label=trend_label,
        graph_context=graph_context,
    )


    # --------------------------------------------
    # Frontend용 evidence 정리
    # --------------------------------------------

    frontend_evidence = []

    for item in evidence:

        frontend_evidence.append(
            {
                "source":
                    item.get(
                        "source"
                    ),

                "source_labels":
                    item.get(
                        "source_labels",
                        [],
                    ),

                "relationship":
                    item.get(
                        "relationship"
                    ),

                "target":
                    item.get(
                        "target"
                    ),

                "target_labels":
                    item.get(
                        "target_labels",
                        [],
                    ),

                "date":
                    item.get(
                        "date"
                    ),

                "period":
                    item.get(
                        "period"
                    ),

                "trend_state":
                    item.get(
                        "trend_state"
                    ),

                "evidence_level":
                    item.get(
                        "evidence_level"
                    ),

                "evidence_type":
                    item.get(
                        "evidence_type"
                    ),

                "context":
                    item.get(
                        "context"
                    ),

                "source_note":
                    item.get(
                        "source_note"
                    ),

                "source_title":
                    item.get(
                        "source_title"
                    ),

                "source_url":
                    item.get(
                        "source_url"
                    ),

                "relationship_id":
                    item.get(
                        "relationship_id"
                    ),
            }
        )


    # --------------------------------------------
    # Response
    # --------------------------------------------

    return {
        "success": True,

        "question":
            question,

        "trend": {
            "scope":
                trend_scope,

            "label":
                trend_label,
        },

        "evidence_count":
            len(
                frontend_evidence
            ),

        "answer":
            answer,

        "evidence":
            frontend_evidence,
    }


# ============================================================
# 기존 CLI
# ============================================================

def main():

    if len(sys.argv) < 2:

        print(
            "사용법:"
        )

        print(
            'uv run python '
            'graphrag\\analyze_trend.py '
            '"스키니진은 다시 유행하고 있어?"'
        )

        raise SystemExit(1)


    question = " ".join(
        sys.argv[1:]
    ).strip()


    print(
        "=" * 72
    )

    print(
        "GraphRAG Trend Analysis"
    )

    print(
        "=" * 72
    )

    print()

    print(
        f"Question: {question}"
    )

    print()


    result = (
        analyze_question_detail(
            question
        )
    )


    if not result["success"]:

        print(
            result["message"]
        )

        return


    print(
        f"Detected Trend: "
        f"{result['trend']['label']} "
        f"({result['trend']['scope']})"
    )

    print(
        f"Evidence: "
        f"{result['evidence_count']}"
    )

    print()

    print(
        result["answer"]
    )


if __name__ == "__main__":
    main()