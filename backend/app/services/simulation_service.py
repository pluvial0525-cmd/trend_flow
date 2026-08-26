import random
from collections import Counter

RUMORS = {
    "dating_skinny": {
        "id": "dating_skinny",
        "text": "소개팅에 스키니진 입고 가면 애프터 못 받는대.",
        "category": "연애/패션",
        "sensational": 0.90,
        "fashion_relevance": 0.80,
        "social_relevance": 0.85,
        "credibility": 0.45,
    },

    "skinny_comeback": {
        "id": "skinny_comeback",
        "text": "요즘 스키니진이 다시 유행한대.",
        "category": "패션 트렌드",
        "sensational": 0.45,
        "fashion_relevance": 1.00,
        "social_relevance": 0.50,
        "credibility": 0.70,
    },

    "brand_release": {
        "id": "brand_release",
        "text": "요즘 브랜드들이 슬림핏 데님을 다시 출시한대.",
        "category": "브랜드/상품",
        "sensational": 0.20,
        "fashion_relevance": 0.90,
        "social_relevance": 0.30,
        "credibility": 0.85,
    },
}


# --------------------------------------------------
# Trend City 기본 설정
# --------------------------------------------------

OCCUPATIONS = [
    ("대학생", 0.16),
    ("취업준비생", 0.06),
    ("사무직", 0.20),
    ("서비스직", 0.12),
    ("판매직", 0.08),
    ("전문직", 0.07),
    ("자영업", 0.08),
    ("공무원/교직", 0.07),
    ("생산/기술직", 0.07),
    ("프리랜서", 0.05),
    ("패션업계", 0.025),
    ("콘텐츠 크리에이터", 0.012),
    ("패션 인플루언서", 0.003),
]


PERSONALITIES = [
    "외향적",
    "내향적",
    "신중함",
    "유행민감",
    "회의적",
    "호기심많음",
]


DISTRICTS = [
    "대학가",
    "업무지구",
    "주거지역",
    "상업지역",
    "문화지역",
]


COMMUNITIES = [
    "대학교",
    "회사A",
    "회사B",
    "회사C",
    "러닝모임",
    "헬스장",
    "게임모임",
    "독서모임",
    "동네친구",
    "패션커뮤니티",
    "SNS커뮤니티",
]


# --------------------------------------------------
# 소문 전달 방식
# --------------------------------------------------

TRANSMISSION_CHANNELS = {
    "WORD_OF_MOUTH": {
        "label": "입소문",
        "description": "친구, 지인, 동료 사이에서 직접 말로 전달",
    },
    "SNS": {
        "label": "SNS",
        "description": "SNS 게시물, 스토리, 메신저 공유로 전달",
    },
    "VIDEO": {
        "label": "영상",
        "description": "숏폼, 영상 콘텐츠를 통해 전달",
    },
    "COMMUNITY": {
        "label": "커뮤니티",
        "description": "단체채팅, 온라인 커뮤니티, 모임 내부에서 전달",
    },
}


def choose_transmission_channel(
    sender,
    receiver,
    connection,
    rng,
):
    """
    한 번의 소문 전달이 어떤 방식으로 이루어지는지 결정한다.

    지역이 아니라 실제 사람의 성향, 직업, 관계,
    공통 커뮤니티를 기준으로 전달 방식을 선택한다.
    """

    common_communities = connection.get(
        "common_communities",
        [],
    )

    closeness = connection.get(
        "closeness",
        0.5,
    )

    contact_frequency = connection.get(
        "contact_frequency",
        0.5,
    )

    # 기본 가중치
    weights = {
        "WORD_OF_MOUTH": 32.0,
        "SNS": 20.0,
        "VIDEO": 5.0,
        "COMMUNITY": 12.0,
    }

    # -----------------------------
    # 1. 입소문
    # -----------------------------
    weights["WORD_OF_MOUTH"] += (
        closeness * 28
    )

    weights["WORD_OF_MOUTH"] += (
        contact_frequency * 10
    )

    if sender["personality"] == "외향적":
        weights["WORD_OF_MOUTH"] += 8

    if "동네친구" in common_communities:
        weights["WORD_OF_MOUTH"] += 14

    # -----------------------------
    # 2. SNS
    # -----------------------------
    weights["SNS"] += (
        sender["activity"] * 18
    )

    weights["SNS"] += (
        sender["influence"] * 8
    )

    if "SNS커뮤니티" in common_communities:
        weights["SNS"] += 30

    if sender["occupation"] in [
        "콘텐츠 크리에이터",
        "패션 인플루언서",
        "패션업계",
    ]:
        weights["SNS"] += 16

    # -----------------------------
    # 3. 영상
    # -----------------------------
    weights["VIDEO"] += (
        sender["influence"] * 14
    )

    weights["VIDEO"] += (
        sender["activity"] * 8
    )

    if sender["occupation"] == "콘텐츠 크리에이터":
        weights["VIDEO"] += 36

    elif sender["occupation"] == "패션 인플루언서":
        weights["VIDEO"] += 44

    elif sender["occupation"] == "패션업계":
        weights["VIDEO"] += 12

    # -----------------------------
    # 4. 커뮤니티
    # -----------------------------
    if common_communities:
        weights["COMMUNITY"] += 28

    for community in common_communities:
        if community in [
            "패션커뮤니티",
            "게임모임",
            "독서모임",
            "러닝모임",
            "헬스장",
            "대학교",
            "회사A",
            "회사B",
            "회사C",
        ]:
            weights["COMMUNITY"] += 8

    channels = list(weights.keys())
    channel_weights = [
        max(0.1, weights[channel])
        for channel in channels
    ]

    return rng.choices(
        channels,
        weights=channel_weights,
        k=1,
    )[0]


