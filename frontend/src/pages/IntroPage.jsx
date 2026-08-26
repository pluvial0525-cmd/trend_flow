import { useNavigate } from "react-router-dom";
import introImage from "../assets/graphdb-intro.png";

function IntroPage() {
    const navigate = useNavigate();

    return (
        <main style={styles.page}>
            <img
                src={introImage}
                alt="야, 너도 GraphDB 이해할 수 있어"
                style={styles.image}
            />

            <button
                type="button"
                style={styles.startButton}
                onClick={() => navigate("/trend-intro")}
            >
                시작하기
                <span style={styles.arrow}>→</span>
            </button>
        </main>
    );
}

const styles = {
    page: {
        position: "relative",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#000",
    },

    image: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },

    startButton: {
        position: "absolute",
        right: "6%",
        bottom: "7%",

        display: "flex",
        alignItems: "center",
        gap: "14px",

        padding: "17px 30px",

        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "12px",

        background: "#f43f8c",
        color: "#fff",

        fontSize: "18px",
        fontWeight: 800,

        cursor: "pointer",

        boxShadow: "0 10px 30px rgba(244,63,140,0.35)",
    },

    arrow: {
        fontSize: "25px",
        lineHeight: 1,
    },
};

export default IntroPage;