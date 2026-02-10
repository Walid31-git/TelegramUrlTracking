'use client'

import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardNav />
      <main>{children}</main>
    </>
  )
}
