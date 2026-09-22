export default function LockedPage({
  icon, title, sub, tier,
}: { icon: string; title: string; sub: string; tier: string }) {
  return (
    <div className="locked-page">
      <div className="locked-icon">{icon}</div>
      <div className="locked-title">{title}</div>
      <div className="locked-sub">{sub}</div>
      <a href="https://prediction.com/api/docs/pricing" target="_blank" rel="noreferrer" className="upgrade-btn">
        升級至 {tier} →
      </a>
    </div>
  )
}
