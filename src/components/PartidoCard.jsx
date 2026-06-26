import React from "react"

function PartidoCard({ partido, esAdmin, resultados, pronosticos, marcadores, seleccionar, setMarcadores, setResultados, enviado, torneoFinalizado, tab, renderEstadoPronostico, renderEstado }) {
  const resultadoOficial = resultados[partido.id]
  const pick = pronosticos[partido.id]
  const esAcierto = !esAdmin && tab === "pronosticos" && pick && resultadoOficial && pick === resultadoOficial
  const esFallo = !esAdmin && tab === "pronosticos" && pick && resultadoOficial && pick !== resultadoOficial
  const cardClass = esAdmin ? "admin-card" : `partido-card${esAcierto ? " partido-acierto" : esFallo ? " partido-fallo" : ""}`

  return (
    <div key={partido.id} className={cardClass}>
      <div style={{ position: "relative", marginBottom: "12px", paddingRight: "120px" }}>
        <p style={{ color: "#ffffff55", fontSize: "0.78rem", letterSpacing: "1px", textAlign: "center", maxWidth: "100%", margin: "0 auto" }}>
          📅 {partido.fecha} · {new Date(partido.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ position: "absolute", right: 0, top: 0, minWidth: "100px", display: "flex", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
          {tab === "pronosticos" ? renderEstadoPronostico(partido) : renderEstado(partido.hora)}
        </div>
      </div>
      <div className="partido-equipos">
        <div className="equipo">
          <img loading="lazy" src={`https://flagcdn.com/w80/${partido.flagLocal}.png`} alt={partido.local} style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066" }} />
          <span className="equipo-nombre">{partido.local}</span>
        </div>
        {esAdmin ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2"
              value={marcadores[partido.id]?.local ?? ""}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, "")
                const nuevoLocal = val === "" ? "" : parseInt(val)
                const visitante = marcadores[partido.id]?.visitante ?? ""
                setMarcadores(p => ({ ...p, [partido.id]: { ...p[partido.id], local: nuevoLocal } }))
                if (nuevoLocal !== "" && visitante !== "") {
                  const resLocal = parseInt(nuevoLocal)
                  const resVisitante = parseInt(visitante)
                  let resultado
                  if (resLocal > resVisitante) resultado = "local"
                  else if (resLocal < resVisitante) resultado = "visitante"
                  else resultado = "empate"
                  setResultados(p => ({ ...p, [partido.id]: resultado }))
                }
              }}
              style={{ width: "54px", height: "54px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#17212B", border: "2px solid #ffd70044", borderRadius: "8px", color: "#ffd700", outline: "none" }}
            />
            <span style={{ color: "#ffffff44", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2"
              value={marcadores[partido.id]?.visitante ?? ""}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, "")
                const nuevoVisitante = val === "" ? "" : parseInt(val)
                const local = marcadores[partido.id]?.local ?? ""
                setMarcadores(p => ({ ...p, [partido.id]: { ...p[partido.id], visitante: nuevoVisitante } }))
                if (local !== "" && nuevoVisitante !== "") {
                  const resLocal = parseInt(local)
                  const resVisitante = parseInt(nuevoVisitante)
                  let resultado
                  if (resLocal > resVisitante) resultado = "local"
                  else if (resLocal < resVisitante) resultado = "visitante"
                  else resultado = "empate"
                  setResultados(p => ({ ...p, [partido.id]: resultado }))
                }
              }}
              style={{ width: "54px", height: "54px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#17212B", border: "2px solid #ffd70044", borderRadius: "8px", color: "#ffd700", outline: "none" }}
            />
          </div>
        ) : (
          <span className="vs">VS</span>
        )}
        <div className="equipo">
          <img loading="lazy" src={`https://flagcdn.com/w80/${partido.flagVisitante}.png`} alt={partido.visitante} style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066" }} />
          <span className="equipo-nombre">{partido.visitante}</span>
        </div>
      </div>
      {esAdmin && (
        <div className="resultado-opciones" style={{ marginTop: "16px" }}>
          <button className={`btn-resultado ${resultados[partido.id] === "local" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "local" }))}>GANA {partido.local.toUpperCase()}</button>
          <button className={`btn-resultado ${resultados[partido.id] === "empate" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "empate" }))}>EMPATE</button>
          <button className={`btn-resultado ${resultados[partido.id] === "visitante" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "visitante" }))}>GANA {partido.visitante.toUpperCase()}</button>
        </div>
      )}
      {!esAdmin && (
        <div className="opciones">
          <button className={`btn-opcion ${pronosticos[partido.id] === "local" ? "seleccionado" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "local")}>GANA {partido.local.toUpperCase()}</button>
          <button className={`btn-opcion empate ${pronosticos[partido.id] === "empate" ? "empate-sel" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "empate")}>EMPATE</button>
          <button className={`btn-opcion ${pronosticos[partido.id] === "visitante" ? "seleccionado" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "visitante")}>GANA {partido.visitante.toUpperCase()}</button>
        </div>
      )}
    </div>
  )
}

function areEqual(prev, next) {
  const id = prev.partido.id
  return prev.esAdmin === next.esAdmin && prev.enviado === next.enviado
    && prev.pronosticos[id] === next.pronosticos[id]
    && prev.resultados[id] === next.resultados[id]
    && (prev.marcadores[id]?.local ?? "") === (next.marcadores[id]?.local ?? "")
    && (prev.marcadores[id]?.visitante ?? "") === (next.marcadores[id]?.visitante ?? "")
}

export default React.memo(PartidoCard, areEqual)
