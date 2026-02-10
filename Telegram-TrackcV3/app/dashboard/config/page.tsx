import { ConfigForm } from '@/components/config/config-form'

export default function ConfigPage() {
  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration du Bot</h1>
          <p className="text-muted-foreground">
            Configurez votre bot Telegram et les canaux source/destination
          </p>
        </div>

        <ConfigForm />
      </div>
    </div>
  )
}