def calculate_channel_factor(
    channel,
    sender,
    receiver,
    connection,
):
    """
    전달 방식이 실제 전파 확률에 주는 작은 보정값.

    channel이 결과를 완전히 지배하지 않도록
    보정 폭은 작게 유지한다.
    """

    common_communities = connection.get(
        "common_communities",
        [],
    )

    if channel == "WORD_OF_MOUTH":
        return min(
            0.045,
            connection.get("closeness", 0) * 0.035
            + connection.get("contact_frequency", 0) * 0.010,
        )

    if channel == "SNS":
        bonus = (
            sender["activity"] * 0.020
            + sender["influence"] * 0.015
        )

        if "SNS커뮤니티" in common_communities:
            bonus += 0.025

        return min(
            0.060,
            bonus,
        )

    if channel == "VIDEO":
        bonus = (
            sender["influence"] * 0.025
            + sender["activity"] * 0.010
        )

        if sender["occupation"] in [
            "콘텐츠 크리에이터",
            "패션 인플루언서",
        ]:
            bonus += 0.025

        return min(
            0.065,
            bonus,
        )

    if channel == "COMMUNITY":
        bonus = 0.010

        if common_communities:
            bonus += 0.030

        return min(
            0.050,
            bonus,
        )

    return 0.0


def weighted_choice(items):
    values = [item[0] for item in items]
    weights = [item[1] for item in items]

    return random.choices(
        values,
        weights=weights,
        k=1,
    )[0]


def generate_age(occupation):
    if occupation == "대학생":
        return random.randint(19, 27)

    if occupation == "취업준비생":
        return random.randint(22, 31)

    if occupation in [
        "콘텐츠 크리에이터",
        "패션 인플루언서",
    ]:
        return random.randint(20, 38)

    return random.randint(20, 55)


def generate_fashion_interest(
    occupation,
    personality,
):
    score = random.uniform(0.15, 0.75)

    if occupation == "패션업계":
        score += 0.20

    elif occupation == "패션 인플루언서":
        score += 0.30

    elif occupation == "콘텐츠 크리에이터":
        score += 0.15

    if personality == "유행민감":
        score += 0.15

    elif personality == "호기심많음":
        score += 0.08

    elif personality == "회의적":
        score -= 0.08

    return round(
        max(0.05, min(score, 1.0)),
        2,
    )


def generate_activity(
    occupation,
    personality,
):
    score = random.uniform(0.20, 0.75)

    if personality == "외향적":
        score += 0.15

    elif personality == "내향적":
        score -= 0.12

    if occupation in [
        "서비스직",
        "판매직",
        "콘텐츠 크리에이터",
        "패션 인플루언서",
    ]:
        score += 0.10

    return round(
        max(0.05, min(score, 1.0)),
        2,
    )


def generate_influence(
    occupation,
    activity,
):
    base = random.uniform(0.10, 0.55)

    if occupation == "콘텐츠 크리에이터":
        base += 0.25

    elif occupation == "패션 인플루언서":
        base += 0.40

    elif occupation == "패션업계":
        base += 0.12

    base += activity * 0.10

    return round(
        max(0.05, min(base, 1.0)),
        2,
    )


def choose_district(occupation):
    if occupation in ["대학생", "취업준비생"]:
        choices = [
            "대학가",
            "주거지역",
            "상업지역",
        ]
        weights = [0.60, 0.25, 0.15]

    elif occupation in [
        "사무직",
        "전문직",
        "공무원/교직",
    ]:
        choices = [
            "업무지구",
            "주거지역",
            "상업지역",
        ]
        weights = [0.55, 0.30, 0.15]

    elif occupation in [
        "서비스직",
        "판매직",
        "자영업",
    ]:
        choices = [
            "상업지역",
            "주거지역",
            "업무지구",
        ]
        weights = [0.55, 0.30, 0.15]

    elif occupation in [
        "패션업계",
        "콘텐츠 크리에이터",
        "패션 인플루언서",
    ]:
        choices = [
            "문화지역",
            "상업지역",
            "대학가",
        ]
        weights = [0.50, 0.30, 0.20]

    else:
        choices = DISTRICTS
        weights = [0.15, 0.20, 0.35, 0.20, 0.10]

    return random.choices(
        choices,
        weights=weights,
        k=1,
    )[0]


