from fastapi import APIRouter, HTTPException

from app.database import driver


router = APIRouter(
    prefix="/api",
    tags=["Trend Flow"],
)


# =========================================================
# Neo4j 값을 JSON에서 안전하게 사용할 수 있도록 변환
# =========================================================

def serialize_value(value):
    if value is None:
        return None

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    if isinstance(value, list):
        return [
            serialize_value(item)
            for item in value
        ]

    if isinstance(value, dict):
        return {
            key: serialize_value(val)
            for key, val in value.items()
        }

    if hasattr(value, "iso_format"):
        return value.iso_format()

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return str(value)


# =========================================================
# TREND FLOW 전체 그래프
# =========================================================

@router.get("/trend-flow")
def get_trend_flow():
    node_query = """
    MATCH (n:TrendFlowNode)

    RETURN
        n.node_id AS node_id,
        n.name AS name,
        labels(n) AS labels,
        n.trend_group AS trend_group,
        n.node_role AS node_role,
        properties(n) AS properties

    ORDER BY n.name
    """

    relationship_query = """
    MATCH
        (source:TrendFlowNode)
        -[r]->
        (target:TrendFlowNode)

    RETURN
        source.node_id AS source_id,
        source.name AS source_name,
        source.trend_group AS source_group,
        source.node_role AS source_role,

        type(r) AS relationship,

        target.node_id AS target_id,
        target.name AS target_name,
        target.trend_group AS target_group,
        target.node_role AS target_role,

        r.date AS date,
        r.year AS year,
        r.period AS period,
        r.context AS context,

        properties(r) AS properties

    ORDER BY
        coalesce(
            toString(r.date),
            toString(r.year),
            r.period,
            ''
        ),
        source.name
    """

    nodes = []
    relationships = []

    with driver.session() as session:
        node_result = session.run(
            node_query
        )

        for record in node_result:
            node_properties = dict(
                record["properties"] or {}
            )

            nodes.append(
                {
                    "node_id": record["node_id"],
                    "name": record["name"],
                    "labels": list(
                        record["labels"] or []
                    ),
                    "trend_group": record["trend_group"],
                    "node_role": record["node_role"],
                    "properties": serialize_value(
                        node_properties
                    ),
                }
            )

        relationship_result = session.run(
            relationship_query
        )

        for record in relationship_result:
            relationship_properties = dict(
                record["properties"] or {}
            )

            relationships.append(
                {
                    "source_id": record["source_id"],
                    "source_name": record["source_name"],
                    "source_group": record["source_group"],
                    "source_role": record["source_role"],
                    "relationship": record["relationship"],
                    "target_id": record["target_id"],
                    "target_name": record["target_name"],
                    "target_group": record["target_group"],
                    "target_role": record["target_role"],
                    "date": serialize_value(
                        record["date"]
                    ),
                    "year": serialize_value(
                        record["year"]
                    ),
                    "period": serialize_value(
                        record["period"]
                    ),
                    "context": serialize_value(
                        record["context"]
                    ),
                    "properties": serialize_value(
                        relationship_properties
                    ),
                }
            )

    return {
        "node_count": len(nodes),
        "relationship_count": len(relationships),
        "nodes": nodes,
        "relationships": relationships,
    }


# =========================================================
# NODE EVIDENCE - 1 HOP + 2 HOP
#
# 선택한 노드 자체의 직접 관계뿐 아니라
# 한 단계 더 연결된 관계까지 탐색한다.
#
# 예:
# 소녀시대 -> 컬러 스키니진 -> 옥션
#                     SOLD_ON / 판매량 Evidence까지 조회
# =========================================================

