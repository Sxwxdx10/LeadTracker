import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, UserX, UserCheck, Mail } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ROLE_DISPLAY_NAMES } from '@/types/user';
import { cn } from '@/lib/utils';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onEditRoles?: (user: User) => void;
  onResendInvitation?: (user: User) => void;
}

interface ActionMenuProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onEditRoles?: (user: User) => void;
  onResendInvitation?: (user: User) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  onEditRoles,
  onResendInvitation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(user);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </button>
            )}

            {onEditRoles && (
              <button
                onClick={() => {
                  onEditRoles(user);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Gérer les rôles
              </button>
            )}

            {onToggleStatus && (
              <button
                onClick={() => {
                  onToggleStatus(user);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm hover:bg-gray-100",
                  user.isActive ? "text-orange-600" : "text-green-600"
                )}
              >
                {user.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activer
                  </>
                )}
              </button>
            )}

            {onResendInvitation && !user.lastLoginAt && (
              <button
                onClick={() => {
                  onResendInvitation(user);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                <Mail className="mr-2 h-4 w-4" />
                Renvoyer l'invitation
              </button>
            )}

            <div className="border-t border-gray-100" />

            {onDelete && (
              <button
                onClick={() => {
                  onDelete(user);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onEditRoles,
  onResendInvitation
}) => {
  if (isLoading) {
    return (
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôles</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 p-8 text-center">
        <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun utilisateur trouvé
        </h3>
        <p className="text-gray-500">
          Commencez par inviter des utilisateurs dans votre organisation.
        </p>
      </div>
    );
  }

  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) {
      return (
        <span className="text-gray-500 text-sm">
          Jamais connecté
        </span>
      );
    }

    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return <span className="text-green-600 text-sm">À l'instant</span>;
    } else if (diffInHours < 24) {
      return <span className="text-green-600 text-sm">Il y a {diffInHours}h</span>;
    } else {
      return (
        <span className="text-gray-600 text-sm">
          {date.toLocaleDateString('fr-FR')}
        </span>
      );
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return (
        <Badge variant="destructive">
          Désactivé
        </Badge>
      );
    }

    if (!user.lastLoginAt) {
      return (
        <Badge variant="warning">
          En attente
        </Badge>
      );
    }

    return (
      <Badge variant="success">
        Actif
      </Badge>
    );
  };

  const getUserInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôles</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {getUserInitials(user)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.fullName}
                    </div>
                    {user.jobTitle && (
                      <div className="text-sm text-gray-500">
                        {user.jobTitle}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-900">
                {user.email}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(user)}
              </TableCell>
              <TableCell>
                {formatLastLogin(user.lastLoginAt)}
              </TableCell>
              <TableCell>
                <ActionMenu
                  user={user}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onEditRoles={onEditRoles}
                  onResendInvitation={onResendInvitation}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