def choose_communities(
    occupation,
    district,
):
    result = set()

    # 직업 기반 기본 커뮤니티
    if occupation == "대학생":
        result.add("대학교")

    elif occupation in [
        "사무직",
        "전문직",
        "공무원/교직",
        "생산/기술직",
    ]:
        result.add(
            random.choice(
                ["회사A", "회사B", "회사C"]
            )
        )

    if occupation in [
        "패션업계",
        "콘텐츠 크리에이터",
        "패션 인플루언서",
    ]:
        result.add("패션커뮤니티")

    # 생활 기반 커뮤니티
    hobby_pool = [
        "러닝모임",
        "헬스장",
        "게임모임",
        "독서모임",
        "동네친구",
        "SNS커뮤니티",
    ]

    extra_count = random.randint(1, 2)

    result.update(
        random.sample(
            hobby_pool,
            extra_count,
        )
    )

    # 문화지역 거주자는 패션 커뮤니티 참여 확률 증가
    if (
        district == "문화지역"
        and random.random() < 0.40
    ):
        result.add("패션커뮤니티")

    return list(result)


# --------------------------------------------------
# Trend City 생성
# --------------------------------------------------

def generate_trend_city(
    population: int = 300,
    seed: int = 42,
):
    random.seed(seed)

    population = max(
        100,
        min(population, 500),
    )

    nodes = []

    # ---------------------------
    # 사람 생성
    # ---------------------------

    for i in range(population):
        occupation = weighted_choice(
            OCCUPATIONS
        )

        personality = random.choice(
            PERSONALITIES
        )

        age = generate_age(
            occupation
        )

        district = choose_district(
            occupation
        )

        fashion_interest = (
            generate_fashion_interest(
                occupation,
                personality,
            )
        )

        activity = generate_activity(
            occupation,
            personality,
        )

        influence = generate_influence(
            occupation,
            activity,
        )

        communities = choose_communities(
            occupation,
            district,
        )

        nodes.append(
            {
                "id": f"person_{i}",
                "name": f"시민 {i + 1}",
                "age": age,
                "occupation": occupation,
                "personality": personality,
                "district": district,
                "communities": communities,
                "fashion_interest": fashion_interest,
                "activity": activity,
                "influence": influence,
            }
        )

    # ---------------------------
    # 인간관계 생성
    # ---------------------------

    edges = []
    existing_edges = set()

    for person in nodes:
        person_id = person["id"]

        # 같은 커뮤니티 사람을 우선 연결
        candidates = []

        for other in nodes:
            if other["id"] == person_id:
                continue

            common_communities = set(
                person["communities"]
            ) & set(
                other["communities"]
            )

            same_district = (
                person["district"]
                == other["district"]
            )

            weight = 1

            if common_communities:
                weight += 5

            if same_district:
                weight += 2

            candidates.extend(
                [other] * weight
            )

        # --------------------------------
        # 개인별 사회적 연결 수
        # --------------------------------

        base_connections = random.randint(3, 6)

        # 활동성이 높은 사람은 연결 증가
        activity_bonus = int(
            person["activity"] * 4
        )

        connection_count = (
                base_connections
                + activity_bonus
        )

        # 직업 특성
        if person["occupation"] in [
            "서비스직",
            "판매직",
        ]:
            connection_count += 1

        elif person["occupation"] == "패션업계":
            connection_count += 2

        elif person["occupation"] == "콘텐츠 크리에이터":
            connection_count += 4

        elif person["occupation"] == "패션 인플루언서":
            connection_count += 7

        connection_count = min(
            connection_count,
            18,
        )

        selected = {}

        attempts = 0

        while (
            len(selected) < connection_count
            and attempts < 100
        ):
            target = random.choice(
                candidates
            )

            selected[
                target["id"]
            ] = target

            attempts += 1

        for target in selected.values():
            target_id = target["id"]

            pair = tuple(
                sorted(
                    [
                        person_id,
                        target_id,
                    ]
                )
            )

            if pair in existing_edges:
                continue

            existing_edges.add(pair)

            common_communities = list(
                set(person["communities"])
                & set(target["communities"])
            )

            closeness = round(
                random.uniform(
                    0.20,
                    1.00,
                ),
                2,
            )

            contact_frequency = round(
                random.uniform(
                    0.15,
                    1.00,
                ),
                2,
            )

            edges.append(
                {
                    "id": f"connection_{len(edges)}",
                    "source": person_id,
                    "target": target_id,
                    "relationship": "KNOWS",
                    "common_communities": (
                        common_communities
                    ),
                    "closeness": closeness,
                    "contact_frequency": (
                        contact_frequency
                    ),
                }
            )

    # ---------------------------
    # 요약 통계
    # ---------------------------

    occupation_counts = Counter(
        node["occupation"]
        for node in nodes
    )

    district_counts = Counter(
        node["district"]
        for node in nodes
    )

    personality_counts = Counter(
        node["personality"]
        for node in nodes
    )

    return {
        "city": "Trend City",
        "population": population,

        "summary": {
            "node_count": len(nodes),
            "edge_count": len(edges),

            "average_age": round(
                sum(
                    node["age"]
                    for node in nodes
                )
                / len(nodes),
                1,
            ),

            "average_fashion_interest": round(
                sum(
                    node["fashion_interest"]
                    for node in nodes
                )
                / len(nodes),
                2,
            ),

            "average_influence": round(
                sum(
                    node["influence"]
                    for node in nodes
                )
                / len(nodes),
                2,
            ),

            "occupations": dict(
                occupation_counts
            ),

            "districts": dict(
                district_counts
            ),

            "personalities": dict(
                personality_counts
            ),
        },

        "nodes": nodes,
        "edges": edges,
    }

