import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import NewKitModal from "./components/NewKitModal.jsx";
import ProgressModal from "./components/ProgressModal.jsx";
import KitView from "./components/KitView.jsx";
import AuthModal from "./components/AuthModal.jsx";
import { api } from "./api/client.js";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [kits, setKits] = useState([]);
  const [selectedKitId, setSelectedKitId] = useState(null);

  // Modals
  const [isNewKitOpen, setIsNewKitOpen] = useState(false);
  const [generatingKitId, setGeneratingKitId] = useState(null);

  // Check auth session
  const checkSession = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadKits = async () => {
    if (!currentUser) return;
    try {
      const list = await api.listKits();
      setKits(list);
    } catch (err) {
      console.error("Failed to load kits:", err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadKits();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setSelectedKitId(null);
      setKits([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKitCreated = (kitId) => {
    setIsNewKitOpen(false);
    setGeneratingKitId(kitId);
  };

  const handleGenerationComplete = (kitId) => {
    setGeneratingKitId(null);
    setSelectedKitId(kitId);
    loadKits();
  };

  const handleDeleteKit = async (kitId) => {
    try {
      await api.deleteKit(kitId);
      if (selectedKitId === kitId) setSelectedKitId(null);
      loadKits();
    } catch (err) {
      alert("Error deleting kit: " + err.message);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        Loading HireScope...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        user={currentUser}
        onOpenNewKit={() => setIsNewKitOpen(true)}
        onLogout={handleLogout}
        onHomeClick={() => setSelectedKitId(null)}
      />

      <main style={{ flex: 1 }}>
        {!currentUser ? (
          <AuthModal onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : selectedKitId ? (
          <KitView
            kitId={selectedKitId}
            onBack={() => setSelectedKitId(null)}
          />
        ) : (
          <Dashboard
            kits={kits}
            onSelectKit={(id) => setSelectedKitId(id)}
            onOpenNewKit={() => setIsNewKitOpen(true)}
            onDeleteKit={handleDeleteKit}
          />
        )}
      </main>

      {isNewKitOpen && (
        <NewKitModal
          onClose={() => setIsNewKitOpen(false)}
          onCreated={handleKitCreated}
        />
      )}

      {generatingKitId && (
        <ProgressModal
          kitId={generatingKitId}
          onComplete={handleGenerationComplete}
          onCancel={() => {
            setGeneratingKitId(null);
            loadKits();
          }}
        />
      )}
    </div>
  );
}
