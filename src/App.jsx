const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Chat from './pages/Chat';
import Goals from './pages/Goals';
import Tutor from './pages/Tutor';
import FlowTeach from './pages/FlowTeach';
import AppLayout from './components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingPrompt, setPendingPrompt] = useState(null);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center">
            <img src="https://media.db.com/images/public/69d22c2b0c2c3109e3707efc/65c0d6401_copy.png" alt="MagpAI Logo" className="h-12 w-12 object-contain" />
          </div>
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  const handleNavigateToChat = (prompt) => {
    setPendingPrompt(prompt);
    setActiveTab('chat');
  };

  return (
    <Routes>
      <Route path="/" element={
        <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'chat' ? (
            <Chat
              onGoToGoals={() => setActiveTab('goals')}
              onGoToFlowTeach={() => setActiveTab('flowteach')}
              initialPrompt={pendingPrompt}
              onInitialPromptConsumed={() => setPendingPrompt(null)}
            />
          ) : activeTab === 'goals' ? (
            <Goals onNavigateToChat={handleNavigateToChat} />
          ) : activeTab === 'tutor' ? (
            <Tutor />
          ) : (
            <FlowTeach />
          )}
        </AppLayout>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;