def calculate_rumor_factor(
    rumor,
    sender,
    receiver,
):
    """
    소문 자체가 전파 확률에 주는 추가 보정값.

    너무 강한 보정을 방지하기 위해
    최대 약 0.10 수준의 효과만 주도록 한다.
    """

    average_fashion_interest = (
        sender["fashion_interest"]
        + receiver["fashion_interest"]
    ) / 2

    # 자극적인 이야기일수록 대화 소재가 되기 쉬움
    sensational_effect = (
        rumor["sensational"]
        * 0.025
    )

    # 일상적으로 이야기하기 좋은 소재인지
    social_effect = (
        rumor["social_relevance"]
        * 0.020
    )

    # 패션 관심도가 높은 사람들 사이에서
    # 패션 관련 소문이 조금 더 잘 전달됨
    fashion_effect = (
        rumor["fashion_relevance"]
        * average_fashion_interest
        * 0.025
    )

    # 신뢰도가 너무 낮으면 전달력이 약해짐
    credibility_effect = (
        rumor["credibility"]
        * 0.010
    )

    rumor_factor = (
        sensational_effect
        + social_effect
        + fashion_effect
        + credibility_effect
    )

    return round(
        min(rumor_factor, 0.10),
        3,
    )

def calculate_spread_probability(
    sender,
    receiver,
    connection,
    rumor,
    channel=None,
):
    """
    패션 소문 재전달 확률.

    단순히 연결되어 있다고 퍼지는 것이 아니라
    관계 + 발신자 + 수신자 특성이 함께 맞아야 확산된다.
    """

    # 기본 전파율을 낮게 시작
    probability = 0.015

    # --------------------------------
    # 1. 관계의 힘
    # --------------------------------

    probability += (
        connection["closeness"] * 0.10
    )

    probability += (
        connection["contact_frequency"] * 0.07
    )

    # 같은 커뮤니티가 있으면 약간 증가
    if connection["common_communities"]:
        probability += 0.025

    # --------------------------------
    # 2. 발신자
    # --------------------------------

    probability += (
        sender["influence"] * 0.06
    )

    probability += (
        sender["activity"] * 0.04
    )

    # --------------------------------
    # 3. 수신자
    # --------------------------------

    probability += (
        receiver["fashion_interest"] * 0.07
    )

    personality_modifier = {
        "유행민감": 0.06,
        "호기심많음": 0.04,
        "외향적": 0.03,
        "신중함": -0.025,
        "내향적": -0.035,
        "회의적": -0.07,
    }

    probability += personality_modifier.get(
        receiver["personality"],
        0,
    )

    # --------------------------------
    # 4. 직업 특성
    # --------------------------------

    if receiver["occupation"] in [
        "패션업계",
        "콘텐츠 크리에이터",
        "패션 인플루언서",
    ]:
        probability += 0.04

    # --------------------------------
    # 5. 커뮤니티 기반 전파 효과
    # --------------------------------

    common_communities = connection.get(
        "common_communities",
        []
    )

    for community in common_communities:

        if community == "SNS커뮤니티":
            probability += 0.10

        elif community == "패션커뮤니티":
            probability += 0.12

        elif community in [
            "대학교",
            "동아리",
        ]:
            probability += 0.07

        elif community in [
            "회사A",
            "회사B",
            "회사C",
        ]:
            probability += 0.04

        elif community in [
            "게임모임",
            "독서모임",
            "헬스장",
            "동네친구",
        ]:
            probability += 0.03

    # --------------------------------
    # 6. 발신자의 정보 확산력
    # --------------------------------

    sender_occupation = sender["occupation"]

    if sender_occupation == "패션 인플루언서":
        probability += 0.12

    elif sender_occupation == "콘텐츠 크리에이터":
        probability += 0.09


    elif sender_occupation == "패션업계":

        probability += 0.05

    # --------------------------------

    # 7. 소문 자체의 확산 특성

    # --------------------------------

    rumor_factor = calculate_rumor_factor(

        rumor=rumor,

        sender=sender,

        receiver=receiver,

    )

    probability += rumor_factor

    # --------------------------------
    # 8. 전달 방식(channel) 보정
    # --------------------------------
    if channel is not None:
        probability += calculate_channel_factor(
            channel=channel,
            sender=sender,
            receiver=receiver,
            connection=connection,
        )

    # --------------------------------
    # 네트워크 전체 확산 강도 보정
    # --------------------------------
    probability *= 0.72

    # --------------------------------
    # 최종 확률 범위 제한
    # --------------------------------
    return round(
        max(
            0.01,
            min(probability, 0.50),
        ),
        3,
    )


