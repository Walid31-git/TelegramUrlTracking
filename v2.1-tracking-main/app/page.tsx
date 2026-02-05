import { DashboardLayout } from '@/components/dashboard-layout'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MembersTable } from '@/components/dashboard/members-table'
import { PromoterStats } from '@/components/dashboard/promoter-stats'

export default function DashboardPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: 'Tableau de bord' }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Surveillez les performances de vos promoteurs Telegram et les membres
          </p>
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MembersTable />
          </div>
          <div>
            <PromoterStats />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
