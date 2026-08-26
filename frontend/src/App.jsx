import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom";

import TrendCityPage from "./pages/TrendCityPage";
import GraphStructurePage from "./pages/GraphStructurePage";
import CypherPage from "./pages/CypherPage";
import PathTraversalPage from "./pages/PathTraversalPage";
import RdbVsGraphPage from "./pages/RdbVsGraphPage";
import TrendFlowPage from "./pages/TrendFlowPage";
import TrendAnalysisPage from "./pages/TrendAnalysisPage";
import CentralityPage from "./pages/CentralityPage";
import TrendDetailPage from "./pages/TrendDetailPage";
import TrendSignalPage from "./pages/TrendSignalPage";
import TrendPatternPage from "./pages/TrendPatternPage";
import TrendImageAnalysisPage from "./pages/TrendImageAnalysisPage";
import TrendGraphRAGPage from "./pages/TrendGraphRAGPage";
import IntroPage from "./pages/IntroPage";
import TrendIntroPage from "./pages/TrendIntroPage";
import TrendInsightPage from "./pages/TrendInsightPage";
import VoiceCommandBar from "./components/voice/VoiceCommandBar";



function App() {
    return (
        <BrowserRouter>

            <VoiceCommandBar />

            <Routes>

                <Route
                    path="/"
                    element={<IntroPage />}
                />

                <Route
                    path="/trend-city"
                    element={<TrendCityPage />}
                />

                <Route
                    path="/graph-structure"
                    element={<GraphStructurePage />}
                />

                <Route
                    path="/cypher"
                    element={<CypherPage />}
                />

                <Route
                    path="/path-traversal"
                    element={<PathTraversalPage />}
                />

                <Route
                    path="/rdb-vs-graph"
                    element={<RdbVsGraphPage />}
                />

                <Route
                    path="/trend-flow"
                    element={<TrendFlowPage />}
                />

                <Route
                    path="/trend-analysis"
                    element={<TrendAnalysisPage />}
                />

                <Route
                    path="/centrality"
                    element={<CentralityPage />}
                />

                <Route
                    path="/trend-flow/:trendId"
                    element={<TrendDetailPage />}
                />

                <Route
                    path="/trend-signal"
                    element={<TrendSignalPage />}
                />

                <Route
                    path="/trend-patterns"
                    element={<TrendPatternPage />}
                />

                <Route
                    path="/trend-image-analysis"
                    element={<TrendImageAnalysisPage />}
                />

                <Route
                    path="/trend-graphrag"
                    element={<TrendGraphRAGPage />}
                />
                <Route
                    path="/trend-intro"
                    element={<TrendIntroPage />}
                />

                <Route
                    path="/trend-insight"
                    element={<TrendInsightPage />}
                />

            </Routes>
        </BrowserRouter>
    );
}


export default App;