from pathlib import Path
import tempfile

from faster_whisper import WhisperModel


# =========================================================
# WHISPER MODEL
# =========================================================

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
)


# =========================================================
# PROJECT VOCABULARY
#
# 문장 예시를 길게 넣지 않는다.
# Whisper에게 필요한 고유명사/전문용어만 제공.
# =========================================================

VOICE_PROMPT = (
    "콩, "
    "스키니진, "
    "시뮬레이션, "
    "상세 그래프, "
    "트렌드 플로우, "
    "GraphDB, "
    "GraphRAG, "
    "Neo4j, "
    "Cypher, "
    "PCA, "
    "중심성, "
    "RDB, "
    "어그부츠, "
    "로우라이즈, "
    "떡볶이 코트, "
    "더플 코트, "
    "벨루어 트랙수트"
)


# =========================================================
# SPEECH TO TEXT
# =========================================================

def transcribe_audio(
    audio_bytes: bytes,
    suffix: str = ".webm",
) -> str:

    temp_path = None

    try:

        # =================================================
        # TEMP FILE
        # =================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:

            temp_file.write(
                audio_bytes
            )

            temp_path = Path(
                temp_file.name
            )


        # =================================================
        # WHISPER
        # =================================================

        segments, info = model.transcribe(
            str(temp_path),

            # 한국어 고정
            language="ko",

            # CPU 발표용
            # 5보다 처리속도를 조금 확보
            beam_size=3,

            # 프로젝트 고유명사만 힌트
            initial_prompt=VOICE_PROMPT,

            # 이전 조각의 잘못된 문장을
            # 다음 결과에 이어받지 않음
            condition_on_previous_text=False,

            # 랜덤한 추측 최소화
            temperature=0.0,

            # 무음/잡음 구간 억제
            vad_filter=True,

            vad_parameters=dict(
                min_silence_duration_ms=300,
            ),

            # 무음일 가능성이 높은 결과 억제
            no_speech_threshold=0.6,

            # 지나치게 낮은 확률 결과 억제
            log_prob_threshold=-1.0,

            # 반복/환각 문장 억제
            compression_ratio_threshold=2.4,
        )


        # =================================================
        # RESULT
        # =================================================

        texts = []


        for segment in segments:

            segment_text = (
                segment.text
                .strip()
            )


            if not segment_text:
                continue


            print(
                "[WHISPER SEGMENT]",
                {
                    "text": segment_text,
                    "start": segment.start,
                    "end": segment.end,
                    "no_speech_prob":
                        getattr(
                            segment,
                            "no_speech_prob",
                            None,
                        ),
                    "avg_logprob":
                        getattr(
                            segment,
                            "avg_logprob",
                            None,
                        ),
                }
            )


            texts.append(
                segment_text
            )


        text = " ".join(
            texts
        ).strip()


        print(
            "[WHISPER RESULT]",
            repr(text),
        )


        return text


    finally:

        if (
            temp_path
            and temp_path.exists()
        ):

            temp_path.unlink(
                missing_ok=True
            )