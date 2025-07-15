
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface PermissionCheckerProps {
  children: ReactNode;
}

export const PermissionChecker = ({ children }: PermissionCheckerProps) => {
  const { userData, isFirstLogin } = useAuth();
  const location = useLocation();

  const paginaId = location.pathname.replace('/', '');
  const temPermissao = userData?.tipoAcesso === 'Administrador' || 
                      userData?.permissoes?.includes(paginaId) ||
                      paginaId === 'inicio';

  if (isFirstLogin) {
    // TODO: Implementar modal de troca de senha no futuro
    // return <ModalTrocaSenha />;
  }

  if (!temPermissao && paginaId !== 'inicio') {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};
