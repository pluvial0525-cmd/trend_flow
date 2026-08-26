from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from .service import transcribe_audio


router = APIRouter(
    prefix="/api/voice",
    tags=["voice"],
)


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
):

    try:
        audio_bytes = await audio.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="오디오 데이터가 없습니다.",
            )

        filename = (
            audio.filename
            or "voice.webm"
        )

        suffix = ".webm"

        if "." in filename:
            suffix = (
                "."
                + filename
                .rsplit(".", 1)[-1]
            )

        text = transcribe_audio(
            audio_bytes,
            suffix=suffix,
        )

        return {
            "text": text,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "[VOICE TRANSCRIBE ERROR]",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="음성 인식에 실패했습니다.",
        )