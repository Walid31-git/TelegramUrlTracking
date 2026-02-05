import { DashboardLayout } from '@/components/dashboard-layout'
import { PromotersTable } from '@/components/promoters/promoters-table'
import { AddPromoterDialog } from '@/components/promoters/add-promoter-dialog'

export default function PromotersPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: 'Tableau de bord', href: '/' }, { label: 'Promoteurs' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">Promoteurs</h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Gérez vos promoteurs et canaux Telegram
            </p>
          </div>
          <AddPromoterDialog />
        </div>

        <PromotersTable />
      </div>
    </DashboardLayout>
  )
}
