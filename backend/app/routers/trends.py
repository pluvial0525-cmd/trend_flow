from fastapi import APIRouter, HTTPException

from app.services.trend_service import (
    get_trend_statuses,
    get_trend_detail,
    get_recent_revival_detail,
    get_trend_graph,
)


router = APIRouter(
    prefix="/api/trends",
    tags=["Trends"],
)


@router.get("/status")
def trend_status():
    return {
        "items": get_trend_statuses()
    }


@router.get("/{trend_scope}")
def trend_detail(trend_scope: str):
    allowed_trends = {
        "skinny_jeans",
        "low_rise",
        "velour_tracksuit",
        "ugg",
        "duffle_coat",
    }

    if trend_scope not in allowed_trends:
        raise HTTPException(
            status_code=404,
            detail="Trend not found",
        )

    items = get_trend_detail(trend_scope)

    return {
        "trend": trend_scope,
        "count": len(items),
        "items": items,
    }

@router.get("/{trend_scope}/recent")
def trend_recent_detail(trend_scope: str):
    return {
        "trend": trend_scope,
        "items": get_recent_revival_detail(trend_scope),
    }

@router.get("/{trend_scope}/graph")
def trend_graph(trend_scope: str):
    allowed_trends = {
        "skinny_jeans",
        "low_rise",
        "velour_tracksuit",
        "ugg",
        "duffle_coat",
    }

    if trend_scope not in allowed_trends:
        raise HTTPException(
            status_code=404,
            detail="Trend not found",
        )

    return get_trend_graph(trend_scope)