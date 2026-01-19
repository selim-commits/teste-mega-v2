// Placeholder - will be implemented in Task 3
export interface EmbedConfig {
  studioId: string
  theme: 'light' | 'dark'
  accentColor: string
  services: string[]
  locale: string
}

interface EmbedAppProps {
  config: EmbedConfig
}

export function EmbedApp({ config }: EmbedAppProps) {
  return (
    <div data-studio-id={config.studioId}>
      {/* Widget implementation coming in Task 3 */}
      <p>Rooom OS Booking Widget - Loading...</p>
    </div>
  )
}