@router.get(
    "/trend-flow/evidence/{node_name}"
)
def get_trend_flow_evidence(
    node_name: str,
):
    node_query = """
    MATCH (n:TrendFlowNode)
    WHERE n.name = $node_name

    RETURN
        n.node_id AS node_id,
        n.name AS name,
        labels(n) AS labels,
        n.trend_group AS trend_group,
        n.node_role AS node_role,
        properties(n) AS properties

    LIMIT 1
    """

    evidence_query = """
    // -----------------------------------------------------
    // 1-hop: 선택한 노드에 직접 연결된 Evidence
    // -----------------------------------------------------
    MATCH (selected:TrendFlowNode)
    WHERE selected.name = $node_name

    MATCH (selected)-[r]-(other:TrendFlowNode)
    WHERE
        r.context IS NOT NULL
        OR r.reaction IS NOT NULL
        OR r.metric IS NOT NULL
        OR r.metric_display_value IS NOT NULL
        OR r.metric_change_text IS NOT NULL
        OR r.evidence_type IS NOT NULL
        OR r.article_url IS NOT NULL
        OR r.source_url IS NOT NULL

    WITH
        selected,
        r,
        other,
        1 AS depth

    RETURN DISTINCT
        depth,

        CASE
            WHEN startNode(r) = selected
            THEN 'OUT'
            ELSE 'IN'
        END AS direction,

        startNode(r).node_id AS source_id,
        startNode(r).name AS source_name,
        endNode(r).node_id AS target_id,
        endNode(r).name AS target_name,

        other.node_id AS related_node_id,
        other.name AS related_node_name,
        other.trend_group AS related_trend_group,
        other.node_role AS related_node_role,

        type(r) AS relationship,

        r.date AS date,
        r.year AS year,
        r.period AS period,

        r.context AS context,
        r.reaction AS reaction,

        r.metric AS metric,
        r.metric_display_value AS metric_display_value,
        r.metric_change_text AS metric_change_text,

        r.evidence_type AS evidence_type,
        r.evidence_level AS evidence_level,
        r.trend_scope AS trend_scope,

        r.source_title AS source_title,
        r.source_url AS source_url,
        r.article_url AS article_url,

        properties(r) AS properties

    UNION

    // -----------------------------------------------------
    // 2-hop: 선택 노드 -> 중간 노드 -> Evidence
    // -----------------------------------------------------
    MATCH (selected:TrendFlowNode)
    WHERE selected.name = $node_name

    MATCH
        (selected)-[first]-(middle:TrendFlowNode)
        -[r]-(other:TrendFlowNode)

    WHERE
        other <> selected
        AND id(first) <> id(r)
        AND (
            first.trend_scope IS NULL
            OR r.trend_scope IS NULL
            OR first.trend_scope = r.trend_scope
        )
        AND (
            r.context IS NOT NULL
            OR r.reaction IS NOT NULL
            OR r.metric IS NOT NULL
            OR r.metric_display_value IS NOT NULL
            OR r.metric_change_text IS NOT NULL
            OR r.evidence_type IS NOT NULL
            OR r.article_url IS NOT NULL
            OR r.source_url IS NOT NULL
        )

    WITH
        selected,
        r,
        other,
        2 AS depth

    RETURN DISTINCT
        depth,

        CASE
            WHEN startNode(r) = selected
            THEN 'OUT'
            WHEN endNode(r) = selected
            THEN 'IN'
            ELSE 'PATH'
        END AS direction,

        startNode(r).node_id AS source_id,
        startNode(r).name AS source_name,
        endNode(r).node_id AS target_id,
        endNode(r).name AS target_name,

        other.node_id AS related_node_id,
        other.name AS related_node_name,
        other.trend_group AS related_trend_group,
        other.node_role AS related_node_role,

        type(r) AS relationship,

        r.date AS date,
        r.year AS year,
        r.period AS period,

        r.context AS context,
        r.reaction AS reaction,

        r.metric AS metric,
        r.metric_display_value AS metric_display_value,
        r.metric_change_text AS metric_change_text,

        r.evidence_type AS evidence_type,
        r.evidence_level AS evidence_level,
        r.trend_scope AS trend_scope,

        r.source_title AS source_title,
        r.source_url AS source_url,
        r.article_url AS article_url,

        properties(r) AS properties
    """

    with driver.session() as session:
        node_record = session.run(
            node_query,
            node_name=node_name,
        ).single()

        if node_record is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Trend Flow node not found: "
                    f"{node_name}"
                ),
            )

        node_properties = dict(
            node_record["properties"] or {}
        )

        evidence_result = session.run(
            evidence_query,
            node_name=node_name,
        )

        evidence = []
        seen = set()

        for record in evidence_result:
            relationship_properties = dict(
                record["properties"] or {}
            )

            unique_key = (
                record["source_id"],
                record["relationship"],
                record["target_id"],
            )

            # 같은 관계가 1-hop/2-hop 경로에서 중복되면
            # 더 가까운 관계(1-hop)를 우선 사용한다.
            if unique_key in seen:
                continue

            seen.add(unique_key)

            article_url = (
                record["article_url"]
                or record["source_url"]
            )

            evidence.append(
                {
                    "depth": record["depth"],
                    "direction": record["direction"],
                    "source_id": record["source_id"],
                    "source_name": record["source_name"],
                    "target_id": record["target_id"],
                    "target_name": record["target_name"],
                    "relationship": record["relationship"],
                    "related_node_id": record["related_node_id"],
                    "related_node_name": record["related_node_name"],
                    "related_trend_group": record["related_trend_group"],
                    "related_node_role": record["related_node_role"],
                    "date": serialize_value(
                        record["date"]
                    ),
                    "year": serialize_value(
                        record["year"]
                    ),
                    "period": serialize_value(
                        record["period"]
                    ),
                    "context": serialize_value(
                        record["context"]
                    ),
                    "reaction": serialize_value(
                        record["reaction"]
                    ),
                    "metric": serialize_value(
                        record["metric"]
                    ),
                    "metric_display_value": serialize_value(
                        record["metric_display_value"]
                    ),
                    "metric_change_text": serialize_value(
                        record["metric_change_text"]
                    ),
                    "evidence_type": serialize_value(
                        record["evidence_type"]
                    ),
                    "evidence_level": serialize_value(
                        record["evidence_level"]
                    ),
                    "trend_scope": serialize_value(
                        record["trend_scope"]
                    ),
                    "source_title": serialize_value(
                        record["source_title"]
                    ),
                    "source_url": serialize_value(
                        record["source_url"]
                    ),
                    "article_url": serialize_value(
                        article_url
                    ),
                    "properties": serialize_value(
                        relationship_properties
                    ),
                }
            )

    evidence.sort(
        key=lambda item: (
            item["depth"],
            str(item["date"] or item["year"] or ""),
            item["relationship"],
        )
    )

    return {
        "node": {
            "node_id": node_record["node_id"],
            "name": node_record["name"],
            "labels": list(
                node_record["labels"] or []
            ),
            "trend_group": node_record["trend_group"],
            "node_role": node_record["node_role"],
            "properties": serialize_value(
                node_properties
            ),
        },
        "evidence_count": len(evidence),
        "evidence": evidence,
    }