def simulate_rumor_spread(
    population: int = 300,
    seed: int = 42,
    starter_id: str | None = None,
    simulation_seed: int | None = None,
    max_steps: int = 30,
    rumor_id: str = "dating_skinny",
):

    rumor = RUMORS.get(
        rumor_id,
        RUMORS["dating_skinny"],
    )
    """
    Trend City에서 패션 소문이 퍼지는 과정을 시뮬레이션한다.
    """

    # 항상 동일한 도시 생성
    city = generate_trend_city(
        population=population,
        seed=seed,
    )

    nodes = city["nodes"]
    edges = city["edges"]

    # ------------------------------------
    # 전파 과정 전용 난수
    #
    # simulation_seed가 주어지면 재현 가능한 결과,
    # 주어지지 않으면 START를 누를 때마다 다른 결과
    # ------------------------------------
    if simulation_seed is None:
        effective_simulation_seed = (
            random.SystemRandom().randint(
                1,
                2_147_483_647,
            )
        )
    else:
        effective_simulation_seed = (
            simulation_seed
        )

    simulation_random = random.Random(
        effective_simulation_seed
    )

    person_map = {
        person["id"]: person
        for person in nodes
    }

    # ------------------------------------
    # 사람별 연결 관계 만들기
    # ------------------------------------

    adjacency = {
        person["id"]: []
        for person in nodes
    }

    for edge in edges:
        adjacency[edge["source"]].append(
            (
                edge["target"],
                edge,
            )
        )

        adjacency[edge["target"]].append(
            (
                edge["source"],
                edge,
            )
        )


    # ------------------------------------
    # 최초 유포자
    # ------------------------------------

    if (
        starter_id is None
        or starter_id not in person_map
    ):
        # 기본값은 일반 시민 중 한 명
        normal_people = [
            person
            for person in nodes
            if person["occupation"]
            not in [
                "패션 인플루언서",
                "콘텐츠 크리에이터",
                "패션업계",
            ]
        ]

        starter = simulation_random.choice(
            normal_people
        )

    else:
        starter = person_map[
            starter_id
        ]

    # ------------------------------------
    # 소문
    # ------------------------------------

    heard = {
        starter["id"]
    }

    active_spreaders = {
        starter["id"]
    }

    heard_at = {
        starter["id"]: 0
    }

    spread_events = []

    timeline = [
        {
            "step": 0,
            "new_people": [
                starter["id"]
            ],
            "new_count": 1,
            "total_heard": 1,
        }
    ]

    # ------------------------------------
    # 단계별 확산
    # ------------------------------------

    for step in range(
        1,
        max_steps + 1,
    ):
        new_people = set()
        next_spreaders = set()

        # step마다 재현 가능한 전파 난수
        step_random = random.Random(
            effective_simulation_seed
            + step * 1009
        )

        for sender_id in active_spreaders:
            sender = person_map[
                sender_id
            ]

            for (
                receiver_id,
                connection,
            ) in adjacency[sender_id]:

                # 이미 들은 사람
                if receiver_id in heard:
                    continue

                receiver = person_map[
                    receiver_id
                ]

                channel = choose_transmission_channel(
                    sender=sender,
                    receiver=receiver,
                    connection=connection,
                    rng=step_random,
                )

                probability = (
                    calculate_spread_probability(
                        sender,
                        receiver,
                        connection,
                        rumor,
                        channel,
                    )
                )

                roll = step_random.random()

                if roll <= probability:

                    # -----------------------------
                    # 1. 소문을 들음
                    # -----------------------------

                    new_people.add(receiver_id)

                    heard_at[receiver_id] = step

                    # -----------------------------
                    # 2. 다시 전달할지 결정
                    # -----------------------------

                    retransmit_probability = (
                        calculate_retransmit_probability(
                            receiver
                        )
                    )

                    retransmit_roll = (
                        step_random.random()
                    )

                    will_retransmit = (
                            retransmit_roll
                            <= retransmit_probability
                    )

                    if will_retransmit:
                        next_spreaders.add(
                            receiver_id
                        )

                    # -----------------------------
                    # 3. 전달 기록
                    # -----------------------------

                    spread_events.append(
                        {
                            "step": step,
                            "source": sender_id,
                            "target": receiver_id,

                            "probability": probability,

                            "retransmit_probability": (
                                retransmit_probability
                            ),

                            "will_retransmit": (
                                will_retransmit
                            ),

                            "relationship": "TOLD",

                            "channel": channel,

                            "channel_label": (
                                TRANSMISSION_CHANNELS[
                                    channel
                                ]["label"]
                            ),

                            "community_overlap": (
                                connection[
                                    "common_communities"
                                ]
                            ),

                            "closeness": (
                                connection[
                                    "closeness"
                                ]
                            ),

                            "contact_frequency": (
                                connection[
                                    "contact_frequency"
                                ]
                            ),
                        }
                    )

        if not new_people:
            break

        heard.update(
            new_people
        )

        active_spreaders = (
            next_spreaders
        )

        timeline.append(
            {
                "step": step,
                "new_people": sorted(
                    new_people
                ),
                "new_count": len(
                    new_people
                ),
                "total_heard": len(
                    heard
                ),
            }
        )

    # ------------------------------------
    # 지역별 결과
    # ------------------------------------

    district_stats = []

    for district in DISTRICTS:
        district_people = [
            person
            for person in nodes
            if person["district"]
            == district
        ]

        reached = [
            person
            for person in district_people
            if person["id"] in heard
        ]

        total = len(
            district_people
        )

        reached_count = len(
            reached
        )

        rate = (
            reached_count / total * 100
            if total
            else 0
        )

        district_stats.append(
            {
                "district": district,
                "population": total,
                "heard": reached_count,
                "reach_percent": round(
                    rate,
                    1,
                ),
            }
        )

    district_stats.sort(
        key=lambda x: x[
            "reach_percent"
        ],
        reverse=True,
    )

    # ------------------------------------
    # 직업별 결과
    # ------------------------------------

    occupation_stats = []

    occupation_names = sorted(
        set(
            person["occupation"]
            for person in nodes
        )
    )

    for occupation in occupation_names:
        group = [
            person
            for person in nodes
            if person["occupation"]
            == occupation
        ]

        reached_count = sum(
            1
            for person in group
            if person["id"] in heard
        )

        rate = (
            reached_count
            / len(group)
            * 100
            if group
            else 0
        )

        occupation_stats.append(
            {
                "occupation": occupation,
                "population": len(group),
                "heard": reached_count,
                "reach_percent": round(
                    rate,
                    1,
                ),
            }
        )

    occupation_stats.sort(
        key=lambda x: x[
            "reach_percent"
        ],
        reverse=True,
    )

    # ------------------------------------
    # 실제 전달 횟수 계산
    # ------------------------------------

    spread_counts = Counter(
        event["source"]
        for event in spread_events
    )

    top_spreaders = []

    for person_id, count in (
        spread_counts.most_common(10)
    ):
        person = person_map[
            person_id
        ]

        top_spreaders.append(
            {
                "id": person_id,
                "name": person["name"],
                "age": person["age"],
                "occupation": (
                    person["occupation"]
                ),
                "personality": (
                    person["personality"]
                ),
                "district": (
                    person["district"]
                ),
                "influence": (
                    person["influence"]
                ),
                "direct_spread_count": count,
            }
        )


    # ------------------------------------
    # 전달 방식별 결과
    # ------------------------------------

    channel_counts = Counter(
        event["channel"]
        for event in spread_events
    )

    total_spread_events = len(
        spread_events
    )

    channel_analysis = []

    for channel_id, channel_info in (
        TRANSMISSION_CHANNELS.items()
    ):
        count = channel_counts.get(
            channel_id,
            0,
        )

        percent = (
            count
            / total_spread_events
            * 100
            if total_spread_events
            else 0
        )

        channel_analysis.append(
            {
                "channel": channel_id,
                "label": channel_info["label"],
                "count": count,
                "percent": round(
                    percent,
                    1,
                ),
            }
        )

    channel_analysis.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    # ------------------------------------
    # 결과
    # ------------------------------------

    return {
        "simulation": "Fashion Rumor Spread",

        "rumor": {
            "id": rumor["id"],
            "text": rumor["text"],
            "category": rumor["category"],
            "features": {
                "sensational": rumor["sensational"],
                "fashion_relevance": rumor["fashion_relevance"],
                "social_relevance": rumor["social_relevance"],
                "credibility": rumor["credibility"],
            },
        },

        "population": population,

        "simulation_seed": (
            effective_simulation_seed
        ),

        "transmission_channels": (
            TRANSMISSION_CHANNELS
        ),

        "starter": {
            "id": starter["id"],
            "name": starter["name"],
            "age": starter["age"],
            "occupation": (
                starter["occupation"]
            ),
            "personality": (
                starter["personality"]
            ),
            "district": (
                starter["district"]
            ),
            "fashion_interest": (
                starter[
                    "fashion_interest"
                ]
            ),
            "influence": (
                starter["influence"]
            ),
        },

        "result": {
            "heard": len(heard),

            "not_heard": (
                population
                - len(heard)
            ),

            "reach_percent": round(
                len(heard)
                / population
                * 100,
                1,
            ),

            "steps": (
                timeline[-1]["step"]
                if timeline
                else 0
            ),

            "stopped": (
                len(heard)
                < population
            ),
        },

        "timeline": timeline,

        "district_analysis": (
            district_stats
        ),

        "occupation_analysis": (
            occupation_stats
        ),

        "channel_analysis": (
            channel_analysis
        ),

        "top_spreaders": (
            top_spreaders
        ),

        "spread_events": (
            spread_events
        ),

        # 프론트 Graph용
        "nodes": nodes,
        "social_edges": edges,
    }

