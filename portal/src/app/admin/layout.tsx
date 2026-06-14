export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-[linear-gradient(180deg,#fbfcff_0%,#f4f7ff_100%)]">{children}</div>;
}
