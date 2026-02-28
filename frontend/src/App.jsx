import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard Shell via Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<Feed />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="search" element={<div style={{ padding: '20px' }}>Search placeholder</div>} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;