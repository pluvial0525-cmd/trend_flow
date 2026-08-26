from __future__ import annotations

from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from graphrag.analyze_trend import (
    analyze_question_detail,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/graphrag",
    tags=["GraphRAG"],
)


# ============================================================
# REQUEST
# ============================================================

class GraphRAGRequest(
    BaseModel
):
    question: str = Field(
        ...,
        min_length=2,
        description="패션 트렌드에 대한 질문",
        examples=[
            "스키니진은 다시 유행하고 있어?"
        ],
    )


# ============================================================
# HEALTH
# ============================================================

@router.get(
    "/health"
)
def graphrag_health():

    return {
        "status": "ok",
        "service": "graphrag",
    }


# ============================================================
# ANALYZE
# ============================================================

@router.post(
    "/analyze"
)
def analyze_trend(
    request: GraphRAGRequest,
):

    question = (
        request.question.strip()
    )


    try:

        result = (
            analyze_question_detail(
                question
            )
        )


        if not result[
            "success"
        ]:

            raise HTTPException(
                status_code=400,
                detail=result[
                    "message"
                ],
            )


        return result


    except HTTPException:
        raise


    except Exception as error:

        print(
            "GraphRAG API Error:",
            error,
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "GraphRAG 분석 중 "
                "오류가 발생했습니다."
            ),
        )