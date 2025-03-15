export const metadata = {
  title: 'wanderust-kanban App',
  description: 'Developed by Vishwas Gupat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
