import PersonalizacaoNav from "@/components/revendedora/PersonalizacaoNav";

export default function PersonalizacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PersonalizacaoNav />
      {children}
    </div>
  );
}
