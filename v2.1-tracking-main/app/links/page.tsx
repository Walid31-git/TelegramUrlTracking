import { DashboardLayout } from '@/components/dashboard-layout'
import { LinksTable } from '@/components/links/links-table'
import { AddLinkDialog } from '@/components/links/add-link-dialog'

export default function LinksPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: 'Tableau de bord', href: '/' }, { label: 'Liens suivis' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">Liens suivis</h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Gérez et surveillez vos liens de suivi
            </p>
          </div>
          <AddLinkDialog />
        </div>

        <LinksTable />
      </div>
    </DashboardLayout>
  )
}
