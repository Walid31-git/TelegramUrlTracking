import { StatsCards } from '@/components/dashboard/stats-cards'
import { PromoterTable } from '@/components/dashboard/promoter-table'
import { AnalyticsChart } from '@/components/dashboard/analytics-chart'
import { NewMembersTable } from '@/components/dashboard/new-members-table'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Suivez les performances de vos promoteurs en temps réel
          </p>
        </div>
        
        <StatsCards />
        
        {/* <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <AnalyticsChart />
          </div>
          <div className="lg:col-span-3">
            <NewMembersTable />
          </div>
        </div> */}
      </main>
    </div>
  )
}
