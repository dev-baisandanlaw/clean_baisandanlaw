import AppShellComponent from "@/components/AppShellComponent";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellComponent>{children}</AppShellComponent>;
}
