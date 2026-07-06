import React from "react"

function PartidoCardFinal({
  partido,
  esAdmin,
  marcadoresFinal,
  pronosticosFinal,
  setMarcadoresFinal,
  setPronosticosFinal,
  enviadoFinal,
  finalCerrado,
  renderEstadoPronostico,
  renderEstado,
}) {
  // pronosticosFinal (prop del padre) es la única fuente de verdad.
  // Los inputs leen y escriben directamente ahí, sin estado local intermedio,
  // para que nunca se pierda lo que el usuario ya escribió (incluso si está incompleto).
  const pick = pronosticosFinal?.[partido.id] ?? { local: "", visitante: "" }

  // Lógica para estados (PROXIMAMENTE, EN VIVO, etc)
  const ahora = new Date()
  const fechaPartido = new Date(partido.hora)
  const fechaLimitePronostico = new Date(fechaPartido.getTime() - 30 * 60000) // 30 mins antes
  const tiempoRestante = fechaPartido - ahora
  const minutosRestantes = Math.floor(tiempoRestante / 60000)

  const puedePronosticar = ahora < fechaLimitePronostico

  // Calcular tiempo restante para pronosticar
  const tiempoRestantePronostico = fechaLimitePronostico - ahora
  const diasRestantes = Math.floor(tiempoRestantePronostico / (1000 * 60 * 60 * 24))
  const horasRestantes = Math.floor((tiempoRestantePronostico % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutosRestantes2 = Math.floor((tiempoRestantePronostico % (1000 * 60 * 60)) / (1000 * 60))
  const segundosRestantes = Math.floor((tiempoRestantePronostico % (1000 * 60)) / 1000)

  let textoTiempoRestante = ""
  if (diasRestantes > 0) {
    textoTiempoRestante = `Faltan ${diasRestantes}d ${horasRestantes}h ${minutosRestantes2}m para cerrar pronósticos`
  } else if (horasRestantes > 0) {
    textoTiempoRestante = `Faltan ${horasRestantes}h ${minutosRestantes2}m para cerrar pronósticos`
  } else {
    textoTiempoRestante = `Faltan ${minutosRestantes2}m ${segundosRestantes}s para cerrar pronósticos`
  }

  let estadoPartido = "proximamente"
  if (minutosRestantes < 0 && minutosRestantes > -90) estadoPartido = "envivo"
  if (minutosRestantes <= -90) estadoPartido = "finalizado"

  const handleLocalChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    if (!puedePronosticar) return
    const nuevoLocal = val === "" ? "" : parseInt(val, 10)
    setPronosticosFinal((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: nuevoLocal, visitante: prev?.[partido.id]?.visitante ?? "" },
    }))
  }

  const handleVisitanteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    if (!puedePronosticar) return
    const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
    setPronosticosFinal((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: prev?.[partido.id]?.local ?? "", visitante: nuevoVisitante },
    }))
  }

  const handleAdminLocalChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    const nuevoLocal = val === "" ? "" : parseInt(val, 10)
    const visitante = marcadoresFinal?.[partido.id]?.visitante ?? ""

    setMarcadoresFinal((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: nuevoLocal },
    }))

    if (nuevoLocal !== "" && visitante !== "") {
      const gl = parseInt(nuevoLocal, 10)
      const gv = parseInt(visitante, 10)
      let resultado
      if (gl > gv) resultado = "local"
      else if (gl < gv) resultado = "visitante"
      else resultado = "empate"

      setPronosticosFinal((prev) => ({
        ...prev,
        [partido.id]: resultado,
      }))
    }
  }

  const handleAdminVisitanteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
    const local = marcadoresFinal?.[partido.id]?.local ?? ""

    setMarcadoresFinal((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], visitante: nuevoVisitante },
    }))

    if (local !== "" && nuevoVisitante !== "") {
      const gl = parseInt(local, 10)
      const gv = parseInt(nuevoVisitante, 10)
      let resultado
      if (gl > gv) resultado = "local"
      else if (gl < gv) resultado = "visitante"
      else resultado = "empate"

      setPronosticosFinal((prev) => ({
        ...prev,
        [partido.id]: resultado,
      }))
    }
  }

  const inputStyle = {
    width: "54px",
    height: "54px",
    textAlign: "center",
    fontSize: "1.5rem",
    fontWeight: "900",
    background: "#17212B",
    border: "2px solid #39ff6a44",
    borderRadius: "8px",
    color: "#39ff6a",
    outline: "none",
  }

  const inputAdminStyle = {
    ...inputStyle,
    border: "2px solid #ffd70044",
    color: "#ffd700",
  }

  const getMarcadorListo = (m) => m && m.local !== "" && m.local !== undefined && m.visitante !== "" && m.visitante !== undefined

  const marcador = marcadoresFinal?.[partido.id]
  const marcadorListo = getMarcadorListo(marcador)

  const pickLocal = pick?.local ?? ""
  const pickVisitante = pick?.visitante ?? ""
  const esEmpatePick = pickLocal !== "" && pickVisitante !== "" && pickLocal === pickVisitante

  const pickResultado =
    pickLocal === "" || pickVisitante === ""
      ? null
      : esEmpatePick
        ? "empate"
        : pickLocal > pickVisitante
          ? "local"
          : "visitante"

  const oficialResultado =
    !marcadorListo || marcador?.local === "" || marcador?.visitante === ""
      ? null
      : marcador.local === marcador.visitante
        ? "empate"
        : marcador.local > marcador.visitante
          ? "local"
          : "visitante"

  const acertado = pickResultado && oficialResultado && pickResultado === oficialResultado

  return (
    <div className="partido-card" style={{ borderColor: esAdmin ? "#ffd70022" : "#39ff6a22" }}>
      <div style={{ position: "relative", marginBottom: "12px", paddingRight: "120px" }}>
        <p style={{ color: "#ffffff55", fontSize: "0.78rem", letterSpacing: "1px", textAlign: "center", maxWidth: "100%", margin: "0 auto" }}>
          {partido.fecha} · {new Date(partido.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ position: "absolute", right: 0, top: 0, minWidth: "100px", display: "flex", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
          {!esAdmin ? renderEstadoPronostico(partido, estadoPartido, acertado, pickResultado) : renderEstado(partido.hora)}
        </div>
      </div>

      <div className="partido-equipos">
        <div className="equipo">
          <img
            loading="lazy"
            src={partido.flagLocal ? `https://flagcdn.com/w80/${partido.flagLocal}.png` : undefined}
            alt={partido.local}
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066", opacity: partido.flagLocal ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre">{partido.local}</span>
        </div>

        {esAdmin ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              value={marcadoresFinal?.[partido.id]?.local ?? ""}
              onChange={handleAdminLocalChange}
              style={inputAdminStyle}
            />
            <span style={{ color: "#ffffff44", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              value={marcadoresFinal?.[partido.id]?.visitante ?? ""}
              onChange={handleAdminVisitanteChange}
              style={inputAdminStyle}
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              value={pick?.local ?? ""}
              onChange={handleLocalChange}
              placeholder=""
              style={{
                ...inputStyle,
                opacity: !puedePronosticar ? 0.6 : 1,
                cursor: !puedePronosticar ? "not-allowed" : "text",
              }}
            />
            <span style={{ color: "#ffffff44", fontSize: "1rem", fontWeight: "700" }}>-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              value={pick?.visitante ?? ""}
              onChange={handleVisitanteChange}
              placeholder=""
              style={{
                ...inputStyle,
                opacity: !puedePronosticar ? 0.6 : 1,
                cursor: !puedePronosticar ? "not-allowed" : "text",
              }}
            />
          </div>
        )}

        <div className="equipo">
          <img
            loading="lazy"
            src={partido.flagVisitante ? `https://flagcdn.com/w80/${partido.flagVisitante}.png` : undefined}
            alt={partido.visitante}
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066", opacity: partido.flagVisitante ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre">{partido.visitante}</span>
        </div>
      </div>
      {!esAdmin && puedePronosticar && (
        <p style={{ color: "#39ff6a", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", marginTop: "12px", margin: "12px auto 0", letterSpacing: "0.5px" }}>
          ⏱️ {textoTiempoRestante}
        </p>
      )}
    </div>
  )
}

function areEqual(prev, next) {
  const id = prev.partido.id

  return (
    prev.esAdmin === next.esAdmin &&
    prev.enviadoFinal === next.enviadoFinal &&
    prev.finalCerrado === next.finalCerrado &&
    (prev.pronosticosFinal?.[id]?.local ?? "") === (next.pronosticosFinal?.[id]?.local ?? "") &&
    (prev.pronosticosFinal?.[id]?.visitante ?? "") === (next.pronosticosFinal?.[id]?.visitante ?? "") &&
    (prev.marcadoresFinal?.[id]?.local ?? "") === (next.marcadoresFinal?.[id]?.local ?? "") &&
    (prev.marcadoresFinal?.[id]?.visitante ?? "") === (next.marcadoresFinal?.[id]?.visitante ?? "")
  )
}

export default React.memo(PartidoCardFinal, areEqual)
