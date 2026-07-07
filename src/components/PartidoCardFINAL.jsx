import React, { useState, useRef, useEffect } from "react"

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

  const visitanteRef = useRef(null)

  // Reloj interno que "tickea" cada segundo, solo para que el countdown de
  // esta tarjeta se vea correr en vivo (segundo a segundo) sin depender de
  // que el padre vuelva a renderizar por otro motivo.
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

  // Calcular tiempo restante para pronosticar (ahora con segundos en vivo)
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
    setPronosticosFinal((prev) => ({
      ...prev,
      [partido.id]: { ...prev?.[partido.id], local: nuevoLocal, visitante: prev?.[partido.id]?.visitante ?? "" },
    }))
    // Auto-avanza al campo de visitante apenas se escribe el primer dígito
    // (los marcadores de fútbol casi siempre son de una cifra).
    if (val.length === 1) {
      visitanteRef.current?.focus()
    }
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

  // Inputs un poco más grandes que en el resto del torneo: es la única
  // tarjeta de toda la app que lo amerita.
  const inputStyle = {
    width: "60px",
    height: "60px",
    textAlign: "center",
    fontSize: "1.6rem",
    fontWeight: "900",
    background: "#1a1509",
    border: "2px solid #ffd70066",
    borderRadius: "8px",
    color: "#ffd700",
    outline: "none",
    boxShadow: "0 0 10px #ffd70022",
  }

  const inputAdminStyle = {
    ...inputStyle,
    border: "2px solid #ffd700aa",
    boxShadow: "0 0 14px #ffd70044",
  }

  // Estrellas decorativas cayendo de fondo (posición, tamaño, retraso y duración fijos
  // para que no "parpadeen" distinto en cada render)
  const ESTRELLAS = [
    { left: "4%", size: "12px", delay: "0s", duration: "6s" },
    { left: "14%", size: "8px", delay: "1.4s", duration: "8s" },
    { left: "24%", size: "14px", delay: "2.6s", duration: "5.5s" },
    { left: "34%", size: "9px", delay: "0.6s", duration: "7.2s" },
    { left: "46%", size: "11px", delay: "3.2s", duration: "6.4s" },
    { left: "58%", size: "8px", delay: "1.8s", duration: "8.6s" },
    { left: "68%", size: "13px", delay: "0.2s", duration: "5.8s" },
    { left: "78%", size: "9px", delay: "2.2s", duration: "7.6s" },
    { left: "88%", size: "12px", delay: "1s", duration: "6.8s" },
    { left: "95%", size: "8px", delay: "3.6s", duration: "9s" },
  ]

  // Piezas de confeti para el festejo cuando el usuario acierta la Final
  // (posiciones/ángulos fijos, para que el estallido se vea igual de prolijo siempre)
  const CONFETI = [
    { tx: "-70px", ty: "-90px", rot: "140deg", color: "#ffd700", delay: "0s" },
    { tx: "-40px", ty: "-120px", rot: "-90deg", color: "#fff3c4", delay: "0.03s" },
    { tx: "-10px", ty: "-130px", rot: "220deg", color: "#ffb300", delay: "0.06s" },
    { tx: "20px", ty: "-125px", rot: "-160deg", color: "#ffd700", delay: "0.02s" },
    { tx: "50px", ty: "-110px", rot: "80deg", color: "#fff3c4", delay: "0.08s" },
    { tx: "75px", ty: "-80px", rot: "-40deg", color: "#ffb300", delay: "0.05s" },
    { tx: "-85px", ty: "-40px", rot: "10deg", color: "#ffd700", delay: "0.1s" },
    { tx: "85px", ty: "-45px", rot: "-120deg", color: "#fff3c4", delay: "0.07s" },
    { tx: "-55px", ty: "-20px", rot: "200deg", color: "#ffb300", delay: "0.12s" },
    { tx: "55px", ty: "-15px", rot: "-200deg", color: "#ffd700", delay: "0.09s" },
    { tx: "-25px", ty: "-150px", rot: "60deg", color: "#fff3c4", delay: "0.04s" },
    { tx: "30px", ty: "-150px", rot: "-60deg", color: "#ffb300", delay: "0.11s" },
    { tx: "-95px", ty: "-70px", rot: "300deg", color: "#ffd700", delay: "0.13s" },
    { tx: "95px", ty: "-60px", rot: "-300deg", color: "#fff3c4", delay: "0.01s" },
  ]

  const getMarcadorListo = (m) => m && m.local !== "" && m.local !== undefined && m.visitante !== "" && m.visitante !== undefined

  const marcador = marcadoresFinal?.[partido.id]
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
      className="partido-card partido-card-final"
      style={{
        position: "relative",
        overflow: "hidden",
        borderColor: "#ffd700",
        background: "linear-gradient(180deg, #1a1509 0%, #171008 55%, #14100a 100%)",
        boxShadow: "0 0 0 1px #ffd70033, 0 0 28px #ffd7002e, inset 0 0 40px #ffd70011",
        animation: "final-border-glow 3.2s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes final-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px #ffd70033, 0 0 28px #ffd7002e, inset 0 0 40px #ffd70011; }
          50% { box-shadow: 0 0 0 1px #ffd700aa, 0 0 46px #ffd70055, inset 0 0 50px #ffd70022; }
        }
        @keyframes final-star-fall {
          0% { top: -8%; transform: rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 108%; transform: rotate(200deg); opacity: 0; }
        }
        @keyframes final-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes final-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes final-confetti-burst {
          0% { transform: translate(0, 0) rotate(0deg) scale(0.5); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity: 0; }
        }
        @keyframes final-badge-in {
          0% { transform: translateY(6px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .partido-card-final .final-estrella {
          position: absolute;
          color: #ffd700;
          opacity: 0;
          pointer-events: none;
          text-shadow: 0 0 6px #ffd700aa;
          animation-name: final-star-fall;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          z-index: 0;
        }
        .partido-card-final .final-ribbon {
          background: linear-gradient(90deg, #ffd70000, #ffd700, #fff3c4, #ffd700, #ffd70000);
          background-size: 200% 100%;
          animation: final-shimmer 3.5s linear infinite;
        }
        .partido-card-final .final-check {
          animation: final-pop 0.45s ease;
        }
        .partido-card-final .final-confeti-pieza {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 10px;
          pointer-events: none;
          z-index: 2;
          animation-name: final-confetti-burst;
          animation-duration: 1.2s;
          animation-timing-function: ease-out;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        .partido-card-final .final-badge-acierto {
          animation: final-badge-in 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .partido-card-final, .partido-card-final * {
            animation: none !important;
          }
        }
      `}</style>

      {ESTRELLAS.map((e, i) => (
        <span
          key={i}
          className="final-estrella"
          style={{
            left: e.left,
            fontSize: e.size,
            animationDelay: e.delay,
            animationDuration: e.duration,
          }}
        >
          ★
        </span>
      ))}

      {!esAdmin && acertado && (
        <>
          {CONFETI.map((c, i) => (
            <span
              key={i}
              className="final-confeti-pieza"
              style={{
                background: c.color,
                animationDelay: c.delay,
                "--tx": c.tx,
                "--ty": c.ty,
                "--rot": c.rot,
              }}
            />
          ))}
        </>
      )}

      <div
        className="final-ribbon"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          color: "#17120a",
          fontWeight: "900",
          fontSize: "0.72rem",
          letterSpacing: "2px",
          padding: "5px 0",
          margin: "-16px -18px 14px",
          borderBottom: "1px solid #ffd70066",
        }}
      >
        🏆 GRAN FINAL 🏆
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
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 12px #ffd70033", opacity: partido.flagLocal ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre" style={{ color: "#ffe9a8" }}>{partido.local}</span>
        </div>

        {esAdmin ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Marcador oficial de ${partido.local} en la Final`}
              value={marcadoresFinal?.[partido.id]?.local ?? ""}
              onChange={handleAdminLocalChange}
              style={inputAdminStyle}
            />
            <span style={{ color: "#ffd70066", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Marcador oficial de ${partido.visitante} en la Final`}
              value={marcadoresFinal?.[partido.id]?.visitante ?? ""}
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
              aria-label={`Goles de ${partido.local} en la Final`}
              value={pick?.local ?? ""}
              onChange={handleLocalChange}
              placeholder=""
              style={{
                ...inputStyle,
                opacity: !puedePronosticar ? 0.6 : 1,
                cursor: !puedePronosticar ? "not-allowed" : "text",
              }}
            />
            <span style={{ color: "#ffd70066", fontSize: "1rem", fontWeight: "700" }}>-</span>
            <input
              ref={visitanteRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="2"
              aria-label={`Goles de ${partido.visitante} en la Final`}
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
                className="final-check"
                style={{
                  position: "absolute",
                  right: "-28px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#ffd700",
                  fontSize: "1.3rem",
                  textShadow: "0 0 8px #ffd70088",
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
            style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 12px #ffd70033", opacity: partido.flagVisitante ? 1 : 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className="equipo-nombre" style={{ color: "#ffe9a8" }}>{partido.visitante}</span>
        </div>
      </div>

      {!esAdmin && puedePronosticar && (
        <p style={{ position: "relative", zIndex: 1, color: "#ffd700", fontSize: "0.85rem", fontWeight: "600", textAlign: "center", marginTop: "12px", margin: "12px auto 0", letterSpacing: "0.5px" }}>
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
          className="final-badge-acierto"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            marginTop: "12px",
            color: "#17120a",
            background: "linear-gradient(90deg, #ffd700, #fff3c4, #ffd700)",
            fontWeight: "900",
            fontSize: "0.85rem",
            letterSpacing: "0.5px",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          🎉 ¡ACERTASTE LA FINAL! 🎉
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