def calculate_retransmit_probability(person):
    """
    소문을 들은 사람이 다른 사람에게
    다시 전달하려는 확률.
    """

    probability = 0.28

    probability += (
        person["activity"] * 0.25
    )

    probability += (
        person["fashion_interest"] * 0.18
    )

    probability += (
        person["influence"] * 0.08
    )

    personality_modifier = {
        "유행민감": 0.15,
        "호기심많음": 0.10,
        "외향적": 0.08,
        "신중함": -0.05,
        "내향적": -0.07,
        "회의적": -0.12,
    }

    probability += personality_modifier.get(
        person["personality"],
        0,
    )

    return round(
        max(
            0.10,
            min(probability, 0.92),
        ),
        3,
    )

def compare_rumor_starters(
    population: int = 300,
    seed: int = 42,
):
    """
    동일한 Trend City에서
    시작자 유형에 따라 소문 확산 결과가
    어떻게 달라지는지 비교한다.
    """

    city = generate_trend_city(
        population=population,
        seed=seed,
    )

    nodes = city["nodes"]
    edges = city["edges"]

    # ---------------------------------
    # 연결 수 계산
    # ---------------------------------

    degree_count = Counter()

    for edge in edges:
        degree_count[edge["source"]] += 1
        degree_count[edge["target"]] += 1

    # ---------------------------------
    # 일반 시민 후보
    # ---------------------------------

    normal_people = [
        person
        for person in nodes
        if person["occupation"]
        not in [
            "패션업계",
            "콘텐츠 크리에이터",
            "패션 인플루언서",
        ]
    ]

    # 평범한 연결 수를 가진 일반인
    normal_sorted = sorted(
        normal_people,
        key=lambda p: degree_count[p["id"]],
    )

    normal_starter = normal_sorted[
        len(normal_sorted) // 2
    ]

    # ---------------------------------
    # 연결이 가장 많은 일반 시민
    # ---------------------------------

    bridge_starter = max(
        normal_people,
        key=lambda p: degree_count[p["id"]],
    )

    # ---------------------------------
    # 콘텐츠 크리에이터
    # ---------------------------------

    creators = [
        person
        for person in nodes
        if person["occupation"]
        == "콘텐츠 크리에이터"
    ]

    creator_starter = (
        max(
            creators,
            key=lambda p: degree_count[p["id"]],
        )
        if creators
        else None
    )

    # ---------------------------------
    # 패션 인플루언서
    # ---------------------------------

    influencers = [
        person
        for person in nodes
        if person["occupation"]
        == "패션 인플루언서"
    ]

    influencer_starter = (
        max(
            influencers,
            key=lambda p: degree_count[p["id"]],
        )
        if influencers
        else None
    )

    starters = [
        (
            "NORMAL",
            normal_starter,
        ),
        (
            "HIGH_CONNECTION",
            bridge_starter,
        ),
        (
            "CREATOR",
            creator_starter,
        ),
        (
            "INFLUENCER",
            influencer_starter,
        ),
    ]

    results = []

    # ---------------------------------
    # 각각 동일 조건으로 실행
    # ---------------------------------

    for starter_type, person in starters:

        if person is None:
            continue

        simulation = simulate_rumor_spread(
            population=population,
            seed=seed,
            starter_id=person["id"],
        )

        results.append(
            {
                "starter_type": starter_type,

                "starter": {
                    "id": person["id"],
                    "name": person["name"],
                    "age": person["age"],
                    "occupation": (
                        person["occupation"]
                    ),
                    "personality": (
                        person["personality"]
                    ),
                    "district": (
                        person["district"]
                    ),
                    "fashion_interest": (
                        person[
                            "fashion_interest"
                        ]
                    ),
                    "activity": (
                        person["activity"]
                    ),
                    "influence": (
                        person["influence"]
                    ),
                    "connections": (
                        degree_count[
                            person["id"]
                        ]
                    ),
                    "communities": (
                        person["communities"]
                    ),
                },

                "result": (
                    simulation["result"]
                ),

                "timeline_summary": [
                    {
                        "step": item["step"],
                        "new_count": (
                            item["new_count"]
                        ),
                        "total_heard": (
                            item["total_heard"]
                        ),
                    }
                    for item
                    in simulation["timeline"]
                ],
            }
        )

    return {
        "city": "Trend City",
        "population": population,

        "experiment": (
            "Rumor Starter Comparison"
        ),

        "rumor": (
            "소개팅에 스키니진 입고 가면 "
            "애프터 못 받는대."
        ),

        "results": results,
    }

