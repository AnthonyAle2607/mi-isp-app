import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";

// App with AuthProvider restored now that React bundling is fixed
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={
            <div style={{ padding: '20px', fontFamily: 'Arial' }}>
              <h1>ISP Portal</h1>
              <p>App is working! React bundling fixed.</p>
              <a href="/auth">Go to Login</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
