from pathlib import Path
import csv

import numpy as np
from sklearn.decomposition import PCA


# ============================================================
# 경로 설정
# 현재 파일:
# backend/embedding/create_pca_projection.py
# ============================================================

EMBEDDING_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EMBEDDING_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "clip_skinny"
    / "output"
)

EMBEDDING_FILE = (
    DATA_OUTPUT_DIR
    / "clip_embeddings.npy"
)

METADATA_FILE = (
    DATA_OUTPUT_DIR
    / "clip_metadata.csv"
)

PCA_COORDINATES_FILE = (
    DATA_OUTPUT_DIR
    / "pca_coordinates.csv"
)

PCA_INFO_FILE = (
    DATA_OUTPUT_DIR
    / "pca_info.txt"
)


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
# 데이터 불러오기
# ============================================================

print("=" * 60)
print("CLIP Embedding PCA Projection")
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
# PCA 실행
# 512차원 -> 2차원
# ============================================================

print("\n[2/4] PCA 2차원 축소 중...")


pca = PCA(
    n_components=2,
    random_state=42,
)


coordinates = pca.fit_transform(
    embeddings
)


print(
    f"[OK] PCA 결과 shape: {coordinates.shape}"
)


# ============================================================
# 설명 분산 비율
# ============================================================

explained_variance_ratio = (
    pca.explained_variance_ratio_
)

pc1_ratio = float(
    explained_variance_ratio[0]
)

pc2_ratio = float(
    explained_variance_ratio[1]
)

total_ratio = (
    pc1_ratio
    + pc2_ratio
)


print()
print(
    f"PC1 설명 분산 비율: "
    f"{pc1_ratio:.4f}"
    f" "
    f"({pc1_ratio * 100:.2f}%)"
)

print(
    f"PC2 설명 분산 비율: "
    f"{pc2_ratio:.4f}"
    f" "
    f"({pc2_ratio * 100:.2f}%)"
)

print(
    f"2차원 누적 설명 비율: "
    f"{total_ratio:.4f}"
    f" "
    f"({total_ratio * 100:.2f}%)"
)


# ============================================================
# PCA 좌표 CSV 저장
# ============================================================

print("\n[3/4] PCA 좌표 저장 중...")


with PCA_COORDINATES_FILE.open(
    "w",
    newline="",
    encoding="utf-8-sig",
) as file:

    fieldnames = [
        "index",
        "group",
        "filename",
        "relative_path",
        "pc1",
        "pc2",
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames,
    )

    writer.writeheader()


    for index, (
        row,
        coordinate,
    ) in enumerate(
        zip(
            metadata,
            coordinates,
        )
    ):

        writer.writerow(
            {
                "index":
                    index,

                "group":
                    row["group"],

                "filename":
                    row["filename"],

                "relative_path":
                    row["relative_path"],

                "pc1":
                    float(
                        coordinate[0]
                    ),

                "pc2":
                    float(
                        coordinate[1]
                    ),
            }
        )


# ============================================================
# PCA 정보 파일 저장
# ============================================================

with PCA_INFO_FILE.open(
    "w",
    encoding="utf-8",
) as file:

    file.write(
        "CLIP Embedding PCA Result\n"
    )

    file.write(
        "=" * 40
        + "\n"
    )

    file.write(
        f"Original embedding shape: "
        f"{embeddings.shape}\n"
    )

    file.write(
        f"PCA output shape: "
        f"{coordinates.shape}\n"
    )

    file.write(
        f"PC1 explained variance: "
        f"{pc1_ratio:.6f} "
        f"({pc1_ratio * 100:.2f}%)\n"
    )

    file.write(
        f"PC2 explained variance: "
        f"{pc2_ratio:.6f} "
        f"({pc2_ratio * 100:.2f}%)\n"
    )

    file.write(
        f"Total explained variance: "
        f"{total_ratio:.6f} "
        f"({total_ratio * 100:.2f}%)\n"
    )


# ============================================================
# 그룹별 평균 PCA 좌표도 확인
# ============================================================

groups = sorted(
    set(
        row["group"]
        for row in metadata
    )
)


print()
print("=" * 60)
print("그룹별 평균 PCA 좌표")
print("=" * 60)


for group in groups:

    group_indices = [
        index
        for index, row
        in enumerate(metadata)
        if row["group"] == group
    ]

    group_coordinates = (
        coordinates[
            group_indices
        ]
    )

    mean_pc1 = float(
        group_coordinates[
            :,
            0
        ].mean()
    )

    mean_pc2 = float(
        group_coordinates[
            :,
            1
        ].mean()
    )

    print(
        f"{group:15s}"
        f" -> "
        f"PC1={mean_pc1:+.4f}, "
        f"PC2={mean_pc2:+.4f}"
    )


# ============================================================
# 완료
# ============================================================

print()
print("=" * 60)
print("[4/4] PCA 저장 완료")
print("=" * 60)

print(
    f"PCA coordinates: "
    f"{PCA_COORDINATES_FILE}"
)

print(
    f"PCA info: "
    f"{PCA_INFO_FILE}"
)