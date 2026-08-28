import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter basename="/CRM">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen items-center justify-center">CRM Certtidão</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
