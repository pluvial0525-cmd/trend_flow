from pathlib import Path
import csv

import numpy as np


# ============================================================
# 경로 설정
# 현재 파일:
# backend/embedding/analyze_clip_similarity.py
# ============================================================

EMBEDDING_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EMBEDDING_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "clip_skinny"
    / "output"
)

EMBEDDING_FILE = (
    OUTPUT_DIR
    / "clip_embeddings.npy"
)

METADATA_FILE = (
    OUTPUT_DIR
    / "clip_metadata.csv"
)


# ============================================================
# 비교할 그룹
# ============================================================

GROUPS = [
    "past_skinny",
    "wide_period",
    "modern_slim",
]


# ============================================================
# 파일 존재 확인
# ============================================================

if not EMBEDDING_FILE.exists():
    raise FileNotFoundError(
        f"임베딩 파일을 찾을 수 없습니다.\n"
        f"{EMBEDDING_FILE}"
    )

if not METADATA_FILE.exists():
    raise FileNotFoundError(
        f"메타데이터 파일을 찾을 수 없습니다.\n"
        f"{METADATA_FILE}"
    )


# ============================================================
# 임베딩 불러오기
# ============================================================

print("=" * 60)
print("CLIP 이미지 유사도 분석")
print("=" * 60)

print("\n[1/4] 임베딩 불러오는 중...")


embeddings = np.load(
    EMBEDDING_FILE
)


metadata = []

with METADATA_FILE.open(
    "r",
    encoding="utf-8-sig",
) as file:

    reader = csv.DictReader(file)

    for row in reader:
        metadata.append(row)


print(
    f"[OK] Embedding shape: {embeddings.shape}"
)

print(
    f"[OK] Metadata count: {len(metadata)}"
)


if len(embeddings) != len(metadata):
    raise ValueError(
        "임베딩 개수와 메타데이터 개수가 일치하지 않습니다."
    )


# ============================================================
# 그룹별 이미지 인덱스 분리
# ============================================================

print("\n[2/4] 그룹 확인 중...")


group_indices = {
    group: []
    for group in GROUPS
}


for index, row in enumerate(metadata):

    group = row["group"]

    if group in group_indices:
        group_indices[group].append(index)


for group in GROUPS:

    count = len(
        group_indices[group]
    )

    print(
        f"  - {group}: {count}장"
    )

    if count == 0:
        raise ValueError(
            f"{group} 그룹의 이미지가 없습니다."
        )


# ============================================================
# 그룹별 평균 임베딩 계산
#
# 각 그룹의 이미지 10개 임베딩을 평균내서
# 해당 패션 그룹의 대표 벡터를 만든다.
# ============================================================

print("\n[3/4] 그룹 대표 임베딩 계산 중...")


group_centroids = {}


for group in GROUPS:

    indices = group_indices[group]

    group_vectors = embeddings[
        indices
    ]

    centroid = group_vectors.mean(
        axis=0
    )

    # cosine similarity 계산을 위해
    # 평균 벡터도 다시 정규화
    norm = np.linalg.norm(
        centroid
    )

    if norm == 0:
        raise ValueError(
            f"{group} 평균 임베딩의 크기가 0입니다."
        )

    centroid = centroid / norm

    group_centroids[group] = centroid


print("[OK] 그룹 대표 임베딩 생성 완료")


# ============================================================
# Cosine Similarity
# ============================================================

def cosine_similarity(
    vector_a,
    vector_b,
):
    return float(
        np.dot(
            vector_a,
            vector_b,
        )
    )


# 우리가 실제로 비교할 세 관계
pairs = [
    (
        "past_skinny",
        "modern_slim",
    ),
    (
        "past_skinny",
        "wide_period",
    ),
    (
        "wide_period",
        "modern_slim",
    ),
]


# ============================================================
# 1. 그룹 대표 벡터끼리 비교
# ============================================================

print()
print("=" * 60)
print("① 그룹 대표 특징 간 Cosine Similarity")
print("=" * 60)


centroid_results = {}


