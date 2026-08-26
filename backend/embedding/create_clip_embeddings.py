from pathlib import Path
import csv

import numpy as np
import open_clip
import torch
from PIL import Image


# ============================================================
# 경로 설정
# ============================================================

EMBEDDING_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EMBEDDING_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = PROJECT_ROOT / "data" / "clip_skinny"

OUTPUT_DIR = DATA_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EMBEDDING_FILE = OUTPUT_DIR / "clip_embeddings.npy"
METADATA_FILE = OUTPUT_DIR / "clip_metadata.csv"


# ============================================================
# 분석할 그룹
# ============================================================

GROUPS = [
    "past_skinny",
    "wide_period",
    "modern_slim",
]

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# ============================================================
# DEVICE
# ============================================================

device = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

print(f"[DEVICE] {device}")


# ============================================================
# CLIP MODEL
# ============================================================

print("[1/4] CLIP 모델 불러오는 중...")

model, _, preprocess = (
    open_clip.create_model_and_transforms(
        "ViT-B-32",
        pretrained="laion2b_s34b_b79k",
    )
)

model = model.to(device)
model.eval()

print("[OK] CLIP 모델 준비 완료")


# ============================================================
# 이미지 경로 수집
# ============================================================

print("[2/4] 이미지 확인 중...")

image_records = []

for group in GROUPS:

    group_dir = DATA_DIR / group

    if not group_dir.exists():
        raise FileNotFoundError(
            f"폴더를 찾을 수 없습니다: {group_dir}"
        )

    files = sorted(
        [
            path
            for path in group_dir.iterdir()
            if (
                path.is_file()
                and path.suffix.lower()
                in IMAGE_EXTENSIONS
            )
        ],
        key=lambda path: path.name,
    )

    print(
        f"  - {group}: {len(files)}장"
    )

    for path in files:
        image_records.append(
            {
                "group": group,
                "path": path,
            }
        )


print(
    f"[OK] 총 {len(image_records)}장 확인"
)


# ============================================================
# CLIP IMAGE EMBEDDING
# ============================================================

print("[3/4] 이미지 임베딩 생성 중...")

embeddings = []
metadata = []


with torch.no_grad():

    for index, record in enumerate(
        image_records,
        start=1,
    ):

        image_path = record["path"]
        group = record["group"]

        try:

            image = Image.open(
                image_path
            ).convert("RGB")

            image_tensor = (
                preprocess(image)
                .unsqueeze(0)
                .to(device)
            )

            feature = (
                model.encode_image(
                    image_tensor
                )
            )

            # cosine similarity 계산에 편하도록
            # 벡터 길이를 1로 정규화
            feature = (
                feature
                / feature.norm(
                    dim=-1,
                    keepdim=True,
                )
            )

            embedding = (
                feature
                .squeeze(0)
                .cpu()
                .numpy()
                .astype(np.float32)
            )

            embeddings.append(
                embedding
            )

            metadata.append(
                {
                    "index":
                        len(metadata),

                    "group":
                        group,

                    "filename":
                        image_path.name,

                    "relative_path":
                        str(
                            image_path.relative_to(
                                PROJECT_ROOT
                            )
                        ),
                }
            )

            print(
                f"[{index:02d}/{len(image_records)}] "
                f"{group} / {image_path.name}"
            )

        except Exception as error:

            print(
                f"[ERROR] "
                f"{image_path} "
                f"-> {error}"
            )


# ============================================================
# 저장
# ============================================================

if not embeddings:
    raise RuntimeError(
        "생성된 임베딩이 없습니다."
    )


embedding_array = np.stack(
    embeddings
)

np.save(
    EMBEDDING_FILE,
    embedding_array,
)


with METADATA_FILE.open(
    "w",
    newline="",
    encoding="utf-8-sig",
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "index",
            "group",
            "filename",
            "relative_path",
        ],
    )

    writer.writeheader()

    writer.writerows(
        metadata
    )


print()
print("[4/4] 저장 완료")
print(
    f"Embedding shape: "
    f"{embedding_array.shape}"
)
print(
    f"Embedding file: "
    f"{EMBEDDING_FILE}"
)
print(
    f"Metadata file: "
    f"{METADATA_FILE}"
)