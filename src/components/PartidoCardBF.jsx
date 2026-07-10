import React, { useState, useEffect, useRef } from "react"

function PartidoCardBF({
  partido,
  esAdmin,
  marcadoresBF,
  pronosticosBF,
  setMarcadoresBF,
  setPronosticosBF,
  enviadoBF,
  bfCerrado,
  renderEstadoPronostico,
  renderEstado,
}) {
  // pronosticosBF (prop del padre) es la única fuente de verdad.
  // Los inputs leen y escriben directamente ahí, sin estado local intermedio,
  // para que nunca se pierda lo que el usuario ya escribió (incluso si está incompleto).
  const pick = pronosticosBF?.[partido.id] ?? { local: "", visitante: "" }

  const visitanteRef = useRef(null)

  // Reloj interno que "tickea" cada segundo, igual que en la Final, para que
  // el countdown corra en vivo sin depender de otro render del padre.
  const [ahoraTick, setAhoraTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhoraTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Lógica para estados (PROXIMAMENTE, EN VIVO, etc)
  const ahora = new Date(ahoraTick)
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
    textoTiempoRestante = `Faltan ${horasRestantes}h ${minutosRestantes2}m ${segundosRestantes}s para cerrar pronósticos`
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
    setPronosticosBF((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: nuevoLocal, visitante: prev?.[partido.id]?.visitante ?? "" },
    }))
    // Auto-avanza al campo de visitante apenas se escribe el primer dígito.
    if (val.length === 1) {
      visitanteRef.current?.focus()
    }
  }

  const handleVisitanteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    if (!puedePronosticar) return
    const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
    setPronosticosBF((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: prev?.[partido.id]?.local ?? "", visitante: nuevoVisitante },
    }))
  }

  const handleAdminLocalChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    const nuevoLocal = val === "" ? "" : parseInt(val, 10)
    const visitante = marcadoresBF?.[partido.id]?.visitante ?? ""

    setMarcadoresBF((prev) => ({
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

      setPronosticosBF((prev) => ({
        ...prev,
        [partido.id]: resultado,
      }))
    }
  }

  const handleAdminVisitanteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
    const local = marcadoresBF?.[partido.id]?.local ?? ""

    setMarcadoresBF((prev) => ({
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

      setPronosticosBF((prev) => ({
        ...prev,
        [partido.id]: resultado,
      }))
    }
  }

  // Paleta bronce para el tercer puesto (un escalón por debajo del dorado de la Final)
  const inputStyle = {
    width: "56px",
    height: "56px",
    textAlign: "center",
    fontSize: "1.5rem",
    fontWeight: "900",
    background: "#1c130a",
    border: "2px solid #cd7f3266",
    borderRadius: "8px",
    color: "#e8a660",
    outline: "none",
    boxShadow: "0 0 8px #cd7f3222",
  }

  const inputAdminStyle = {
    ...inputStyle,
    border: "2px solid #cd7f32aa",
    boxShadow: "0 0 12px #cd7f3244",
  }

  const getMarcadorListo = (m) => m && m.local !== "" && m.local !== undefined && m.visitante !== "" && m.visitante !== undefined

  const marcador = marcadoresBF?.[partido.id]
  const marcadorListo = getMarcadorListo(marcador)

  const pickLocal = pick?.local ?? ""
  const pickVisitante = pick?.visitante ?? ""
  const esEmpatePick = pickLocal !== "" && pickVisitante !== "" && pickLocal === pickVisitante
  const pickCompleto = pickLocal !== "" && pickVisitante !== ""

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
    <div
      className="partido-card partido-card-bf"
      style={{
        position: "relative",
        overflow: "hidden",
        borderColor: "#cd7f32",
        background: "linear-gradient(180deg, #1c130a 0%, #191007 55%, #150e08 100%)",
        boxShadow: "0 0 0 1px #cd7f3233, 0 0 22px #cd7f322a, inset 0 0 30px #cd7f3210",
        animation: "bf-border-glow 3.2s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes bf-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px #cd7f3233, 0 0 22px #cd7f322a, inset 0 0 30px #cd7f3210; }
          50% { box-shadow: 0 0 0 1px #cd7f3288, 0 0 34px #cd7f3244, inset 0 0 36px #cd7f3218; }
        }
        @keyframes bf-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bf-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bf-badge-in {
          0% { transform: translateY(6px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .partido-card-bf .bf-ribbon {
          background: linear-gradient(90deg, #cd7f3200, #cd7f32, #e8a660, #cd7f32, #cd7f3200);
          background-size: 200% 100%;
          animation: bf-shimmer 3.5s linear infinite;
        }
        .partido-card-bf .bf-check {
          animation: bf-pop 0.45s ease;
        }
        .partido-card-bf .bf-badge-acierto {
          animation: bf-badge-in 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .partido-card-bf, .partido-card-bf * {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="bf-ribbon"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          color: "#2a1a0a",
          fontWeight: "900",
          fontSize: "0.72rem",
          letterSpacing: "2px",
          padding: "5px 0",
          margin: "-16px -18px 14px",
          borderBottom: "1px solid #cd7f3266",
        }}
      >
        🥉 TERCER PUESTO 🥉
      </div>

      <div style={{ position: "relative", zIndex: 1, marginBottom: "12px", paddingRight: "120px" }}>
        <p style={{ color: "#ffffff55", fontSize: "0.78rem", letterSpacing: "1px", textAlign: "center", maxWidth: "100%", margin: "0 auto" }}>
          {partido.fecha} · {new Date(partido.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ position: "absolute", right: 0, top: 0, minWidth: "100px", display: "flex", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
          {!esAdmin ? renderEstadoPronostico(partido, estadoPartido, acertado, pickResultado) : renderEstado(partido.hora)}
        </div>
      </div>

      <div className="partido-equipos" style={{ position: "relative", zIndex: 1 }}>
        <div className="equipo">
          <img
            loading="lazy"
            src={partido.flagLocal ? `https://flagcdn.com/w80/${partido.flagLocal}.png` : undefined}
            alt={partido.local}
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 10px #cd7f3233", opacity: partido.flagLocal ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre" style={{ color: "#e8c9a0" }}>{partido.local}</span>
        </div>

        {esAdmin ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Marcador oficial de ${partido.local} en el Tercer Puesto`}
              value={marcadoresBF?.[partido.id]?.local ?? ""}
              onChange={handleAdminLocalChange}
              style={inputAdminStyle}
            />
            <span style={{ color: "#cd7f3266", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Marcador oficial de ${partido.visitante} en el Tercer Puesto`}
              value={marcadoresBF?.[partido.id]?.visitante ?? ""}
              onChange={handleAdminVisitanteChange}
              style={inputAdminStyle}
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Goles de ${partido.local} en el Tercer Puesto`}
              value={pick?.local ?? ""}
              onChange={handleLocalChange}
              placeholder=""
              style={{
                ...inputStyle,
                opacity: !puedePronosticar ? 0.6 : 1,
                cursor: !puedePronosticar ? "not-allowed" : "text",
              }}
            />
            <span style={{ color: "#cd7f3266", fontSize: "1rem", fontWeight: "700" }}>-</span>
            <input
              ref={visitanteRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Goles de ${partido.visitante} en el Tercer Puesto`}
              value={pick?.visitante ?? ""}
              onChange={handleVisitanteChange}
              placeholder=""
              style={{
                ...inputStyle,
                opacity: !puedePronosticar ? 0.6 : 1,
                cursor: !puedePronosticar ? "not-allowed" : "text",
              }}
            />
            {pickCompleto && (
              <span
                className="bf-check"
                style={{
                  position: "absolute",
                  right: "-28px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#e8a660",
                  fontSize: "1.3rem",
                  textShadow: "0 0 8px #cd7f3288",
                }}
              >
                ✓
              </span>
            )}
          </div>
        )}

        <div className="equipo">
          <img
            loading="lazy"
            src={partido.flagVisitante ? `https://flagcdn.com/w80/${partido.flagVisitante}.png` : undefined}
            alt={partido.visitante}
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 10px #cd7f3233", opacity: partido.flagVisitante ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre" style={{ color: "#e8c9a0" }}>{partido.visitante}</span>
        </div>
      </div>

      {!esAdmin && puedePronosticar && (
        <p style={{ position: "relative", zIndex: 1, color: "#e8a660", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", marginTop: "12px", margin: "12px auto 0", letterSpacing: "0.5px" }}>
          ⏱️ {textoTiempoRestante}
        </p>
      )}

      {!esAdmin && !puedePronosticar && (
        <p style={{ position: "relative", zIndex: 1, color: "#ffffff66", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", marginTop: "12px", margin: "12px auto 0", letterSpacing: "0.5px" }}>
          🔒 Pronósticos cerrados
        </p>
      )}

      {!esAdmin && acertado && (
        <p
          className="bf-badge-acierto"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            marginTop: "12px",
            color: "#2a1a0a",
            background: "linear-gradient(90deg, #cd7f32, #e8a660, #cd7f32)",
            fontWeight: "900",
            fontSize: "0.85rem",
            letterSpacing: "0.5px",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          🥉 ¡ACERTASTE EL TERCER PUESTO! 🥉
        </p>
      )}
    </div>
  )
}

function areEqual(prev, next) {
  const id = prev.partido.id

  return (
    prev.esAdmin === next.esAdmin &&
    prev.enviadoBF === next.enviadoBF &&
    prev.bfCerrado === next.bfCerrado &&
    (prev.pronosticosBF?.[id]?.local ?? "") === (next.pronosticosBF?.[id]?.local ?? "") &&
    (prev.pronosticosBF?.[id]?.visitante ?? "") === (next.pronosticosBF?.[id]?.visitante ?? "") &&
    (prev.marcadoresBF?.[id]?.local ?? "") === (next.marcadoresBF?.[id]?.local ?? "") &&
    (prev.marcadoresBF?.[id]?.visitante ?? "") === (next.marcadoresBF?.[id]?.visitante ?? "")
  )
}

export default React.memo(PartidoCardBF, areEqual)
