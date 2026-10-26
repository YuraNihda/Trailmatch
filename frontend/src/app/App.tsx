import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "../auth/RequireAuth";
import { CatalogPage } from "../pages/CatalogPage";
import { GuidePage } from "../pages/GuidePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { QuizPage } from "../pages/QuizPage";
import { RecommendedPage } from "../pages/RecommendedPage";
import { TourPage } from "../pages/TourPage";
import { Layout } from "./Layout";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tours" element={<CatalogPage />} />
        <Route path="tours/:id" element={<TourPage />} />
        <Route path="guides/:id" element={<GuidePage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="recommended" element={<RecommendedPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<p className="py-20 text-center">Сторінку не знайдено</p>} />
      </Route>
    </Routes>
  );
}
