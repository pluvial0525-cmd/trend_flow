const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";


export async function transcribeVoice(
    audioBlob
) {

    const formData =
        new FormData();


    formData.append(
        "audio",
        audioBlob,
        "voice.webm"
    );


    const response =
        await fetch(
            `${API_BASE_URL}/api/voice/transcribe`,
            {
                method: "POST",
                body: formData,
            }
        );


    if (!response.ok) {

        let message =
            "Whisper 음성 인식에 실패했습니다.";


        try {

            const errorData =
                await response.json();


            message =
                errorData?.detail ||
                message;

        } catch {

            // JSON 응답이 아니면 기본 메시지 사용
        }


        throw new Error(
            message
        );
    }


    return response.json();
}