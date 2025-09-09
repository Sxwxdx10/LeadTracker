import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads',
  description: 'Gestion des leads et prospects',
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
