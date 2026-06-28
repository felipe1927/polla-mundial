

const getGrupoDePartido = (partido) => {
  if (partido.id.charAt(0) === 'W') return 'R32'
  return partido.id.charAt(0)
}

const esMismoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export default function TickerBar({ partidos, marcadores, ahora, getEstadoPartido, formatHora }) {
  const partidosHoy = partidos
    .filter(p => esMismoDia(new Date(p.hora), ahora))
    .sort((a, b) => new Date(a.hora) - new Date(b.hora))

  if (partidosHoy.length === 0) {
    return (
      <div className="ticker-bar">
        <span className="ticker-vacio">📅 No hay partidos programados para hoy</span>
      </div>
    )
  }

  const renderItem = (partido, k) => {
    const estado = getEstadoPartido(partido.hora)
    const grupo = getGrupoDePartido(partido)
    const marc = marcadores?.[partido.id]
    const marcadorListo = marc && marc.local !== "" && marc.local !== undefined && marc.visitante !== "" && marc.visitante !== undefined

    return (
      <div className="ticker-item" key={k}>
        {estado === "finalizado" && <span className="ticker-badge ticker-badge-final">FINALIZADO</span>}
        {estado === "envivo" && (
          <span className="ticker-badge ticker-badge-vivo"><span className="ticker-dot" />EN VIVO</span>
        )}
        {estado === "proximo" && <span className="ticker-badge ticker-badge-hora">{formatHora(partido.hora)}</span>}

        <img loading="lazy" className="ticker-flag" src={`https://flagcdn.com/w20/${partido.flagLocal}.png`} alt="" />
        <span className="ticker-equipo">{partido.local}</span>

        {marcadorListo ? (
          <span className="ticker-marcador">{marc.local} - {marc.visitante}</span>
        ) : (
          <span className="ticker-vs">VS</span>
        )}

        <span className="ticker-equipo">{partido.visitante}</span>
        <img loading="lazy" className="ticker-flag" src={`https://flagcdn.com/w20/${partido.flagVisitante}.png`} alt="" />

        <span className="ticker-grupo">{grupo === 'R32' ? 'R32' : `GRUPO ${grupo}`}</span>
      </div>
    )
  }

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="ticker-content">
            {partidosHoy.map((p, i) => renderItem(p, `${idx}-${i}`))}
          </div>
        ))}
      </div>
    </div>
  )
}
