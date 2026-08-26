from pathlib import Path
import csv

import matplotlib.pyplot as plt
import numpy as np


# ============================================================
# 경로
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

PCA_FILE = OUTPUT_DIR / "pca_coordinates.csv"

PLOT_FILE = OUTPUT_DIR / "pca_scatter.png"


# ============================================================
# PCA 좌표 읽기
# ============================================================

if not PCA_FILE.exists():
    raise FileNotFoundError(
        f"PCA 좌표 파일을 찾을 수 없습니다.\n{PCA_FILE}"
    )


rows = []

with PCA_FILE.open(
    "r",
    encoding="utf-8-sig",
) as file:

    reader = csv.DictReader(file)

    for row in reader:
        rows.append(
            {
                "group": row["group"],
                "filename": row["filename"],
                "pc1": float(row["pc1"]),
                "pc2": float(row["pc2"]),
            }
        )


print("=" * 60)
print("PCA Scatter Plot")
print("=" * 60)

print(f"\n총 데이터: {len(rows)}개")


# ============================================================
# 그룹 설정
# ============================================================

GROUPS = {
    "past_skinny": {
        "label": "Past Skinny",
        "marker": "o",
    },

    "wide_period": {
        "label": "Wide Period",
        "marker": "s",
    },

    "modern_slim": {
        "label": "Modern Slim",
        "marker": "^",
    },
}


# ============================================================
# 그래프 생성
# ============================================================

fig, ax = plt.subplots(
    figsize=(11, 7)
)


for group_name, config in GROUPS.items():

    group_rows = [
        row
        for row in rows
        if row["group"] == group_name
    ]

    x = np.array(
        [
            row["pc1"]
            for row in group_rows
        ]
    )

    y = np.array(
        [
            row["pc2"]
            for row in group_rows
        ]
    )


    # --------------------------------------------------------
    # 개별 이미지
    # --------------------------------------------------------

    ax.scatter(
        x,
        y,
        s=95,
        marker=config["marker"],
        alpha=0.75,
        label=config["label"],
    )


    # --------------------------------------------------------
    # 각 점에 이미지 번호 표시
    # --------------------------------------------------------

    for row in group_rows:

        image_number = (
            Path(row["filename"]).stem
        )

        ax.annotate(
            image_number,
            (
                row["pc1"],
                row["pc2"],
            ),
            xytext=(5, 5),
            textcoords="offset points",
            fontsize=8,
            alpha=0.8,
        )


    # --------------------------------------------------------
    # 그룹 중심점
    # --------------------------------------------------------

    center_x = x.mean()
    center_y = y.mean()

    ax.scatter(
        center_x,
        center_y,
        s=260,
        marker="X",
        edgecolors="black",
        linewidths=1.4,
    )

    ax.annotate(
        f"{config['label']} CENTER",
        (
            center_x,
            center_y,
        ),
        xytext=(8, -18),
        textcoords="offset points",
        fontsize=9,
        fontweight="bold",
    )


# ============================================================
# 축 / 제목
# ============================================================

ax.axhline(
    0,
    linewidth=0.8,
    alpha=0.25,
)

ax.axvline(
    0,
    linewidth=0.8,
    alpha=0.25,
)


ax.set_title(
    "CLIP Image Embedding - PCA Projection",
    fontsize=17,
    fontweight="bold",
    pad=16,
)

ax.set_xlabel(
    "PC1 (16.11%)",
    fontsize=12,
)

ax.set_ylabel(
    "PC2 (8.39%)",
    fontsize=12,
)


ax.legend(
    fontsize=10
)

ax.grid(
    alpha=0.15
)

fig.tight_layout()


# ============================================================
# 저장
# ============================================================

fig.savefig(
    PLOT_FILE,
    dpi=180,
    bbox_inches="tight",
)


print()
print("[OK] PCA 산점도 생성 완료")

print(
    f"저장 위치: {PLOT_FILE}"
)


# ============================================================
# 그룹 중심 간 2D 거리
# 참고용
# ============================================================

print()
print("=" * 60)
print("PCA 2D 그룹 중심 거리")
print("=" * 60)


centers = {}


for group_name in GROUPS:

    group_rows = [
        row
        for row in rows
        if row["group"] == group_name
    ]

    center = np.array(
        [
            np.mean(
                [
                    row["pc1"]
                    for row in group_rows
                ]
            ),
            np.mean(
                [
                    row["pc2"]
                    for row in group_rows
                ]
            ),
        ]
    )

    centers[group_name] = center


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


for group_a, group_b in pairs:

    distance = np.linalg.norm(
        centers[group_a]
        - centers[group_b]
    )

    print(
        f"{group_a:15s}"
        f" <-> "
        f"{group_b:15s}"
        f" : "
        f"{distance:.4f}"
    )


print()
print("=" * 60)
print("완료")
print("=" * 60)