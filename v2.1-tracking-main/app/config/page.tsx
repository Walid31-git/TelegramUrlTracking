import { DashboardLayout } from '@/components/dashboard-layout'
import { TelegramConfiguration } from '@/components/config/telegram-configuration'

export default function ConfigPage() {
  return (
    <DashboardLayout breadcrumbs={[{ label: 'Tableau de bord', href: '/' }, { label: 'Configuration' }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">Configuration</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Configurez votre bot Telegram et synchronisez les statistiques de vos canaux
          </p>
        </div>

        <TelegramConfiguration />
      </div>
    </DashboardLayout>
  )
}
