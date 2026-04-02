import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { nakamaState } from './nakama';
import LoginScreen from './screens/LoginScreen';
import MainMenuScreen from './screens/MainMenuScreen';
import GameScreen from './screens/GameScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!nakamaState.session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainMenuScreen />
          </ProtectedRoute>
        } />
        <Route path="/game/:matchId" element={
          <ProtectedRoute>
            <GameScreen />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
