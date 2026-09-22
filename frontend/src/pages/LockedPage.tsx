import ExplorerLayout from '../components/ExplorerLayout'

interface Props {
  method?: 'GET' | 'WS'
  path: string
  desc: string
  tier: string
  what: string
}

export default function LockedPage({ method = 'GET', path, desc, tier, what }: Props) {
  return (
    <ExplorerLayout
      method={method} path={path} desc={desc}
      locked={{ tier, what }}
      onRun={() => {}}
      requestSlot={null}
      visualSlot={null}
      responseData={null}
      responseState="idle"
    />
  )
}