for group_a, group_b in pairs:

    similarity = cosine_similarity(
        group_centroids[group_a],
        group_centroids[group_b],
    )

    centroid_results[
        (group_a, group_b)
    ] = similarity

    print(
        f"{group_a:15s}"
        f" <-> "
        f"{group_b:15s}"
        f" : "
        f"{similarity:.4f}"
    )


# ============================================================
# 2. 실제 이미지 전체 조합 평균
#
# 예:
# past 10장 × modern 10장 = 100개 유사도
# 그 100개의 평균과 표준편차 계산
# ============================================================

def mean_pair_similarity(
    group_a,
    group_b,
):

    indices_a = (
        group_indices[group_a]
    )

    indices_b = (
        group_indices[group_b]
    )

    similarities = []


    for index_a in indices_a:

        vector_a = embeddings[
            index_a
        ]


        for index_b in indices_b:

            vector_b = embeddings[
                index_b
            ]

            similarity = float(
                np.dot(
                    vector_a,
                    vector_b,
                )
            )

            similarities.append(
                similarity
            )


    similarities = np.array(
        similarities,
        dtype=np.float32,
    )


    return {
        "mean": float(
            similarities.mean()
        ),

        "std": float(
            similarities.std()
        ),

        "min": float(
            similarities.min()
        ),

        "max": float(
            similarities.max()
        ),

        "count": len(
            similarities
        ),
    }


print()
print("=" * 60)
print("② 이미지 전체 조합 평균 유사도")
print("=" * 60)


pair_results = {}


for group_a, group_b in pairs:

    result = mean_pair_similarity(
        group_a,
        group_b,
    )

    pair_results[
        (group_a, group_b)
    ] = result

    print()

    print(
        f"{group_a}"
        f" <-> "
        f"{group_b}"
    )

    print(
        f"  평균 : {result['mean']:.4f}"
    )

    print(
        f"  표준편차 : {result['std']:.4f}"
    )

    print(
        f"  최소 : {result['min']:.4f}"
    )

    print(
        f"  최대 : {result['max']:.4f}"
    )

    print(
        f"  비교 수 : {result['count']}개"
    )


# ============================================================
# 3. 우리가 궁금한 핵심 비교
# ============================================================

past_modern = centroid_results[
    (
        "past_skinny",
        "modern_slim",
    )
]

past_wide = centroid_results[
    (
        "past_skinny",
        "wide_period",
    )
]

wide_modern = centroid_results[
    (
        "wide_period",
        "modern_slim",
    )
]


print()
print("=" * 60)
print("③ 핵심 비교")
print("=" * 60)

print(
    f"과거 스키니 ↔ 최근 슬림 : "
    f"{past_modern:.4f}"
)

print(
    f"과거 스키니 ↔ 와이드   : "
    f"{past_wide:.4f}"
)

print(
    f"와이드 ↔ 최근 슬림      : "
    f"{wide_modern:.4f}"
)


difference = (
    past_modern
    - past_wide
)


print()
print(
    f"최근 슬림의 과거 스키니 접근 차이: "
    f"{difference:+.4f}"
)


# ============================================================
# 4. 간단한 결과 해석
# ============================================================

print()
print("=" * 60)
print("④ 결과 해석")
print("=" * 60)


if past_modern > past_wide:

    print(
        "최근 Modern Slim 그룹은 "
        "Wide 그룹보다 과거 Skinny 그룹과 "
        "더 높은 이미지 특징 유사도를 보였습니다."
    )

    print(
        "→ 현재 수집한 이미지에서는 최근 슬림 실루엣이 "
        "와이드보다 과거 스키니의 시각적 특징에 "
        "더 가까운 방향으로 나타났습니다."
    )

elif past_modern < past_wide:

    print(
        "현재 데이터에서는 최근 Modern Slim 그룹이 "
        "과거 Skinny 그룹보다 Wide 그룹과 "
        "더 가까운 이미지 특징을 보였습니다."
    )

    print(
        "→ 현재 이미지 데이터만으로는 "
        "최근 슬림 실루엣이 과거 스키니 쪽으로 "
        "가까워졌다고 보기 어렵습니다."
    )

else:

    print(
        "과거 Skinny와의 유사도와 "
        "Wide와의 유사도가 동일하게 나타났습니다."
    )


print()
print("=" * 60)
print("분석 완료")
print("=" * 60)