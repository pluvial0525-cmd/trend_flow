from pathlib import Path
import csv

import numpy as np
import open_clip
import torch


# ============================================================
# PATH
# ============================================================

EMBEDDING_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EMBEDDING_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
CLIP_DIR = DATA_DIR / "clip_skinny"
OUTPUT_DIR = CLIP_DIR / "output"

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

EMBEDDING_FILE = OUTPUT_DIR / "clip_embeddings.npy"
METADATA_FILE = OUTPUT_DIR / "clip_metadata.csv"

IMAGE_RESULT_FILE = (
    OUTPUT_DIR /
    "silhouette_feature_scores.csv"
)

GROUP_RESULT_FILE = (
    OUTPUT_DIR /
    "silhouette_group_summary.csv"
)


# ============================================================
# 3개 실루엣 기준
# ============================================================

SILHOUETTE_PROMPTS = {
    "skinny": [
        "very tight skinny jeans fitted closely to the legs",
        "skinny fit denim pants with a narrow tight silhouette",
        "tight fitted jeans hugging the thighs and calves",
    ],

    "straight": [
        "straight leg jeans with a consistent leg width",
        "straight fit denim pants with a balanced silhouette",
        "jeans falling straight from thigh to ankle",
    ],

    "wide": [
        "wide leg jeans with a loose wide silhouette",
        "very wide denim pants with roomy legs",
        "wide fit jeans with a broad relaxed leg shape",
    ],
}


FEATURE_ORDER = [
    "skinny",
    "straight",
    "wide",
]


GROUP_ORDER = [
    "past_skinny",
    "wide_period",
    "modern_slim",
]


# ============================================================
# DEVICE
# ============================================================

device = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


print("=" * 70)
print("CLIP Silhouette Feature Analysis")
print("Skinny / Straight / Wide")
print("=" * 70)

print(f"\nDevice: {device}")


# ============================================================
# LOAD EMBEDDING
# ============================================================

print("\n[1/5] 이미지 임베딩 불러오는 중...")


if not EMBEDDING_FILE.exists():
    raise FileNotFoundError(
        f"Embedding 파일이 없습니다:\n"
        f"{EMBEDDING_FILE}"
    )


if not METADATA_FILE.exists():
    raise FileNotFoundError(
        f"Metadata 파일이 없습니다:\n"
        f"{METADATA_FILE}"
    )


image_embeddings = np.load(
    EMBEDDING_FILE
).astype(np.float32)


metadata = []

with METADATA_FILE.open(
    "r",
    encoding="utf-8-sig",
) as file:

    reader = csv.DictReader(file)

    metadata = list(reader)


print(
    f"[OK] Embedding shape: "
    f"{image_embeddings.shape}"
)

print(
    f"[OK] Metadata count: "
    f"{len(metadata)}"
)


if len(image_embeddings) != len(metadata):
    raise ValueError(
        "Embedding 개수와 metadata 개수가 다릅니다."
    )


# ============================================================
# NORMALIZE IMAGE EMBEDDING
# ============================================================

image_norms = np.linalg.norm(
    image_embeddings,
    axis=1,
    keepdims=True,
)

image_embeddings = (
    image_embeddings /
    np.clip(
        image_norms,
        1e-12,
        None,
    )
)


# ============================================================
# LOAD CLIP
# ============================================================

print("\n[2/5] CLIP text encoder 준비 중...")


model_name = "ViT-B-32"
pretrained = "laion2b_s34b_b79k"


model, _, _ = (
    open_clip.create_model_and_transforms(
        model_name,
        pretrained=pretrained,
    )
)

tokenizer = (
    open_clip.get_tokenizer(
        model_name
    )
)


model = model.to(device)
model.eval()


print("[OK] CLIP model loaded")


# ============================================================
# TEXT EMBEDDING
# ============================================================

print("\n[3/5] 실루엣 텍스트 임베딩 생성 중...")


feature_embeddings = {}


with torch.no_grad():

    for feature in FEATURE_ORDER:

        prompts = (
            SILHOUETTE_PROMPTS[
                feature
            ]
        )

        tokens = tokenizer(
            prompts
        ).to(device)


        text_features = (
            model.encode_text(
                tokens
            )
        )


        text_features = (
            text_features /
            text_features.norm(
                dim=-1,
                keepdim=True,
            )
        )


        # 여러 prompt의 평균값
        mean_feature = (
            text_features.mean(
                dim=0
            )
        )


        mean_feature = (
            mean_feature /
            mean_feature.norm()
        )


        feature_embeddings[
            feature
        ] = (
            mean_feature
            .cpu()
            .numpy()
            .astype(np.float32)
        )


        print(
            f"[OK] {feature}"
        )


# ============================================================
# IMAGE x TEXT SIMILARITY
# ============================================================

print("\n[4/5] 이미지별 실루엣 특징 분석 중...")


rows = []


for index, meta in enumerate(metadata):

    embedding = (
        image_embeddings[
            index
        ]
    )


    scores = {}


    for feature in FEATURE_ORDER:

        score = float(
            np.dot(
                embedding,
                feature_embeddings[
                    feature
                ],
            )
        )

        scores[
            feature
        ] = score


    dominant = max(
        scores,
        key=scores.get,
    )


    group = (
        meta.get("group")
        or meta.get("category")
        or ""
    )


    filename = (
        meta.get("filename")
        or meta.get("file")
        or ""
    )


    row = {
        "group": group,
        "filename": filename,
        **scores,
        "dominant": dominant,
    }


    rows.append(row)


# ============================================================
# SAVE IMAGE RESULT
# ============================================================

with IMAGE_RESULT_FILE.open(
    "w",
    newline="",
    encoding="utf-8-sig",
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "group",
            "filename",
            *FEATURE_ORDER,
            "dominant",
        ],
    )

    writer.writeheader()

    writer.writerows(
        rows
    )


# ============================================================
# GROUP SUMMARY
# ============================================================

group_summary = []


print()
print("=" * 70)
print("그룹별 평균 실루엣 특징")
print("=" * 70)


for group in GROUP_ORDER:

    group_rows = [
        row
        for row in rows
        if row["group"] == group
    ]


    if not group_rows:
        continue


    averages = {}


    for feature in FEATURE_ORDER:

        values = [
            row[feature]
            for row in group_rows
        ]

        averages[
            feature
        ] = float(
            np.mean(values)
        )


    dominant = max(
        averages,
        key=averages.get,
    )


    print(
        f"\n[{group}]"
    )


    for feature in FEATURE_ORDER:

        print(
            f"  "
            f"{feature:<10}: "
            f"{averages[feature]:.4f}"
        )


    print(
        f"  -> 평균 dominant: "
        f"{dominant}"
    )


    group_summary.append(
        {
            "group": group,

            "skinny":
                averages["skinny"],

            "straight":
                averages["straight"],

            "wide":
                averages["wide"],

            "dominant":
                dominant,
        }
    )


# ============================================================
# SAVE GROUP RESULT
# ============================================================

with GROUP_RESULT_FILE.open(
    "w",
    newline="",
    encoding="utf-8-sig",
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "group",
            "skinny",
            "straight",
            "wide",
            "dominant",
        ],
    )

    writer.writeheader()

    writer.writerows(
        group_summary
    )


print()
print("=" * 70)
print("[5/5] 분석 완료")
print("=" * 70)

print(
    "\n개별 이미지 결과:"
)

print(
    IMAGE_RESULT_FILE
)

print(
    "\n그룹 평균 결과:"
)

print(
    GROUP_RESULT_FILE
)