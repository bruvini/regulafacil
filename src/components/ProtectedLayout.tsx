
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { AlterarSenhaModal } from './modals/AlterarSenhaModal';

const ProtectedLayout = () => {
  const { currentUser, loading, isFirstLogin } = useAuth();
  const navigate = useNavigate();

  // Redireciona para login se não houver usuário autenticado
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {/* O modal de troca de senha é renderizado aqui, sobrepondo tudo */}
      <AlterarSenhaModal open={isFirstLogin} />

      {/* O layout principal só é acessível se não for o primeiro login */}
      <div className={isFirstLogin ? 'pointer-events-none' : ''}>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </div>
    </>
  );
};

export default ProtectedLayout;