def run_monte_carlo_comparison(
    population: int = 300,
    runs: int = 100,
    city_seed: int = 42,
):
    """
    같은 Trend City에서 시작자 유형별로
    소문 확산을 여러 번 반복한다.

    도시 구조는 고정하고
    전파 과정의 난수만 변경한다.
    """

    city = generate_trend_city(
        population=population,
        seed=city_seed,
    )

    nodes = city["nodes"]
    edges = city["edges"]

    # ---------------------------------
    # 연결 수 계산
    # ---------------------------------

    degree_count = Counter()

    for edge in edges:
        degree_count[edge["source"]] += 1
        degree_count[edge["target"]] += 1

    # ---------------------------------
    # 일반 시민
    # ---------------------------------

    normal_people = [
        person
        for person in nodes
        if person["occupation"]
        not in [
            "패션업계",
            "콘텐츠 크리에이터",
            "패션 인플루언서",
        ]
    ]

    normal_sorted = sorted(
        normal_people,
        key=lambda person: degree_count[
            person["id"]
        ],
    )

    normal_starter = normal_sorted[
        len(normal_sorted) // 2
    ]

    # ---------------------------------
    # 고연결 일반 시민
    # ---------------------------------

    high_connection_starter = max(
        normal_people,
        key=lambda person: degree_count[
            person["id"]
        ],
    )

    # ---------------------------------
    # 콘텐츠 크리에이터
    # ---------------------------------

    creators = [
        person
        for person in nodes
        if person["occupation"]
        == "콘텐츠 크리에이터"
    ]

    creator_starter = (
        max(
            creators,
            key=lambda person: degree_count[
                person["id"]
            ],
        )
        if creators
        else None
    )

    # ---------------------------------
    # 패션 인플루언서
    # ---------------------------------

    influencers = [
        person
        for person in nodes
        if person["occupation"]
        == "패션 인플루언서"
    ]

    influencer_starter = (
        max(
            influencers,
            key=lambda person: degree_count[
                person["id"]
            ],
        )
        if influencers
        else None
    )

    starters = [
        (
            "NORMAL",
            normal_starter,
        ),
        (
            "HIGH_CONNECTION",
            high_connection_starter,
        ),
        (
            "CREATOR",
            creator_starter,
        ),
        (
            "INFLUENCER",
            influencer_starter,
        ),
    ]

    comparison = []

    # =================================
    # 시작자별 반복 실험
    # =================================

    for starter_type, starter in starters:

        if starter is None:
            continue

        heard_results = []
        reach_results = []
        step_results = []

        large_spread_count = 0

        # -----------------------------
        # Monte Carlo
        # -----------------------------

        for run_number in range(runs):

            simulation = simulate_rumor_spread(
                population=population,

                # 도시 구조 고정
                seed=city_seed,

                starter_id=starter["id"],

                # 전파 난수만 변경
                simulation_seed=(
                    run_number + 1
                ),
            )

            result = simulation["result"]

            heard_results.append(
                result["heard"]
            )

            reach_results.append(
                result["reach_percent"]
            )

            step_results.append(
                result["steps"]
            )

            # 전체 인구의 30% 이상이면
            # 대규모 확산으로 정의
            if result["reach_percent"] >= 30:
                large_spread_count += 1

        # -----------------------------
        # 통계
        # -----------------------------

        average_heard = (
            sum(heard_results)
            / len(heard_results)
        )

        average_reach = (
            sum(reach_results)
            / len(reach_results)
        )

        average_steps = (
            sum(step_results)
            / len(step_results)
        )

        large_spread_probability = (
            large_spread_count
            / runs
            * 100
        )

        comparison.append(
            {
                "starter_type": starter_type,

                "starter": {
                    "id": starter["id"],
                    "name": starter["name"],
                    "age": starter["age"],

                    "occupation": (
                        starter["occupation"]
                    ),

                    "personality": (
                        starter["personality"]
                    ),

                    "district": (
                        starter["district"]
                    ),

                    "connections": (
                        degree_count[
                            starter["id"]
                        ]
                    ),

                    "fashion_interest": (
                        starter[
                            "fashion_interest"
                        ]
                    ),

                    "activity": (
                        starter["activity"]
                    ),

                    "influence": (
                        starter["influence"]
                    ),
                },

                "statistics": {
                    "runs": runs,

                    "average_heard": round(
                        average_heard,
                        1,
                    ),

                    "average_reach_percent": round(
                        average_reach,
                        1,
                    ),

                    "average_steps": round(
                        average_steps,
                        1,
                    ),

                    "minimum_heard": min(
                        heard_results
                    ),

                    "maximum_heard": max(
                        heard_results
                    ),

                    "large_spread_count": (
                        large_spread_count
                    ),

                    "large_spread_probability": round(
                        large_spread_probability,
                        1,
                    ),
                },
            }
        )

    # ---------------------------------
    # 평균 도달률 순위
    # ---------------------------------

    ranking = sorted(
        comparison,
        key=lambda item: item[
            "statistics"
        ][
            "average_reach_percent"
        ],
        reverse=True,
    )

    for rank, item in enumerate(
        ranking,
        start=1,
    ):
        item["rank"] = rank

    return {
        "experiment": (
            "Fashion Rumor Monte Carlo"
        ),

        "population": population,
        "runs_per_starter": runs,
        "city_seed": city_seed,

        "large_spread_threshold_percent": 30,

        "rumor": (
            "소개팅에 스키니진 입고 가면 "
            "애프터 못 받는대."
        ),

        "results": ranking,
    }
