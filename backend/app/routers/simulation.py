from fastapi import APIRouter, Query

from app.services.simulation_service import (
    generate_trend_city,
    simulate_rumor_spread,
    compare_rumor_starters,
    run_monte_carlo_comparison,
)


router = APIRouter(
    prefix="/api/simulation",
    tags=["Simulation"],
)


@router.get("/city")
def get_city(
    population: int = Query(
        default=300,
        ge=100,
        le=500,
    ),
):
    return generate_trend_city(
        population=population,
    )

@router.get("/rumor")
def spread_rumor(
    population: int = Query(
        default=300,
        ge=100,
        le=500,
    ),
    starter_id: str | None = None,
):
    return simulate_rumor_spread(
        population=population,
        starter_id=starter_id,
    )

@router.get("/compare")
def compare_starters(
    population: int = Query(
        default=300,
        ge=100,
        le=500,
    ),
):
    return compare_rumor_starters(
        population=population,
    )

@router.get("/monte-carlo")
def monte_carlo_simulation(
    population: int = Query(
        default=300,
        ge=100,
        le=500,
    ),
    runs: int = Query(
        default=100,
        ge=10,
        le=500,
    ),
):
    return run_monte_carlo_comparison(
        population=population,
        runs=runs,
    )