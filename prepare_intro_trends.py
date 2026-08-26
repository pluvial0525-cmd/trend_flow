from pathlib import Path
import csv
import json
from datetime import datetime


ROOT = Path(r"C:\ksm_project\trend_flow")

SOURCE_DIR = (
    ROOT
    / "frontend"
    / "public"
    / "data"
    / "trends"
)

OUTPUT_FILE = (
    SOURCE_DIR
    / "trend_interest_merged.json"
)


FILES = {
    "skinny": {
        "label": "스키니진",
        "file": "skinny.csv",
    },

    "duffle": {
        "label": "떡볶이 코트",
        "file": "duffle.csv",
    },

    "ugg": {
        "label": "어그부츠",
        "file": "ugg.csv",
    },

    "lowrise": {
        "label": "로우라이즈",
        "file": "lowrise.csv",
    },

    "velour": {
        "label": "벨루어 트랙수트",
        "file": "velour.csv",
    },
}


def read_google_trends(path: Path):

    rows = []

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:

            date_text = (
                row.get("Time")
                or ""
            ).strip()

            if not date_text:
                continue


            try:
                date = datetime.strptime(
                    date_text,
                    "%Y-%m-%d",
                )
            except ValueError:
                continue


            values = []

            for key, value in row.items():

                if key == "Time":
                    continue

                if value is None:
                    continue


                try:
                    number = float(
                        str(value)
                        .strip()
                    )

                    values.append(number)

                except ValueError:
                    pass


            if not values:
                continue


            # 같은 패션의 여러 검색 표현 중
            # 해당 월에 가장 강하게 잡힌 값 사용
            representative_value = max(
                values
            )


            rows.append(
                {
                    "date": date,
                    "raw": representative_value,
                }
            )


    return rows


def normalize(rows):

    if not rows:
        return []


    max_value = max(
        row["raw"]
        for row in rows
    )


    if max_value <= 0:
        max_value = 1


    result = []

    for row in rows:

        normalized = (
            row["raw"]
            / max_value
            * 100
        )

        result.append(
            {
                **row,
                "normalized": normalized,
            }
        )


    return result


def moving_average(
    rows,
    window=3,
):

    result = []

    for i, row in enumerate(rows):

        start = max(
            0,
            i - window + 1,
        )

        subset = rows[
            start : i + 1
        ]

        avg = (
            sum(
                x["normalized"]
                for x in subset
            )
            / len(subset)
        )


        result.append(
            {
                "date": row["date"],
                "value": round(
                    avg,
                    2,
                ),
            }
        )


    return result


def main():

    merged = {}


    for key, info in FILES.items():

        path = (
            SOURCE_DIR
            / info["file"]
        )

        print(
            f"[READ] {path}"
        )


        rows = read_google_trends(
            path
        )

        rows = normalize(
            rows
        )

        rows = moving_average(
            rows,
            window=3,
        )


        merged[key] = {
            "label": info["label"],
            "values": {
                row["date"]
                .strftime("%Y-%m"): row["value"]

                for row in rows
            },
        }


    # 모든 날짜 통합
    all_dates = sorted(
        {
            date
            for item in merged.values()
            for date in item["values"]
        }
    )


    output_rows = []

    for date in all_dates:

        row = {
            "date": date,
        }


        for key in FILES:

            row[key] = (
                merged[key]
                ["values"]
                .get(date)
            )


        output_rows.append(row)


    output = {
        "meta": {
            "source": "Google Trends",
            "region": "KR",
            "metric": "relative_interest_pattern",
            "note": (
                "각 패션별 검색어 그룹 내부의 값을 대표값으로 "
                "통합한 뒤 패션별 0~100 재정규화. "
                "절대 검색량 비교가 아닌 시간에 따른 관심도 변화 패턴 비교."
            ),
        },

        "series": {
            key: {
                "label": info["label"],
            }

            for key, info
            in FILES.items()
        },

        "data": output_rows,
    }


    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2,
        )


    print()
    print("[OK]")
    print(OUTPUT_FILE)
    print(
        f"rows = {len(output_rows)}"
    )


if __name__ == "__main__":
    main()