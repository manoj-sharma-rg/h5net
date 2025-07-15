import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import OnboardingWizard from './pages/OnboardingWizard/OnboardingWizard';
import IntegratedPMS from './pages/IntegratedPMS/IntegratedPMS';
import FeedTest from './pages/FeedTest/FeedTest';
import Login from "./pages/Login";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("jwt") || "");

  const handleLogin = (jwt: string) => {
    setToken(jwt);
    localStorage.setItem("jwt", jwt);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("jwt");
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboard" element={<OnboardingWizard />} />
            <Route path="/integrated-pms" element={<IntegratedPMS />} />
            <Route path="/feed-test" element={<FeedTest />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
