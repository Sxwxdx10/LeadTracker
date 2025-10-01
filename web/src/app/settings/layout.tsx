import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Paramètres et configuration de l\'organisation',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
