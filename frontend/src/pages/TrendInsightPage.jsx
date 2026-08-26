import { ArrowLeft, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../styles/TrendInsightPage.css";


function TrendInsightPage() {
    const navigate = useNavigate();

    return (
        <main className="final-page">

            {/* 배경 빛 */}
            <div className="final-glow final-glow-left" />
            <div className="final-glow final-glow-right" />


            {/* =========================================
                이전 버튼
            ========================================= */}
            <button
                type="button"
                className="final-back"
                onClick={() => navigate("/trend-graphrag")}
            >
                <ArrowLeft size={16} />
                이전
            </button>


            {/* =========================================
                MAIN
            ========================================= */}
            <section className="final-content">

                <div className="final-review-title">
                    GraphDB강의 프로젝트를 마치며
                </div>



                {/* =====================================
                    DATA → RELATIONSHIP → INSIGHT
                ===================================== */}
                <div className="final-graph">

                    {/* 첫 번째 연결선 */}
                    <div className="final-line line-one">
                        <span />
                    </div>

                    {/* 두 번째 연결선 */}
                    <div className="final-line line-two">
                        <span />
                    </div>


                    {/* DATA */}
                    <div className="graph-stage stage-data">

                        <div className="node-cluster">
                            <span className="mini-node node-1" />
                            <span className="mini-node node-2" />
                            <span className="mini-node node-3" />
                            <span className="mini-node node-4" />
                            <span className="mini-node node-5" />
                        </div>

                        <strong>DATA</strong>

                        <p>좋은 데이터</p>

                    </div>


                    {/* RELATIONSHIP */}
                    <div className="graph-stage stage-relation">

                        <div className="relationship-symbol">

                            <span className="relation-center" />

                            <span className="relation-node r1" />
                            <span className="relation-node r2" />
                            <span className="relation-node r3" />
                            <span className="relation-node r4" />

                            <i className="relation-edge re1" />
                            <i className="relation-edge re2" />
                            <i className="relation-edge re3" />
                            <i className="relation-edge re4" />

                        </div>

                        <strong>RELATIONSHIP</strong>

                        <p>관계의 연결</p>

                    </div>


                    {/* INSIGHT */}
                    <div className="graph-stage stage-insight">

                        <div className="insight-symbol">

                            <div className="insight-ring ring-one" />
                            <div className="insight-ring ring-two" />

                            <span className="insight-core" />

                        </div>

                        <strong>INSIGHT</strong>

                        <p>새로운 발견</p>

                    </div>

                </div>


                {/* =====================================
                    PROJECT REVIEW
                ===================================== */}
                <div className="final-review-message">

                    <p>
                        이번 프로젝트를 통해
                        <strong> 데이터의 질이 분석 결과에 얼마나 큰 영향을 주는지</strong>,
                    </p>

                    <p>
                        그리고 관계를 탐색하는 과정에서
                        <strong> 새로운 질문과 아이디어가 만들어질 수 있다는 것</strong>을
                        배웠습니다.
                    </p>

                </div>


                {/* =====================================
                    THANK YOU
                ===================================== */}
                <div className="final-thanks">

                    <span className="thanks-line" />

                    <strong>THANK YOU.</strong>

                    <p>
                        GRAPH DB · TREND ANALYSIS
                    </p>

                </div>

            </section>


            {/* =========================================
                처음으로
            ========================================= */}
            <button
                type="button"
                className="final-restart"
                onClick={() => navigate("/")}
            >
                처음으로
                <RotateCcw size={15} />
            </button>

        </main>
    );
}


export default TrendInsightPage;