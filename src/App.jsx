import { useState, useEffect } from "react"
import { auth, db } from "./firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection } from "firebase/firestore"

const ADMIN_EMAIL = "admin@smurfitwestrock.co"
const FECHA_LIMITE = new Date("2026-06-11T14:00:00-05:00")
const torneoFinalizado = () => new Date() > FECHA_LIMITE

const GRUPOS = {
  A: [
    { id: "A1", local: "México", visitante: "Sudáfrica", fecha: "11 jun 2026", estadio: "Estadio Ciudad de México", flagLocal: "mx", flagVisitante: "za" },
    { id: "A2", local: "Corea del Sur", visitante: "Chequia", fecha: "11 jun 2026", estadio: "Estadio Guadalajara", flagLocal: "kr", flagVisitante: "cz" },
    { id: "A3", local: "México", visitante: "Corea del Sur", fecha: "15 jun 2026", estadio: "Estadio Guadalajara", flagLocal: "mx", flagVisitante: "kr" },
    { id: "A4", local: "Chequia", visitante: "Sudáfrica", fecha: "15 jun 2026", estadio: "Estadio Ciudad de México", flagLocal: "cz", flagVisitante: "za" },
    { id: "A5", local: "Chequia", visitante: "México", fecha: "19 jun 2026", estadio: "Estadio Ciudad de México", flagLocal: "cz", flagVisitante: "mx" },
    { id: "A6", local: "Sudáfrica", visitante: "Corea del Sur", fecha: "19 jun 2026", estadio: "Estadio Guadalajara", flagLocal: "za", flagVisitante: "kr" },
  ],
  B: [
    { id: "B1", local: "Canadá", visitante: "Bosnia", fecha: "12 jun 2026", estadio: "Estadio Toronto", flagLocal: "ca", flagVisitante: "ba" },
    { id: "B2", local: "Catar", visitante: "Suiza", fecha: "12 jun 2026", estadio: "Estadio Nueva York", flagLocal: "qa", flagVisitante: "ch" },
    { id: "B3", local: "Canadá", visitante: "Catar", fecha: "16 jun 2026", estadio: "Estadio Toronto", flagLocal: "ca", flagVisitante: "qa" },
    { id: "B4", local: "Suiza", visitante: "Bosnia", fecha: "16 jun 2026", estadio: "Estadio Nueva York", flagLocal: "ch", flagVisitante: "ba" },
    { id: "B5", local: "Suiza", visitante: "Canadá", fecha: "20 jun 2026", estadio: "Estadio Nueva York", flagLocal: "ch", flagVisitante: "ca" },
    { id: "B6", local: "Bosnia", visitante: "Catar", fecha: "20 jun 2026", estadio: "Estadio Toronto", flagLocal: "ba", flagVisitante: "qa" },
  ],
  C: [
    { id: "C1", local: "Brasil", visitante: "Marruecos", fecha: "13 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "br", flagVisitante: "ma" },
    { id: "C2", local: "Haití", visitante: "Escocia", fecha: "13 jun 2026", estadio: "Estadio San Francisco", flagLocal: "ht", flagVisitante: "gb-sct" },
    { id: "C3", local: "Brasil", visitante: "Haití", fecha: "17 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "br", flagVisitante: "ht" },
    { id: "C4", local: "Escocia", visitante: "Marruecos", fecha: "17 jun 2026", estadio: "Estadio San Francisco", flagLocal: "gb-sct", flagVisitante: "ma" },
    { id: "C5", local: "Escocia", visitante: "Brasil", fecha: "21 jun 2026", estadio: "Estadio San Francisco", flagLocal: "gb-sct", flagVisitante: "br" },
    { id: "C6", local: "Marruecos", visitante: "Haití", fecha: "21 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "ma", flagVisitante: "ht" },
  ],
  D: [
    { id: "D1", local: "USA", visitante: "Paraguay", fecha: "12 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "us", flagVisitante: "py" },
    { id: "D2", local: "Australia", visitante: "Turquía", fecha: "12 jun 2026", estadio: "Estadio Dallas", flagLocal: "au", flagVisitante: "tr" },
    { id: "D3", local: "USA", visitante: "Australia", fecha: "16 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "us", flagVisitante: "au" },
    { id: "D4", local: "Turquía", visitante: "Paraguay", fecha: "16 jun 2026", estadio: "Estadio Dallas", flagLocal: "tr", flagVisitante: "py" },
    { id: "D5", local: "Turquía", visitante: "USA", fecha: "20 jun 2026", estadio: "Estadio Dallas", flagLocal: "tr", flagVisitante: "us" },
    { id: "D6", local: "Paraguay", visitante: "Australia", fecha: "20 jun 2026", estadio: "Estadio Los Ángeles", flagLocal: "py", flagVisitante: "au" },
  ],
  E: [
    { id: "E1", local: "Alemania", visitante: "Curaçao", fecha: "13 jun 2026", estadio: "Estadio Filadelfia", flagLocal: "de", flagVisitante: "cw" },
    { id: "E2", local: "Costa de Marfil", visitante: "Ecuador", fecha: "13 jun 2026", estadio: "Estadio Boston", flagLocal: "ci", flagVisitante: "ec" },
    { id: "E3", local: "Alemania", visitante: "Costa de Marfil", fecha: "17 jun 2026", estadio: "Estadio Filadelfia", flagLocal: "de", flagVisitante: "ci" },
    { id: "E4", local: "Ecuador", visitante: "Curaçao", fecha: "17 jun 2026", estadio: "Estadio Boston", flagLocal: "ec", flagVisitante: "cw" },
    { id: "E5", local: "Ecuador", visitante: "Alemania", fecha: "21 jun 2026", estadio: "Estadio Boston", flagLocal: "ec", flagVisitante: "de" },
    { id: "E6", local: "Curaçao", visitante: "Costa de Marfil", fecha: "21 jun 2026", estadio: "Estadio Filadelfia", flagLocal: "cw", flagVisitante: "ci" },
  ],
  F: [
    { id: "F1", local: "Países Bajos", visitante: "Japón", fecha: "14 jun 2026", estadio: "Estadio Seattle", flagLocal: "nl", flagVisitante: "jp" },
    { id: "F2", local: "Suecia", visitante: "Túnez", fecha: "14 jun 2026", estadio: "Estadio Vancouver", flagLocal: "se", flagVisitante: "tn" },
    { id: "F3", local: "Países Bajos", visitante: "Suecia", fecha: "18 jun 2026", estadio: "Estadio Seattle", flagLocal: "nl", flagVisitante: "se" },
    { id: "F4", local: "Túnez", visitante: "Japón", fecha: "18 jun 2026", estadio: "Estadio Vancouver", flagLocal: "tn", flagVisitante: "jp" },
    { id: "F5", local: "Túnez", visitante: "Países Bajos", fecha: "22 jun 2026", estadio: "Estadio Vancouver", flagLocal: "tn", flagVisitante: "nl" },
    { id: "F6", local: "Japón", visitante: "Suecia", fecha: "22 jun 2026", estadio: "Estadio Seattle", flagLocal: "jp", flagVisitante: "se" },
  ],
  G: [
    { id: "G1", local: "Bélgica", visitante: "Egipto", fecha: "14 jun 2026", estadio: "Estadio Atlanta", flagLocal: "be", flagVisitante: "eg" },
    { id: "G2", local: "Irán", visitante: "Nueva Zelanda", fecha: "14 jun 2026", estadio: "Estadio Miami", flagLocal: "ir", flagVisitante: "nz" },
    { id: "G3", local: "Bélgica", visitante: "Irán", fecha: "18 jun 2026", estadio: "Estadio Atlanta", flagLocal: "be", flagVisitante: "ir" },
    { id: "G4", local: "Nueva Zelanda", visitante: "Egipto", fecha: "18 jun 2026", estadio: "Estadio Miami", flagLocal: "nz", flagVisitante: "eg" },
    { id: "G5", local: "Nueva Zelanda", visitante: "Bélgica", fecha: "22 jun 2026", estadio: "Estadio Miami", flagLocal: "nz", flagVisitante: "be" },
    { id: "G6", local: "Egipto", visitante: "Irán", fecha: "22 jun 2026", estadio: "Estadio Atlanta", flagLocal: "eg", flagVisitante: "ir" },
  ],
  H: [
    { id: "H1", local: "España", visitante: "Cabo Verde", fecha: "15 jun 2026", estadio: "Estadio Houston", flagLocal: "es", flagVisitante: "cv" },
    { id: "H2", local: "Arabia Saudí", visitante: "Uruguay", fecha: "15 jun 2026", estadio: "Estadio Dallas", flagLocal: "sa", flagVisitante: "uy" },
    { id: "H3", local: "España", visitante: "Arabia Saudí", fecha: "19 jun 2026", estadio: "Estadio Houston", flagLocal: "es", flagVisitante: "sa" },
    { id: "H4", local: "Uruguay", visitante: "Cabo Verde", fecha: "19 jun 2026", estadio: "Estadio Dallas", flagLocal: "uy", flagVisitante: "cv" },
    { id: "H5", local: "Uruguay", visitante: "España", fecha: "23 jun 2026", estadio: "Estadio Dallas", flagLocal: "uy", flagVisitante: "es" },
    { id: "H6", local: "Cabo Verde", visitante: "Arabia Saudí", fecha: "23 jun 2026", estadio: "Estadio Houston", flagLocal: "cv", flagVisitante: "sa" },
  ],
  I: [
    { id: "I1", local: "Francia", visitante: "Senegal", fecha: "15 jun 2026", estadio: "Estadio Nueva York", flagLocal: "fr", flagVisitante: "sn" },
    { id: "I2", local: "Irak", visitante: "Noruega", fecha: "15 jun 2026", estadio: "Estadio Boston", flagLocal: "iq", flagVisitante: "no" },
    { id: "I3", local: "Francia", visitante: "Irak", fecha: "19 jun 2026", estadio: "Estadio Nueva York", flagLocal: "fr", flagVisitante: "iq" },
    { id: "I4", local: "Noruega", visitante: "Senegal", fecha: "19 jun 2026", estadio: "Estadio Boston", flagLocal: "no", flagVisitante: "sn" },
    { id: "I5", local: "Noruega", visitante: "Francia", fecha: "23 jun 2026", estadio: "Estadio Boston", flagLocal: "no", flagVisitante: "fr" },
    { id: "I6", local: "Senegal", visitante: "Irak", fecha: "23 jun 2026", estadio: "Estadio Nueva York", flagLocal: "sn", flagVisitante: "iq" },
  ],
  J: [
    { id: "J1", local: "Argentina", visitante: "Argelia", fecha: "16 jun 2026", estadio: "Estadio Dallas", flagLocal: "ar", flagVisitante: "dz" },
    { id: "J2", local: "Austria", visitante: "Jordania", fecha: "16 jun 2026", estadio: "Estadio Miami", flagLocal: "at", flagVisitante: "jo" },
    { id: "J3", local: "Argentina", visitante: "Austria", fecha: "20 jun 2026", estadio: "Estadio Dallas", flagLocal: "ar", flagVisitante: "at" },
    { id: "J4", local: "Jordania", visitante: "Argelia", fecha: "20 jun 2026", estadio: "Estadio Miami", flagLocal: "jo", flagVisitante: "dz" },
    { id: "J5", local: "Jordania", visitante: "Argentina", fecha: "24 jun 2026", estadio: "Estadio Miami", flagLocal: "jo", flagVisitante: "ar" },
    { id: "J6", local: "Argelia", visitante: "Austria", fecha: "24 jun 2026", estadio: "Estadio Dallas", flagLocal: "dz", flagVisitante: "at" },
  ],
  K: [
    { id: "K1", local: "Portugal", visitante: "DR Congo", fecha: "16 jun 2026", estadio: "Estadio Kansas City", flagLocal: "pt", flagVisitante: "cd" },
    { id: "K2", local: "Uzbekistán", visitante: "Colombia", fecha: "16 jun 2026", estadio: "Estadio Seattle", flagLocal: "uz", flagVisitante: "co" },
    { id: "K3", local: "Portugal", visitante: "Uzbekistán", fecha: "20 jun 2026", estadio: "Estadio Kansas City", flagLocal: "pt", flagVisitante: "uz" },
    { id: "K4", local: "Colombia", visitante: "DR Congo", fecha: "20 jun 2026", estadio: "Estadio Seattle", flagLocal: "co", flagVisitante: "cd" },
    { id: "K5", local: "Colombia", visitante: "Portugal", fecha: "24 jun 2026", estadio: "Estadio Seattle", flagLocal: "co", flagVisitante: "pt" },
    { id: "K6", local: "DR Congo", visitante: "Uzbekistán", fecha: "24 jun 2026", estadio: "Estadio Kansas City", flagLocal: "cd", flagVisitante: "uz" },
  ],
  L: [
    { id: "L1", local: "Inglaterra", visitante: "Croacia", fecha: "17 jun 2026", estadio: "Estadio Chicago", flagLocal: "gb-eng", flagVisitante: "hr" },
    { id: "L2", local: "Ghana", visitante: "Panamá", fecha: "17 jun 2026", estadio: "Estadio Monterrey", flagLocal: "gh", flagVisitante: "pa" },
    { id: "L3", local: "Inglaterra", visitante: "Ghana", fecha: "21 jun 2026", estadio: "Estadio Chicago", flagLocal: "gb-eng", flagVisitante: "gh" },
    { id: "L4", local: "Panamá", visitante: "Croacia", fecha: "21 jun 2026", estadio: "Estadio Monterrey", flagLocal: "pa", flagVisitante: "hr" },
    { id: "L5", local: "Panamá", visitante: "Inglaterra", fecha: "25 jun 2026", estadio: "Estadio Monterrey", flagLocal: "pa", flagVisitante: "gb-eng" },
    { id: "L6", local: "Croacia", visitante: "Ghana", fecha: "25 jun 2026", estadio: "Estadio Chicago", flagLocal: "hr", flagVisitante: "gh" },
  ],
}

const TODOS_PARTIDOS = Object.values(GRUPOS).flat()

export default function App() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [usuario, setUsuario] = useState(null)
  const [pronosticos, setPronosticos] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [fechaEnvio, setFechaEnvio] = useState(null)
  const [tab, setTab] = useState("pronosticos")
  const [grupoActivo, setGrupoActivo] = useState("A")
  const [tabla, setTabla] = useState([])
  const [resultados, setResultados] = useState({})
  const [usuariosAdmin, setUsuariosAdmin] = useState([])
  const [grupoAdminActivo, setGrupoAdminActivo] = useState("A")
  const [adminTab, setAdminTab] = useState("resultados")
  const [ahora, setAhora] = useState(new Date())
  const [detalleData, setDetalleData] = useState({})
  const [modalUsuario, setModalUsuario] = useState(null)
  const [modalGrupo, setModalGrupo] = useState("A")
  const [perfilData, setPerfilData] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const getNombre = (email) => {
    const u = email?.split("@")[0] || ""
    return u.split(".").slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ")
  }

  const isAdmin = usuario?.email === ADMIN_EMAIL

  const handleLogin = async () => {
    setError("")
    if (!email.endsWith("@smurfitwestrock.co")) {
      setError("Solo se permiten correos @smurfitwestrock.co")
      return
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setUsuario(cred.user)
      await cargarPronosticos(cred.user.uid)
      await cargarResultados()
      if (cred.user.email === ADMIN_EMAIL) setTab("admin")
    } catch (e) {
      setError("Correo o contraseña incorrectos")
    }
  }

  const handleRegistro = async () => {
    setError("")
    if (!email.endsWith("@smurfitwestrock.co")) {
      setError("Solo se permiten correos @smurfitwestrock.co")
      return
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      setUsuario(cred.user)
    } catch (e) {
      setError("Error al registrarse. El correo ya puede estar en uso.")
    }
  }

  const cargarPronosticos = async (uid) => {
    const snap = await getDoc(doc(db, "pronosticos", uid))
    if (snap.exists()) {
      setPronosticos(snap.data().picks || {})
      setEnviado(snap.data().enviado || false)
      setFechaEnvio(snap.data().fechaEnvio || null)
    }
  }

  const cargarResultados = async () => {
    const snap = await getDoc(doc(db, "resultados", "oficial"))
    if (snap.exists()) setResultados(snap.data().picks || {})
  }

  const cargarTabla = async () => {
    const resSnap = await getDoc(doc(db, "resultados", "oficial"))
    const resOficial = resSnap.exists() ? resSnap.data().picks || {} : {}
    const snap = await getDocs(collection(db, "pronosticos"))
    const filas = []
    snap.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return
      const picks = data.picks || {}
      let puntos = 0
      TODOS_PARTIDOS.forEach(p => {
        if (picks[p.id] && resOficial[p.id] && picks[p.id] === resOficial[p.id]) puntos++
      })
      filas.push({ uid: d.id, email: data.email, nombre: getNombre(data.email), puntos, enviado: data.enviado, picks })
    })
    filas.sort((a, b) => b.puntos - a.puntos)
    setTabla(filas)
  }

  const cargarPerfil = async () => {
    const resSnap = await getDoc(doc(db, "resultados", "oficial"))
    const resOficial = resSnap.exists() ? resSnap.data().picks || {} : {}
    const tablaSnap = await getDocs(collection(db, "pronosticos"))
    const filas = []
    tablaSnap.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return
      const picks = data.picks || {}
      let puntos = 0
      TODOS_PARTIDOS.forEach(p => {
        if (picks[p.id] && resOficial[p.id] && picks[p.id] === resOficial[p.id]) puntos++
      })
      filas.push({ uid: d.id, puntos })
    })
    filas.sort((a, b) => b.puntos - a.puntos)
    const posicion = filas.findIndex(f => f.uid === usuario.uid) + 1
    const partidosConResultado = TODOS_PARTIDOS.filter(p => resOficial[p.id])
    let aciertos = 0
    partidosConResultado.forEach(p => {
      if (pronosticos[p.id] && pronosticos[p.id] === resOficial[p.id]) aciertos++
    })
    const efectividad = partidosConResultado.length > 0 ? Math.round((aciertos / partidosConResultado.length) * 100) : null
    setPerfilData({ aciertos, efectividad, posicion: posicion || null, total: filas.length, partidosConResultado: partidosConResultado.length })
  }

  const cargarUsuariosAdmin = async () => {
    const snap = await getDocs(collection(db, "pronosticos"))
    const lista = []
    snap.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return
      lista.push({ uid: d.id, email: data.email, nombre: getNombre(data.email), enviado: data.enviado })
    })
    setUsuariosAdmin(lista)
  }

  const seleccionar = (partidoId, opcion) => {
    if (enviado || torneoFinalizado()) return
    setPronosticos(prev => ({ ...prev, [partidoId]: opcion }))
  }

  const enviarPronosticos = async () => {
    const total = TODOS_PARTIDOS.length
    if (Object.keys(pronosticos).length < total) {
      setMensaje(`⚠️ Debes pronosticar todos los partidos (${Object.keys(pronosticos).length}/${total}) antes de enviar.`)
      return
    }
    try {
      const fecha = new Date().toISOString()
      await setDoc(doc(db, "pronosticos", usuario.uid), {
        email: usuario.email, picks: pronosticos, enviado: true, fechaEnvio: fecha
      })
      setEnviado(true)
      setFechaEnvio(fecha)
      setMensaje("✅ ¡Pronósticos guardados! Ya no puedes modificarlos.")
    } catch (e) {
      setMensaje("Error al guardar. Intenta de nuevo.")
    }
  }

  const limpiarMisPronosticos = async () => {
    if (!window.confirm("¿Seguro que quieres limpiar tus pronósticos? Podrás volver a elegir.")) return
    try {
      await deleteDoc(doc(db, "pronosticos", usuario.uid))
      setPronosticos({})
      setEnviado(false)
      setFechaEnvio(null)
      setMensaje("🗑️ Pronósticos eliminados. Puedes volver a elegir.")
    } catch (e) {
      setMensaje("Error al limpiar pronósticos.")
    }
  }

  const borrarPronosticosUsuario = async (uid, nombre) => {
    if (!window.confirm(`¿Seguro que quieres borrar los pronósticos de ${nombre}?`)) return
    try {
      await deleteDoc(doc(db, "pronosticos", uid))
      setMensaje(`🗑️ Pronósticos de ${nombre} eliminados.`)
      await cargarUsuariosAdmin()
    } catch (e) {
      setMensaje("Error al borrar.")
    }
  }

  const guardarResultados = async () => {
    try {
      await setDoc(doc(db, "resultados", "oficial"), {
        picks: resultados, fechaActualizacion: new Date().toISOString()
      })
      setMensaje("✅ Resultados guardados correctamente.")
    } catch (e) {
      setMensaje("Error al guardar resultados.")
    }
  }

  const handleLogout = () => {
    signOut(auth)
    setUsuario(null)
    setEmail("")
    setPassword("")
    setPronosticos({})
    setEnviado(false)
    setFechaEnvio(null)
    setMensaje("")
    setTab("pronosticos")
    setTabla([])
    setModalUsuario(null)
    setPerfilData(null)
  }

  const cambiarTab = async (t) => {
    setTab(t)
    setMensaje("")
    if (t === "tabla") await cargarTabla()
    if (t === "perfil") await cargarPerfil()
    if (t === "admin") { await cargarResultados(); await cargarUsuariosAdmin() }
  }

  const abrirModal = async (fila) => {
    const resSnap = await getDoc(doc(db, "resultados", "oficial"))
    const resOficial = resSnap.exists() ? resSnap.data().picks || {} : {}
    setDetalleData(resOficial)
    setModalUsuario(fila)
    setModalGrupo("A")
  }

  const getLabelOpcion = (opcion, partido) => {
    if (opcion === "local") return `GANA ${partido.local.toUpperCase()}`
    if (opcion === "visitante") return `GANA ${partido.visitante.toUpperCase()}`
    if (opcion === "empate") return "EMPATE"
    return "—"
  }

  const formatFecha = (iso) => {
    if (!iso) return "—"
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  }

  const progreso = Object.keys(pronosticos).length
  const total = TODOS_PARTIDOS.length

  const contadorTexto = () => {
    const diff = FECHA_LIMITE - ahora
    if (diff <= 0) return "¡CERRADO!"
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${d}d ${h}h ${m}m ${s}s`
  }

  const renderPartidos = (grupo, esAdmin = false) => (
    GRUPOS[grupo].map(partido => (
      <div key={partido.id} className={esAdmin ? "admin-card" : "partido-card"}>
        <p className="partido-fecha">📅 {partido.fecha} · {partido.estadio}</p>
        <div className="partido-equipos">
          <div className="equipo">
            <img src={`https://flagcdn.com/w80/${partido.flagLocal}.png`} alt={partido.local} style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066" }} />
            <span className="equipo-nombre">{partido.local}</span>
          </div>
          <span className="vs">VS</span>
          <div className="equipo">
            <img src={`https://flagcdn.com/w80/${partido.flagVisitante}.png`} alt={partido.visitante} style={{ width: "80px", borderRadius: "6px", boxShadow: "0 2px 8px #00000066" }} />
            <span className="equipo-nombre">{partido.visitante}</span>
          </div>
        </div>
        {esAdmin ? (
          <div className="resultado-opciones">
            <button className={`btn-resultado ${resultados[partido.id] === "local" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "local" }))}>GANA {partido.local.toUpperCase()}</button>
            <button className={`btn-resultado ${resultados[partido.id] === "empate" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "empate" }))}>EMPATE</button>
            <button className={`btn-resultado ${resultados[partido.id] === "visitante" ? "sel" : ""}`} onClick={() => setResultados(p => ({ ...p, [partido.id]: "visitante" }))}>GANA {partido.visitante.toUpperCase()}</button>
          </div>
        ) : (
          <div className="opciones">
            <button className={`btn-opcion ${pronosticos[partido.id] === "local" ? "seleccionado" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "local")}>GANA {partido.local.toUpperCase()}</button>
            <button className={`btn-opcion empate ${pronosticos[partido.id] === "empate" ? "empate-sel" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "empate")}>EMPATE</button>
            <button className={`btn-opcion ${pronosticos[partido.id] === "visitante" ? "seleccionado" : ""} ${enviado || torneoFinalizado() ? "bloqueado" : ""}`} onClick={() => seleccionar(partido.id, "visitante")}>GANA {partido.visitante.toUpperCase()}</button>
          </div>
        )}
      </div>
    ))
  )

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    .header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: linear-gradient(90deg, #1e2d3d, #17212B); border-bottom: 1px solid #39ff6a33; padding: 18px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header-titulo { color: #39ff6a; font-weight: 900; font-size: 1.2rem; letter-spacing: 1.5px; text-shadow: 0 0 10px #39ff6a66; }
    .header-user { color: #ffffff88; font-size: 0.9rem; }
    .btn-logout { background: transparent; border: 1px solid #39ff6a66; color: #39ff6a; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; transition: all 0.3s; }
    .btn-logout:hover { background: #39ff6a22; box-shadow: 0 0 10px #39ff6a44; }
    .tabs { position: fixed; top: 77px; left: 0; right: 0; z-index: 99; background: #1a2733; border-bottom: 1px solid #39ff6a22; display: flex; gap: 4px; padding: 0 40px; }
    .tab { padding: 14px 24px; background: transparent; border: none; border-bottom: 3px solid transparent; color: #ffffff55; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.25s; }
    .tab:hover { color: #ffffff99; }
    .tab.activo { color: #39ff6a; border-bottom-color: #39ff6a; }
    .tab.admin-tab { color: #ffd70088; }
    .tab.admin-tab:hover { color: #ffd700; }
    .tab.admin-tab.activo { color: #ffd700; border-bottom-color: #ffd700; }
    .grupos-tabs { position: fixed; top: 125px; left: 0; right: 0; z-index: 98; background: #1a2733; border-bottom: 1px solid #39ff6a11; display: flex; gap: 0; padding: 0 40px; overflow-x: auto; justify-content: center; }
    .grupo-tab { padding: 12px 22px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #ffffff33; font-size: 0.82rem; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
    .grupo-tab:hover { color: #ffffff77; }
    .grupo-tab.activo { color: #39ff6a; border-bottom-color: #39ff6a; }
    .grupo-tab.admin-grupo.activo { color: #ffd700; border-bottom-color: #ffd700; }
    .grupo-tab.admin-grupo { color: #ffd70033; }
    .grupo-tab.admin-grupo:hover { color: #ffd70077; }
    .grupo-titulo { color: #39ff6a; font-size: 1rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
    .partido-card { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #39ff6a22; border-radius: 14px; padding: 28px 40px 22px; margin-bottom: 16px; transition: box-shadow 0.3s; }
    .partido-card:hover { box-shadow: 0 0 20px #39ff6a18; }
    .partido-fecha { color: #ffffff55; font-size: 0.78rem; text-align: center; margin-bottom: 16px; letter-spacing: 1px; }
    .partido-equipos { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 20px; }
    .equipo { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .equipo-nombre { color: white; font-weight: 700; font-size: 1.1rem; text-align: center; }
    .vs { color: #ffffff44; font-size: 1.1rem; font-weight: 900; }
    .opciones { display: flex; gap: 10px; justify-content: center; }
    .btn-opcion { flex: 1; padding: 10px 8px; border-radius: 8px; border: 1.5px solid #39ff6a44; background: transparent; color: #ffffff88; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: all 0.25s; max-width: 160px; }
    .btn-opcion:hover:not(.bloqueado) { border-color: #39ff6a; color: white; box-shadow: 0 0 10px #39ff6a44; }
    .btn-opcion.seleccionado { background: #39ff6a22; border-color: #39ff6a; color: #39ff6a; box-shadow: 0 0 12px #39ff6a55; }
    .btn-opcion.empate:hover:not(.bloqueado) { border-color: #ffd700; color: #ffd700; box-shadow: 0 0 10px #ffd70044; }
    .btn-opcion.empate-sel { background: #ffd70022; border-color: #ffd700; color: #ffd700; box-shadow: 0 0 12px #ffd70055; }
    .btn-opcion.bloqueado { cursor: not-allowed; opacity: 0.7; }
    .btn-enviar { display: block; margin: 30px auto 0; padding: 16px 50px; background: #39ff6a; color: #17212B; border: none; border-radius: 10px; font-size: 1rem; font-weight: 900; letter-spacing: 2px; cursor: pointer; transition: box-shadow 0.3s, transform 0.2s; }
    .btn-enviar:hover { box-shadow: 0 0 24px #39ff6aaa; transform: translateY(-2px); }
    .btn-limpiar { display: block; margin: 14px auto 0; padding: 10px 30px; background: transparent; color: #ff6b6b; border: 1.5px solid #ff6b6b66; border-radius: 8px; font-size: 0.82rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; }
    .btn-limpiar:hover { background: #ff6b6b22; box-shadow: 0 0 10px #ff6b6b44; }
    .progreso-bar { background: #1a2733; border-radius: 20px; height: 6px; margin-bottom: 24px; overflow: hidden; }
    .progreso-fill { height: 100%; border-radius: 20px; background: #39ff6a; box-shadow: 0 0 8px #39ff6a88; transition: width 0.4s ease; }
    .progreso-texto { color: #ffffff55; font-size: 0.8rem; text-align: right; margin-bottom: 6px; }
    .contador-box { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #39ff6a22; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla th { color: #39ff6a; font-size: 0.8rem; letter-spacing: 2px; padding: 12px 16px; text-align: left; border-bottom: 1px solid #39ff6a33; }
    .tabla td { padding: 14px 16px; border-bottom: 1px solid #ffffff11; color: white; font-size: 0.95rem; }
    .tabla tr:hover td { background: #39ff6a0a; }
    .posicion-1 td { color: #ffd700; }
    .posicion-2 td { color: #c0c0c0; }
    .posicion-3 td { color: #cd7f32; }
    .badge-puntos { background: #39ff6a22; color: #39ff6a; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; }
    .btn-detalle { background: transparent; border: 1.5px solid #39ff6a44; color: #39ff6a; padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .btn-detalle:hover { background: #39ff6a22; box-shadow: 0 0 8px #39ff6a44; }
    .perfil-card { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #39ff6a33; border-radius: 16px; padding: 36px 40px; margin-bottom: 24px; }
    .perfil-nombre { color: #39ff6a; font-size: 2rem; font-weight: 900; letter-spacing: 1px; margin-bottom: 6px; text-shadow: 0 0 12px #39ff6a55; }
    .perfil-email { color: #ffffff44; font-size: 0.85rem; margin-bottom: 28px; }
    .perfil-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: #17212B; border: 1px solid #39ff6a22; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-valor { color: #39ff6a; font-size: 2.2rem; font-weight: 900; text-shadow: 0 0 10px #39ff6a44; }
    .stat-label { color: #ffffff44; font-size: 0.75rem; font-weight: 700; letter-spacing: 1.5px; margin-top: 6px; text-transform: uppercase; }
    .perfil-estado { display: flex; justify-content: space-between; align-items: center; background: #17212B; border: 1px solid #ffffff11; border-radius: 10px; padding: 14px 20px; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #00000088; z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #1e2d3d; border: 1px solid #39ff6a33; border-radius: 16px; width: 100%; max-width: 700px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 0 60px #00000088; }
    .modal-header { padding: 20px 28px; border-bottom: 1px solid #39ff6a22; display: flex; justify-content: space-between; align-items: center; }
    .modal-titulo { color: #39ff6a; font-weight: 900; font-size: 1rem; letter-spacing: 1px; }
    .modal-cerrar { background: transparent; border: 1px solid #ffffff22; color: #ffffff88; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
    .modal-cerrar:hover { background: #ff6b6b22; border-color: #ff6b6b; color: #ff6b6b; }
    .modal-grupos { display: flex; padding: 0 28px; border-bottom: 1px solid #ffffff11; overflow-x: auto; }
    .modal-grupo-tab { padding: 12px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #ffffff33; font-size: 0.78rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
    .modal-grupo-tab:hover { color: #ffffff77; }
    .modal-grupo-tab.activo { color: #39ff6a; border-bottom-color: #39ff6a; }
    .modal-body { padding: 20px 28px; overflow-y: auto; }
    .modal-partido { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #ffffff0a; gap: 10px; }
    .modal-partido:last-child { border-bottom: none; }
    .modal-partido-nombre { color: #ffffff88; font-size: 0.85rem; flex: 1; }
    .modal-partido-pick { font-weight: 700; font-size: 0.85rem; flex: 1; text-align: center; }
    .modal-partido-resultado { font-size: 1rem; width: 30px; text-align: right; }
    .admin-card { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #ffd70022; border-radius: 14px; padding: 28px 40px 22px; margin-bottom: 16px; }
    .admin-titulo { color: #ffd700; font-size: 1rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
    .resultado-opciones { display: flex; gap: 10px; justify-content: center; }
    .btn-resultado { flex: 1; padding: 10px 8px; border-radius: 8px; border: 1.5px solid #ffd70044; background: transparent; color: #ffffff88; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: all 0.25s; max-width: 160px; }
    .btn-resultado:hover { border-color: #ffd700; color: #ffd700; box-shadow: 0 0 10px #ffd70044; }
    .btn-resultado.sel { background: #ffd70022; border-color: #ffd700; color: #ffd700; box-shadow: 0 0 12px #ffd70055; }
    .btn-guardar { display: block; margin: 30px auto 0; padding: 16px 50px; background: #ffd700; color: #17212B; border: none; border-radius: 10px; font-size: 1rem; font-weight: 900; letter-spacing: 2px; cursor: pointer; transition: box-shadow 0.3s, transform 0.2s; }
    .btn-guardar:hover { box-shadow: 0 0 24px #ffd700aa; transform: translateY(-2px); }
    .usuarios-tabla { width: 100%; border-collapse: collapse; }
    .usuarios-tabla th { color: #ffd700; font-size: 0.8rem; letter-spacing: 2px; padding: 12px 16px; text-align: left; border-bottom: 1px solid #ffd70033; }
    .usuarios-tabla td { padding: 14px 16px; border-bottom: 1px solid #ffffff11; color: white; font-size: 0.9rem; }
    .btn-borrar { background: transparent; border: 1.5px solid #ff6b6b66; color: #ff6b6b; padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .btn-borrar:hover { background: #ff6b6b22; box-shadow: 0 0 8px #ff6b6b44; }
    .msg-enviado { color: #39ff6a; text-align: center; margin-top: 20px; font-weight: 700; font-size: 0.95rem; }
    .msg-warning { color: #ffd700; text-align: center; margin-top: 16px; font-size: 0.88rem; }
  `

  if (!usuario) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        .login-card { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #39ff6a33; border-radius: 16px; padding: 50px; width: 460px; box-shadow: 0 0 40px #39ff6a1a; }
        .titulo { color: #39ff6a; font-size: 1.6rem; font-weight: 900; text-align: center; letter-spacing: 1.5px; margin-bottom: 40px; text-shadow: 0 0 12px #39ff6a88; line-height: 1.3; }
        .label { color: white; font-weight: 700; font-size: 0.8rem; letter-spacing: 2px; display: block; margin-bottom: 8px; }
        .input-field { width: 100%; padding: 12px 16px; margin-bottom: 24px; background-color: #111c25; border: 2px solid #39ff6a66; border-radius: 8px; color: white; font-size: 1rem; outline: none; transition: border-color 0.3s, box-shadow 0.3s; }
        .input-field::placeholder { color: #ffffff33; }
        .input-field:hover, .input-field:focus { border-color: #39ff6a; box-shadow: 0 0 10px #39ff6a55; }
        .btn { font-weight: 700; font-size: 0.85rem; letter-spacing: 1.5px; padding: 13px 28px; border: none; border-radius: 8px; cursor: pointer; background-color: #39ff6a; color: #17212B; transition: box-shadow 0.3s, transform 0.2s; }
        .btn:hover { box-shadow: 0 0 18px #39ff6aaa; transform: translateY(-2px); }
        .error { color: #ff6b6b; text-align: center; margin-bottom: 14px; font-size: 0.85rem; }
      `}</style>
      <div style={{ backgroundColor: "#17212B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="login-card">
          <h1 className="titulo">POLLA MUNDIALISTA ARUS 2026</h1>
          <label className="label">USUARIO</label>
          <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@smurfitwestrock.co" />
          <label className="label">CONTRASEÑA</label>
          <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" />
          {error && <p className="error">{error}</p>}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "10px" }}>
            <button className="btn" onClick={handleLogin}>INICIAR SESION</button>
            <button className="btn" onClick={handleRegistro}>REGISTRARSE</button>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ backgroundColor: "#17212B", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <div className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="logo" style={{ height: "40px" }} />
            <span className="header-titulo">POLLA MUNDIALISTA ARUS 2026</span>
          </div>
          <span className="header-user">Hola, {getNombre(usuario.email)} 👋</span>
          <button className="btn-logout" onClick={handleLogout}>CERRAR SESIÓN</button>
        </div>

        <div className="tabs">
          {!isAdmin && <button className={`tab ${tab === "pronosticos" ? "activo" : ""}`} onClick={() => cambiarTab("pronosticos")}>📋 MIS PRONÓSTICOS</button>}
          <button className={`tab ${tab === "tabla" ? "activo" : ""}`} onClick={() => cambiarTab("tabla")}>🏆 TABLA DE POSICIONES</button>
          {!isAdmin && <button className={`tab ${tab === "perfil" ? "activo" : ""}`} onClick={() => cambiarTab("perfil")}>👤 MI PERFIL</button>}
          {isAdmin && <button className={`tab admin-tab ${tab === "admin" ? "activo" : ""}`} onClick={() => cambiarTab("admin")}>⚙️ ADMIN</button>}
        </div>

        {(tab === "pronosticos" || tab === "admin") && (
          <div className="grupos-tabs">
            {Object.keys(GRUPOS).map(g => (
              <button key={g} className={`grupo-tab ${tab === "admin" ? "admin-grupo" : ""} ${(tab === "pronosticos" ? grupoActivo : grupoAdminActivo) === g ? "activo" : ""}`}
                onClick={() => { tab === "pronosticos" ? setGrupoActivo(g) : setGrupoAdminActivo(g); window.scrollTo({ top: 0, behavior: "smooth" }) }}>
                GRUPO {g}
              </button>
            ))}
          </div>
        )}

        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", marginTop: tab === "tabla" || tab === "perfil" ? "120px" : "170px", flex: 1 }}>

          {tab === "pronosticos" && (
            <>
              {!torneoFinalizado() && (
                <div className="contador-box">
                  <span style={{ color: "#ffffff66", fontSize: "0.85rem", fontWeight: "600" }}>⏰ TIEMPO PARA CERRAR PRONÓSTICOS</span>
                  <span style={{ color: "#39ff6a", fontWeight: "900", fontSize: "1.1rem", letterSpacing: "2px", textShadow: "0 0 10px #39ff6a66" }}>{contadorTexto()}</span>
                </div>
              )}
              <p className="grupo-titulo">⚽ Grupo {grupoActivo}</p>
              <p className="progreso-texto">{progreso}/{total} partidos pronosticados</p>
              <div className="progreso-bar"><div className="progreso-fill" style={{ width: `${(progreso / total) * 100}%` }} /></div>
              {renderPartidos(grupoActivo)}
              {mensaje && <p className={mensaje.startsWith("✅") || mensaje.startsWith("🗑️") ? "msg-enviado" : "msg-warning"}>{mensaje}</p>}
              {torneoFinalizado() ? (
                <p className="msg-warning" style={{ textAlign: "center", marginTop: "24px" }}>🔒 La fecha límite fue el 11 de junio a las 2:00pm. Ya no es posible modificar pronósticos.</p>
              ) : !enviado ? (
                <>
                  <button className="btn-enviar" onClick={enviarPronosticos}>ENVIAR PRONÓSTICOS ({progreso}/{total})</button>
                  {progreso > 0 && <button className="btn-limpiar" onClick={limpiarMisPronosticos}>🗑️ LIMPIAR MIS PRONÓSTICOS</button>}
                </>
              ) : (
                <p className="msg-enviado">🔒 Pronósticos enviados y bloqueados. ¡Buena suerte!</p>
              )}
            </>
          )}

          {tab === "tabla" && (
            <>
              <p className="grupo-titulo">🏆 Tabla de Posiciones</p>
              {tabla.length > 0 && (
                <div style={{ background: "linear-gradient(145deg, #1e2d3d, #17212B)", border: "1px solid #ffd70033", borderRadius: "14px", padding: "28px 40px", marginBottom: "28px", textAlign: "center", boxShadow: "0 0 30px #ffd70011" }}>
                  <p style={{ color: "#ffffff66", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "2px", marginBottom: "12px" }}>💰 PREMIO TOTAL DEL TORNEO</p>
                  <p style={{ color: "#ffd700", fontSize: "2.8rem", fontWeight: "900", letterSpacing: "2px", textShadow: "0 0 20px #ffd70088", marginBottom: "8px" }}>$ {(tabla.length * 10000).toLocaleString("es-CO")} COP</p>
                  <p style={{ color: "#ffffff44", fontSize: "0.85rem", marginBottom: "16px" }}>{tabla.length} participante{tabla.length !== 1 ? "s" : ""} × $10.000 COP</p>
                  <div style={{ background: "#ffd70011", border: "1px solid #ffd70033", borderRadius: "8px", padding: "10px 20px", display: "inline-block" }}>
                    <p style={{ color: "#ffd700", fontSize: "0.85rem", fontWeight: "700", letterSpacing: "1px" }}>🏆 El jugador con más aciertos se lleva todo</p>
                  </div>
                </div>
              )}
              {tabla.length === 0 ? (
                <p style={{ color: "#ffffff44", textAlign: "center", marginTop: "40px" }}>Aún no hay participantes registrados.</p>
              ) : (
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>#</th><th>PARTICIPANTE</th><th>PRONÓSTICOS</th><th>PUNTOS</th>
                      {torneoFinalizado() && <th>DETALLE</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((fila, i) => (
                      <tr key={fila.uid} className={i === 0 ? "posicion-1" : i === 1 ? "posicion-2" : i === 2 ? "posicion-3" : ""}>
                        <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                        <td>{fila.nombre}</td>
                        <td>{fila.enviado ? "✅ Enviados" : "⏳ Pendiente"}</td>
                        <td><span className="badge-puntos">{fila.puntos} pts</span></td>
                        {torneoFinalizado() && <td><button className="btn-detalle" onClick={() => abrirModal(fila)}>👁️ Ver</button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === "perfil" && !isAdmin && (
            <>
              <p className="grupo-titulo">👤 Mi Perfil</p>
              <div className="perfil-card">
                <p className="perfil-nombre">{getNombre(usuario.email)}</p>
                <p className="perfil-email">{usuario.email}</p>
                <div className="perfil-stats">
                  <div className="stat-card">
                    <p className="stat-valor">{perfilData ? perfilData.aciertos : "—"}</p>
                    <p className="stat-label">Aciertos</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-valor">{perfilData?.efectividad != null ? `${perfilData.efectividad}%` : "—"}</p>
                    <p className="stat-label">Efectividad</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-valor">{perfilData?.posicion ? `#${perfilData.posicion}` : "—"}</p>
                    <p className="stat-label">Posición</p>
                  </div>
                </div>
                <div className="perfil-estado">
                  <div>
                    <p style={{ color: "#ffffff66", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1.5px", marginBottom: "4px" }}>ESTADO</p>
                    <p style={{ color: "white", fontWeight: "700" }}>{enviado ? "✅ Pronósticos enviados" : "⏳ Pendiente de envío"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#ffffff66", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1.5px", marginBottom: "4px" }}>FECHA DE ENVÍO</p>
                    <p style={{ color: "white", fontWeight: "700" }}>{formatFecha(fechaEnvio)}</p>
                  </div>
                </div>
                {perfilData && (
                  <p style={{ color: "#ffffff33", fontSize: "0.75rem", textAlign: "center", marginTop: "16px" }}>
                    Basado en {perfilData.partidosConResultado} partido{perfilData.partidosConResultado !== 1 ? "s" : ""} con resultado oficial
                  </p>
                )}
              </div>
            </>
          )}

          {tab === "admin" && isAdmin && (
            <>
              <div style={{ display: "flex", gap: "0", marginBottom: "30px", borderBottom: "1px solid #ffd70022" }}>
                <button onClick={() => setAdminTab("resultados")} style={{ padding: "12px 28px", background: "transparent", border: "none", borderBottom: adminTab === "resultados" ? "2px solid #ffd700" : "2px solid transparent", color: adminTab === "resultados" ? "#ffd700" : "#ffffff44", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px", cursor: "pointer", transition: "all 0.25s" }}>📋 RESULTADOS</button>
                <button onClick={() => setAdminTab("usuarios")} style={{ padding: "12px 28px", background: "transparent", border: "none", borderBottom: adminTab === "usuarios" ? "2px solid #ffd700" : "2px solid transparent", color: adminTab === "usuarios" ? "#ffd700" : "#ffffff44", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px", cursor: "pointer", transition: "all 0.25s" }}>👥 USUARIOS</button>
              </div>
              {adminTab === "resultados" && (
                <>
                  <p className="admin-titulo">⚙️ Grupo {grupoAdminActivo} — Resultados Reales</p>
                  {renderPartidos(grupoAdminActivo, true)}
                  <button className="btn-guardar" onClick={guardarResultados}>GUARDAR RESULTADOS</button>
                  {mensaje && <p className={mensaje.startsWith("✅") || mensaje.startsWith("🗑️") ? "msg-enviado" : "msg-warning"}>{mensaje}</p>}
                </>
              )}
              {adminTab === "usuarios" && (
                <>
                  <p className="admin-titulo">👥 Gestión de Usuarios</p>
                  {usuariosAdmin.length === 0 ? (
                    <p style={{ color: "#ffffff44", textAlign: "center", marginTop: "40px" }}>No hay usuarios registrados aún.</p>
                  ) : (
                    <table className="usuarios-tabla">
                      <thead>
                        <tr><th>PARTICIPANTE</th><th>CORREO</th><th>ESTADO</th><th>LIMPIAR</th><th>ELIMINAR</th></tr>
                      </thead>
                      <tbody>
                        {usuariosAdmin.map(u => (
                          <tr key={u.uid}>
                            <td>{u.nombre}</td>
                            <td style={{ color: "#ffffff66", fontSize: "0.85rem" }}>{u.email}</td>
                            <td>{u.enviado ? "✅ Enviados" : "⏳ Pendiente"}</td>
                            <td><button className="btn-borrar" onClick={() => borrarPronosticosUsuario(u.uid, u.nombre)}>🗑️ Limpiar</button></td>
                            <td><button className="btn-borrar" style={{ borderColor: "#ff4444aa", color: "#ff4444" }} onClick={() => window.open(`https://console.firebase.google.com/project/polla-mundial-a7490/authentication/users`, "_blank")}>❌ Eliminar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {mensaje && <p className={mensaje.startsWith("✅") || mensaje.startsWith("🗑️") ? "msg-enviado" : "msg-warning"}>{mensaje}</p>}
                </>
              )}
            </>
          )}
        </div>

        {modalUsuario && torneoFinalizado() && (
          <div className="modal-overlay" onClick={() => setModalUsuario(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-titulo">👤 Pronósticos de {modalUsuario.nombre}</span>
                <button className="modal-cerrar" onClick={() => setModalUsuario(null)}>✕</button>
              </div>
              <div className="modal-grupos">
                {Object.keys(GRUPOS).map(g => (
                  <button key={g} className={`modal-grupo-tab ${modalGrupo === g ? "activo" : ""}`} onClick={() => setModalGrupo(g)}>GRUPO {g}</button>
                ))}
              </div>
              <div className="modal-body">
                {GRUPOS[modalGrupo].map(partido => {
                  const pick = modalUsuario.picks?.[partido.id]
                  const oficial = detalleData[partido.id]
                  const acerto = pick && oficial && pick === oficial
                  return (
                    <div key={partido.id} className="modal-partido">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <img src={`https://flagcdn.com/w20/${partido.flagLocal}.png`} alt="" style={{ borderRadius: "2px" }} />
                        <span className="modal-partido-nombre">{partido.local} vs {partido.visitante}</span>
                        <img src={`https://flagcdn.com/w20/${partido.flagVisitante}.png`} alt="" style={{ borderRadius: "2px" }} />
                      </div>
                      <span className="modal-partido-pick" style={{ color: pick ? "white" : "#ffffff33" }}>{pick ? getLabelOpcion(pick, partido) : "Sin pronóstico"}</span>
                      <span className="modal-partido-resultado">{!pick ? "—" : !oficial ? "⏳" : acerto ? "✅" : "❌"}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 200, background: "#39ff6a", color: "#17212B", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "1.2rem", cursor: "pointer", fontWeight: "900", boxShadow: "0 0 16px #39ff6a88", transition: "transform 0.2s, box-shadow 0.3s" }} onMouseEnter={e => e.target.style.transform = "translateY(-3px)"} onMouseLeave={e => e.target.style.transform = "translateY(0)"} title="Ir arriba">↑</button>

        <footer>
          <div style={{ background: "#1a2733", borderTop: "1px solid #39ff6a22", padding: "16px 40px", textAlign: "center", color: "#39ff6a", fontSize: "0.82rem", fontWeight: "700", letterSpacing: "1.5px" }}>© 2026 ARUS · TODOS LOS DERECHOS RESERVADOS</div>
          <div style={{ background: "#17212B", borderTop: "1px solid #ffffff11", padding: "12px 40px", textAlign: "center", color: "#ffffff44", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px" }}>DESARROLLADO POR ARUS EN CONJUNTO CON CLAUDE IA</div>
        </footer>

      </div>
    </>
  )
}