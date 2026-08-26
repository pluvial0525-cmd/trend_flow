from app.database import driver, NEO4J_DATABASE


def get_trend_statuses():
    query = """
    MATCH (a)-[r]->(b)
    WHERE r.trend_scope IN [
        'skinny_jeans',
        'low_rise',
        'ugg',
        'velour_tracksuit'
    ]

    WITH r,
    CASE r.trend_scope
        WHEN 'skinny_jeans' THEN 2025
        WHEN 'low_rise' THEN 2021
        WHEN 'ugg' THEN 2021
        WHEN 'velour_tracksuit' THEN 2019
    END AS revival_start,
    toInteger(substring(toString(r.date), 0, 4)) AS event_year

    WHERE event_year >= revival_start

    WITH
        r.trend_scope AS trend,
        CASE
            WHEN type(r) IN [
                'ASSOCIATED_WITH',
                'DISCUSSED',
                'PRESENTED',
                'REVIVED_AS'
            ] THEN 'SIGNAL'

            WHEN type(r) IN [
                'WORE',
                'CAMPAIGNED_FOR',
                'FEATURED_STYLE'
            ] THEN 'EXPOSURE'

            WHEN type(r) IN [
                'RELEASED',
                'LAUNCHED',
                'FEATURED_PRODUCT',
                'STYLE_OF'
            ] THEN 'PRODUCT'

            WHEN type(r) IN [
                'SEARCHED_ON',
                'SOLD_ON',
                'SALES_INCREASED'
            ] THEN 'MARKET'

            ELSE null
        END AS stage

    WHERE stage IS NOT NULL

    WITH trend, collect(DISTINCT stage) AS stages

    RETURN
        trend,
        stages,

        CASE
            WHEN 'SIGNAL' IN stages THEN true
            ELSE false
        END AS signal,

        CASE
            WHEN 'EXPOSURE' IN stages THEN true
            ELSE false
        END AS exposure,

        CASE
            WHEN 'PRODUCT' IN stages THEN true
            ELSE false
        END AS product,

        CASE
            WHEN 'MARKET' IN stages THEN true
            ELSE false
        END AS market,

        round(
            toFloat(size(stages)) / 4 * 100,
            1
        ) AS stage_completion_percent,

        CASE
            WHEN 'SIGNAL' IN stages
             AND 'EXPOSURE' IN stages
             AND 'PRODUCT' IN stages
             AND 'MARKET' IN stages
                THEN 'REVIVED'

            WHEN 'SIGNAL' IN stages
             AND 'EXPOSURE' IN stages
             AND 'PRODUCT' IN stages
             AND NOT ('MARKET' IN stages)
                THEN 'EARLY_REVIVAL_SIGNAL'

            WHEN 'SIGNAL' IN stages
             AND 'EXPOSURE' IN stages
                THEN 'EMERGING_SIGNAL'

            WHEN 'SIGNAL' IN stages
                THEN 'WEAK_SIGNAL'

            ELSE 'UNCLASSIFIED'
        END AS final_status

    ORDER BY stage_completion_percent DESC
    """

    records, _, _ = driver.execute_query(
        query,
        database_=NEO4J_DATABASE,
    )

    return [
        {
            "trend": record["trend"],
            "stages": record["stages"],
            "signal": record["signal"],
            "exposure": record["exposure"],
            "product": record["product"],
            "market": record["market"],
            "stage_completion_percent": record[
                "stage_completion_percent"
            ],
            "final_status": record["final_status"],
        }
        for record in records
    ]

def get_trend_detail(trend_scope: str):
    query = """
    MATCH (a)-[r]->(b)
    WHERE r.trend_scope = $trend_scope

    RETURN
        a.name AS source,
        labels(a) AS source_labels,
        type(r) AS relationship,
        b.name AS target,
        labels(b) AS target_labels,
        r.date AS date,
        r.period AS period,
        r.evidence_level AS evidence_level,
        r.trend_state AS trend_state,
        r.context AS context,
        r.source_title AS source_title,
        r.source_url AS source_url

    ORDER BY r.date
    """

    records, _, _ = driver.execute_query(
        query,
        trend_scope=trend_scope,
        database_=NEO4J_DATABASE,
    )

    return [
        {
            "source": record["source"],
            "source_labels": record["source_labels"],
            "relationship": record["relationship"],
            "target": record["target"],
            "target_labels": record["target_labels"],
            "date": record["date"],
            "period": record["period"],
            "evidence_level": record["evidence_level"],
            "trend_state": record["trend_state"],
            "context": record["context"],
            "source_title": record["source_title"],
            "source_url": record["source_url"],
        }
        for record in records
    ]

def get_recent_revival_detail(trend_scope: str):
    query = """
    MATCH (a)-[r]->(b)
    WHERE r.trend_scope = $trend_scope

    WITH a, r, b,
    CASE r.trend_scope
        WHEN 'skinny_jeans' THEN 2025
        WHEN 'low_rise' THEN 2021
        WHEN 'velour_tracksuit' THEN 2019
        WHEN 'ugg' THEN 2021
        WHEN 'duffle_coat' THEN 2021
    END AS revival_start,
    toInteger(substring(toString(r.date), 0, 4)) AS event_year

    WHERE event_year >= revival_start

    RETURN
        a.name AS source,
        labels(a) AS source_labels,
        type(r) AS relationship,
        b.name AS target,
        labels(b) AS target_labels,
        r.date AS date,
        r.evidence_level AS evidence_level,
        r.trend_state AS trend_state,
        r.context AS context

    ORDER BY r.date
    """

    records, _, _ = driver.execute_query(
        query,
        trend_scope=trend_scope,
        database_=NEO4J_DATABASE,
    )

    return [
        dict(record)
        for record in records
    ]

def get_trend_graph(trend_scope: str):
    query = """
    MATCH (a)-[r]->(b)
    WHERE r.trend_scope = $trend_scope

    RETURN
        a.node_id AS source_id,
        a.name AS source_name,
        labels(a) AS source_labels,

        type(r) AS relationship,
        r.relationship_id AS relationship_id,
        r.date AS date,
        r.period AS period,
        r.evidence_level AS evidence_level,
        r.trend_state AS trend_state,
        r.context AS context,

        b.node_id AS target_id,
        b.name AS target_name,
        labels(b) AS target_labels

    ORDER BY r.date
    """

    records, _, _ = driver.execute_query(
        query,
        trend_scope=trend_scope,
        database_=NEO4J_DATABASE,
    )

    nodes = {}
    edges = []

    for record in records:
        source_id = record["source_id"]
        target_id = record["target_id"]

        if source_id not in nodes:
            nodes[source_id] = {
                "id": source_id,
                "name": record["source_name"],
                "labels": [
                    label
                    for label in record["source_labels"]
                    if label != "TrendFlowNode"
                ],
            }

        if target_id not in nodes:
            nodes[target_id] = {
                "id": target_id,
                "name": record["target_name"],
                "labels": [
                    label
                    for label in record["target_labels"]
                    if label != "TrendFlowNode"
                ],
            }

        edges.append(
            {
                "id": record["relationship_id"],
                "source": source_id,
                "target": target_id,
                "relationship": record["relationship"],
                "date": record["date"],
                "period": record["period"],
                "evidence_level": record["evidence_level"],
                "trend_state": record["trend_state"],
                "context": record["context"],
            }
        )

    return {
        "trend": trend_scope,
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": list(nodes.values()),
        "edges": edges,
    }