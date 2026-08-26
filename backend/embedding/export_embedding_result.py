from pathlib import Path
import csv
import json


# ============================================================
# PATH
# ============================================================

EMBEDDING_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EMBEDDING_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
CLIP_DIR = DATA_DIR / "clip_skinny"
OUTPUT_DIR = CLIP_DIR / "output"

SILHOUETTE_FILE = (
    OUTPUT_DIR /
    "silhouette_group_summary.csv"
)

PCA_FILE = (
    OUTPUT_DIR /
    "pca_coordinates.csv"
)


# 최종 React용 파일
RESULT_FILE = (
    DATA_DIR /
    "embedding_analysis.json"
)


# ============================================================
# INFO
# ============================================================

GROUP_INFO = {
    "past_skinny": {
        "label":
            "과거 스키니",

        "period":
            "2000s",

        "description":
            "몸에 밀착되는 Skinny 실루엣",
    },

    "wide_period": {
        "label":
            "와이드 전성기",

        "period":
            "Wide Period",

        "description":
            "폭이 넓은 Wide 실루엣",
    },

    "modern_slim": {
        "label":
            "최근 실루엣",

        "period":
            "Recent",

        "description":
            "과거 Skinny와 현재 Wide 사이에서 나타나는 최근 실루엣",
    },
}


FEATURE_ORDER = [
    "skinny",
    "straight",
    "wide",
]


FEATURE_LABELS = {
    "skinny": "Skinny",
    "straight": "Straight",
    "wide": "Wide",
}


print("=" * 65)
print("Frontend Embedding Data Export")
print("=" * 65)


# ============================================================
# SILHOUETTE
# ============================================================

print(
    "\n[1/3] 실루엣 특징 결과 읽는 중..."
)


silhouette_data = {}


with SILHOUETTE_FILE.open(
    "r",
    encoding="utf-8-sig",
) as file:

    reader = csv.DictReader(
        file
    )


    for row in reader:

        group = row[
            "group"
        ]


        silhouette_data[
            group
        ] = {
            feature:
                float(
                    row[feature]
                )

            for feature
            in FEATURE_ORDER
        }


print(
    "[OK] 실루엣 데이터 로드 완료"
)


# ============================================================
# PCA
# ============================================================

print(
    "\n[2/3] PCA 좌표 읽는 중..."
)


pca_points = []


with PCA_FILE.open(
    "r",
    encoding="utf-8-sig",
) as file:

    reader = csv.DictReader(
        file
    )


    for row in reader:

        pca_points.append(
            {
                "group":
                    row["group"],

                "filename":
                    row["filename"],

                "pc1":
                    round(
                        float(
                            row["pc1"]
                        ),
                        6,
                    ),

                "pc2":
                    round(
                        float(
                            row["pc2"]
                        ),
                        6,
                    ),
            }
        )


print(
    f"[OK] PCA "
    f"{len(pca_points)}개 좌표 로드 완료"
)


# ============================================================
# PCA CENTER
# ============================================================

pca_centers = {}


for group in GROUP_INFO:

    points = [
        point
        for point in pca_points
        if point["group"] == group
    ]


    if not points:
        continue


    pc1 = sum(
        point["pc1"]
        for point in points
    ) / len(points)


    pc2 = sum(
        point["pc2"]
        for point in points
    ) / len(points)


    pca_centers[
        group
    ] = {
        "pc1":
            round(
                pc1,
                6,
            ),

        "pc2":
            round(
                pc2,
                6,
            ),
    }


# ============================================================
# GROUP
# ============================================================

groups = []


for group_id, info in (
    GROUP_INFO.items()
):

    scores = (
        silhouette_data.get(
            group_id
        )
    )


    if not scores:
        continue


    dominant = max(
        scores,
        key=scores.get,
    )


    groups.append(
        {
            "id":
                group_id,

            "label":
                info["label"],

            "period":
                info["period"],

            "description":
                info[
                    "description"
                ],

            "features": {
                feature:
                    round(
                        scores[
                            feature
                        ],
                        4,
                    )

                for feature
                in FEATURE_ORDER
            },

            "dominantFeature":
                dominant,

            "dominantFeatureLabel":
                FEATURE_LABELS[
                    dominant
                ],

            "pcaCenter":
                pca_centers.get(
                    group_id
                ),
        }
    )


# ============================================================
# RESULT
# ============================================================

result = {
    "title":
        "스키니진 실루엣 변화 분석",

    "question":
        "과거의 스키니진은 최근 어떤 형태로 다시 나타나고 있을까?",

    "method": {
        "embedding":
            "CLIP ViT-B/32",

        "dimension":
            512,

        "projection":
            "PCA",

        "imageCount":
            len(
                pca_points
            ),

        "similarity":
            "Cosine Similarity",

        "features": [
            {
                "id":
                    feature,

                "label":
                    FEATURE_LABELS[
                        feature
                    ],
            }

            for feature
            in FEATURE_ORDER
        ],
    },

    "groups":
        groups,

    "pca": {
        "points":
            pca_points,

        "centers":
            pca_centers,
    },

    "interpretation": {
        "past":
            "과거에는 몸에 밀착되는 Skinny 특징이 강하게 나타난다.",

        "wide":
            "와이드 유행 시기에는 Wide 특징이 강하게 나타난다.",

        "modern":
            "최근 실루엣은 Skinny와 Straight, Wide 사이의 특징을 함께 비교해 과거 스타일이 어떤 형태로 재해석되는지 확인한다.",

        "conclusion":
            "최근 스타일이 과거 Skinny로 완전히 회귀한 것인지, Straight 또는 Wide 특징을 함께 가진 중간 형태인지 비교한다.",
    },
}


# ============================================================
# SAVE
# ============================================================

print(
    "\n[3/3] JSON 저장 중..."
)


with RESULT_FILE.open(
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        result,
        file,
        ensure_ascii=False,
        indent=2,
    )


print(
    "[OK] 저장 완료"
)

print()
print("=" * 65)
print("완료")
print("=" * 65)

print(
    f"\nJSON:\n"
    f"{RESULT_FILE}"
)


for group in groups:

    print(
        f"{group['label']:<12}"
        f" -> "
        f"{group['dominantFeatureLabel']}"
    )