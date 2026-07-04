import { useState, useEffect, useCallback } from "react"
import { jsPDF } from 'jspdf'

import PartidoCard from "./components/PartidoCard"
import PartidoCardR32 from "./components/PartidoCardR32"
import PartidoCardR16 from "./components/PartidoCardR16"
import TickerBar from "./components/TickerBar"
import PARTIDOS_R32 from "./data/dieciseisavos"
import PARTIDOS_R16 from "./data/octavos"
import { auth, db } from "./firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection } from "firebase/firestore"

const ADMIN_EMAIL = "admin@smurfitwestrock.co"
const FECHA_LIMITE = new Date("2026-06-11T14:00:00-05:00")
const torneoFinalizado = () => new Date() > FECHA_LIMITE

const GRUPOS = {
  A: [
    { id: "A1", local: "México", visitante: "Sudáfrica", fecha: "11 jun 2026", hora: "2026-06-11T14:00:00", estadio: "Estadio Ciudad de México", flagLocal: "mx", flagVisitante: "za" },
    { id: "A2", local: "Corea del Sur", visitante: "Chequia", fecha: "11 jun 2026", hora: "2026-06-11T14:00:00", estadio: "Estadio Guadalajara", flagLocal: "kr", flagVisitante: "cz" },
    { id: "A3", local: "México", visitante: "Corea del Sur", fecha: "18 jun 2026", hora: "2026-06-18T22:00:00", estadio: "Estadio Guadalajara", flagLocal: "mx", flagVisitante: "kr" },
    { id: "A4", local: "Chequia", visitante: "Sudáfrica", fecha: "18 jun 2026", hora: "2026-06-18T11:00:00", estadio: "Estadio Atlanta", flagLocal: "cz", flagVisitante: "za" },
    { id: "A5", local: "Chequia", visitante: "México", fecha: "24 jun 2026", hora: "2026-06-24T20:00:00", estadio: "Estadio Ciudad de México", flagLocal: "cz", flagVisitante: "mx" },
    { id: "A6", local: "Sudáfrica", visitante: "Corea del Sur", fecha: "24 jun 2026", hora: "2026-06-24T20:00:00", estadio: "Estadio Monterrey", flagLocal: "za", flagVisitante: "kr" },
  ],
  B: [
    { id: "B1", local: "Canadá", visitante: "Bosnia", fecha: "12 jun 2026", hora: "2026-06-12T11:00:00", estadio: "Estadio Toronto", flagLocal: "ca", flagVisitante: "ba" },
    { id: "B2", local: "Catar", visitante: "Suiza", fecha: "12 jun 2026", hora: "2026-06-12T11:00:00", estadio: "Estadio Nueva York", flagLocal: "qa", flagVisitante: "ch" },
    { id: "B3", local: "Canadá", visitante: "Catar", fecha: "18 jun 2026", hora: "2026-06-18T17:00:00", estadio: "Estadio Toronto", flagLocal: "ca", flagVisitante: "qa" },
    { id: "B4", local: "Suiza", visitante: "Bosnia", fecha: "18 jun 2026", hora: "2026-06-18T14:00:00", estadio: "Estadio Nueva York", flagLocal: "ch", flagVisitante: "ba" },
    { id: "B5", local: "Suiza", visitante: "Canadá", fecha: "24 jun 2026", hora: "2026-06-24T14:00:00", estadio: "Estadio Vancouver", flagLocal: "ch", flagVisitante: "ca" },
    { id: "B6", local: "Bosnia", visitante: "Catar", fecha: "24 jun 2026", hora: "2026-06-24T14:00:00", estadio: "Estadio Seattle", flagLocal: "ba", flagVisitante: "qa" },
  ],
  C: [
    { id: "C1", local: "Brasil", visitante: "Marruecos", fecha: "13 jun 2026", hora: "2026-06-13T14:00:00", estadio: "Estadio Los Ángeles", flagLocal: "br", flagVisitante: "ma" },
    { id: "C2", local: "Haití", visitante: "Escocia", fecha: "13 jun 2026", hora: "2026-06-13T11:00:00", estadio: "Estadio San Francisco", flagLocal: "ht", flagVisitante: "gb-sct" },
    { id: "C3", local: "Brasil", visitante: "Haití", fecha: "19 jun 2026", hora: "2026-06-19T20:30:00", estadio: "Estadio Los Ángeles", flagLocal: "br", flagVisitante: "ht" },
    { id: "C4", local: "Escocia", visitante: "Marruecos", fecha: "19 jun 2026", hora: "2026-06-19T17:00:00", estadio: "Estadio Boston", flagLocal: "gb-sct", flagVisitante: "ma" },
    { id: "C5", local: "Escocia", visitante: "Brasil", fecha: "24 jun 2026", hora: "2026-06-24T17:00:00", estadio: "Estadio Miami", flagLocal: "gb-sct", flagVisitante: "br" },
    { id: "C6", local: "Marruecos", visitante: "Haití", fecha: "24 jun 2026", hora: "2026-06-24T17:00:00", estadio: "Estadio Atlanta", flagLocal: "ma", flagVisitante: "ht" },
  ],
  D: [
    { id: "D1", local: "Australia", visitante: "Turquía", fecha: "12 jun 2026", hora: "2026-06-12T14:00:00", estadio: "Estadio Vancouver", flagLocal: "au", flagVisitante: "tr" },
    { id: "D2", local: "USA", visitante: "Paraguay", fecha: "12 jun 2026", hora: "2026-06-12T11:00:00", estadio: "Estadio Los Ángeles", flagLocal: "us", flagVisitante: "py" },
    { id: "D3", local: "USA", visitante: "Australia", fecha: "19 jun 2026", hora: "2026-06-19T14:00:00", estadio: "Estadio Seattle", flagLocal: "us", flagVisitante: "au" },
    { id: "D4", local: "Turquía", visitante: "Paraguay", fecha: "19 jun 2026", hora: "2026-06-19T11:00:00", estadio: "Estadio Dallas", flagLocal: "tr", flagVisitante: "py" },
    { id: "D5", local: "Turquía", visitante: "USA", fecha: "25 jun 2026", hora: "2026-06-25T21:00:00", estadio: "Estadio Los Ángeles", flagLocal: "tr", flagVisitante: "us" },
    { id: "D6", local: "Paraguay", visitante: "Australia", fecha: "25 jun 2026", hora: "2026-06-25T21:00:00", estadio: "Estadio San Francisco", flagLocal: "py", flagVisitante: "au" },
  ],
  E: [
    { id: "E1", local: "Alemania", visitante: "Curaçao", fecha: "13 jun 2026", hora: "2026-06-13T14:00:00", estadio: "Estadio Houston", flagLocal: "de", flagVisitante: "cw" },
    { id: "E2", local: "Costa de Marfil", visitante: "Ecuador", fecha: "14 jun 2026", hora: "2026-06-14T18:00:00", estadio: "Estadio Filadelfia", flagLocal: "ci", flagVisitante: "ec" },
    { id: "E3", local: "Alemania", visitante: "Costa de Marfil", fecha: "20 jun 2026", hora: "2026-06-20T15:00:00", estadio: "Estadio Toronto", flagLocal: "de", flagVisitante: "ci" },
    { id: "E4", local: "Ecuador", visitante: "Curaçao", fecha: "20 jun 2026", hora: "2026-06-20T19:00:00", estadio: "Estadio Kansas City", flagLocal: "ec", flagVisitante: "cw" },
    { id: "E5", local: "Ecuador", visitante: "Alemania", fecha: "25 jun 2026", hora: "2026-06-25T15:00:00", estadio: "Estadio Nueva Jersey", flagLocal: "ec", flagVisitante: "de" },
    { id: "E6", local: "Curaçao", visitante: "Costa de Marfil", fecha: "25 jun 2026", hora: "2026-06-25T15:00:00", estadio: "Estadio Filadelfia", flagLocal: "cw", flagVisitante: "ci" },
  ],
  F: [
    { id: "F1", local: "Países Bajos", visitante: "Japón", fecha: "14 jun 2026", hora: "2026-06-14T15:00:00", estadio: "Estadio Arlington", flagLocal: "nl", flagVisitante: "jp" },
    { id: "F2", local: "Suecia", visitante: "Túnez", fecha: "14 jun 2026", hora: "2026-06-14T21:00:00", estadio: "Estadio Monterrey", flagLocal: "se", flagVisitante: "tn" },
    { id: "F3", local: "Países Bajos", visitante: "Suecia", fecha: "20 jun 2026", hora: "2026-06-20T12:00:00", estadio: "Estadio Houston", flagLocal: "nl", flagVisitante: "se" },
    { id: "F4", local: "Túnez", visitante: "Japón", fecha: "20 jun 2026", hora: "2026-06-20T23:00:00", estadio: "Estadio Kansas City", flagLocal: "tn", flagVisitante: "jp" },
    { id: "F5", local: "Túnez", visitante: "Países Bajos", fecha: "25 jun 2026", hora: "2026-06-25T18:00:00", estadio: "Estadio Kansas City", flagLocal: "tn", flagVisitante: "nl" },
    { id: "F6", local: "Japón", visitante: "Suecia", fecha: "25 jun 2026", hora: "2026-06-25T18:00:00", estadio: "Estadio Arlington", flagLocal: "jp", flagVisitante: "se" },
  ],
  G: [
    { id: "G1", local: "Bélgica", visitante: "Egipto", fecha: "15 jun 2026", hora: "2026-06-15T14:00:00", estadio: "Estadio Atlanta", flagLocal: "be", flagVisitante: "eg" },
    { id: "G2", local: "Irán", visitante: "Nueva Zelanda", fecha: "15 jun 2026", hora: "2026-06-15T20:00:00", estadio: "Estadio Miami", flagLocal: "ir", flagVisitante: "nz" },
    { id: "G3", local: "Bélgica", visitante: "Irán", fecha: "21 jun 2026", hora: "2026-06-21T14:00:00", estadio: "Estadio Los Ángeles", flagLocal: "be", flagVisitante: "ir" },
    { id: "G4", local: "Nueva Zelanda", visitante: "Egipto", fecha: "21 jun 2026", hora: "2026-06-21T20:00:00", estadio: "Estadio Vancouver", flagLocal: "nz", flagVisitante: "eg" },
    { id: "G5", local: "Nueva Zelanda", visitante: "Bélgica", fecha: "26 jun 2026", hora: "2026-06-26T22:00:00", estadio: "Estadio Miami", flagLocal: "nz", flagVisitante: "be" },
    { id: "G6", local: "Egipto", visitante: "Irán", fecha: "26 jun 2026", hora: "2026-06-26T22:00:00", estadio: "Estadio Atlanta", flagLocal: "eg", flagVisitante: "ir" },
  ],
  H: [
    { id: "H1", local: "España", visitante: "Cabo Verde", fecha: "15 jun 2026", hora: "2026-06-15T11:00:00", estadio: "Estadio Atlanta", flagLocal: "es", flagVisitante: "cv" },
    { id: "H2", local: "Arabia Saudí", visitante: "Uruguay", fecha: "15 jun 2026", hora: "2026-06-15T17:00:00", estadio: "Estadio Dallas", flagLocal: "sa", flagVisitante: "uy" },
    { id: "H3", local: "España", visitante: "Arabia Saudí", fecha: "21 jun 2026", hora: "2026-06-21T11:00:00", estadio: "Estadio Atlanta", flagLocal: "es", flagVisitante: "sa" },
    { id: "H4", local: "Uruguay", visitante: "Cabo Verde", fecha: "21 jun 2026", hora: "2026-06-21T17:00:00", estadio: "Estadio Miami", flagLocal: "uy", flagVisitante: "cv" },
    { id: "H5", local: "Uruguay", visitante: "España", fecha: "26 jun 2026", hora: "2026-06-26T19:00:00", estadio: "Estadio Dallas", flagLocal: "uy", flagVisitante: "es" },
    { id: "H6", local: "Cabo Verde", visitante: "Arabia Saudí", fecha: "26 jun 2026", hora: "2026-06-26T19:00:00", estadio: "Estadio Houston", flagLocal: "cv", flagVisitante: "sa" },
  ],
  I: [
    { id: "I1", local: "Francia", visitante: "Senegal", fecha: "16 jun 2026", hora: "2026-06-16T14:00:00", estadio: "Estadio Nueva York", flagLocal: "fr", flagVisitante: "sn" },
    { id: "I2", local: "Irak", visitante: "Noruega", fecha: "16 jun 2026", hora: "2026-06-16T17:00:00", estadio: "Estadio Boston", flagLocal: "iq", flagVisitante: "no" },
    { id: "I3", local: "Francia", visitante: "Irak", fecha: "22 jun 2026", hora: "2026-06-22T16:00:00", estadio: "Estadio Filadelfia", flagLocal: "fr", flagVisitante: "iq" },
    { id: "I4", local: "Noruega", visitante: "Senegal", fecha: "22 jun 2026", hora: "2026-06-22T19:00:00", estadio: "Estadio Nueva York", flagLocal: "no", flagVisitante: "sn" },
    { id: "I5", local: "Noruega", visitante: "Francia", fecha: "26 jun 2026", hora: "2026-06-26T14:00:00", estadio: "Estadio Boston", flagLocal: "no", flagVisitante: "fr" },
    { id: "I6", local: "Senegal", visitante: "Irak", fecha: "26 jun 2026", hora: "2026-06-26T14:00:00", estadio: "Estadio Nueva York", flagLocal: "sn", flagVisitante: "iq" },
  ],
  J: [
    { id: "J1", local: "Argentina", visitante: "Argelia", fecha: "16 jun 2026", hora: "2026-06-16T20:00:00", estadio: "Estadio Dallas", flagLocal: "ar", flagVisitante: "dz" },
    { id: "J2", local: "Austria", visitante: "Jordania", fecha: "16 jun 2026", hora: "2026-06-16T23:00:00", estadio: "Estadio San Francisco", flagLocal: "at", flagVisitante: "jo" },
    { id: "J3", local: "Argentina", visitante: "Austria", fecha: "22 jun 2026", hora: "2026-06-22T12:00:00", estadio: "Estadio Dallas", flagLocal: "ar", flagVisitante: "at" },
    { id: "J4", local: "Jordania", visitante: "Argelia", fecha: "22 jun 2026", hora: "2026-06-22T22:00:00", estadio: "Estadio Miami", flagLocal: "jo", flagVisitante: "dz" },
    { id: "J5", local: "Jordania", visitante: "Argentina", fecha: "27 jun 2026", hora: "2026-06-27T21:00:00", estadio: "Estadio Arlington", flagLocal: "jo", flagVisitante: "ar" },
    { id: "J6", local: "Argelia", visitante: "Austria", fecha: "27 jun 2026", hora: "2026-06-27T21:00:00", estadio: "Estadio Kansas City", flagLocal: "dz", flagVisitante: "at" },
  ],
  K: [
    { id: "K1", local: "Portugal", visitante: "DR Congo", fecha: "17 jun 2026", hora: "2026-06-17T12:00:00", estadio: "Estadio Houston", flagLocal: "pt", flagVisitante: "cd" },
    { id: "K2", local: "Uzbekistán", visitante: "Colombia", fecha: "17 jun 2026", hora: "2026-06-17T21:00:00", estadio: "Estadio Ciudad de México", flagLocal: "uz", flagVisitante: "co" },
    { id: "K3", local: "Portugal", visitante: "Uzbekistán", fecha: "23 jun 2026", hora: "2026-06-23T12:00:00", estadio: "Estadio Houston", flagLocal: "pt", flagVisitante: "uz" },
    { id: "K4", local: "Colombia", visitante: "DR Congo", fecha: "23 jun 2026", hora: "2026-06-23T21:00:00", estadio: "Estadio Seattle", flagLocal: "co", flagVisitante: "cd" },
    { id: "K5", local: "Colombia", visitante: "Portugal", fecha: "27 jun 2026", hora: "2026-06-27T18:30:00", estadio: "Estadio Miami", flagLocal: "co", flagVisitante: "pt" },
    { id: "K6", local: "DR Congo", visitante: "Uzbekistán", fecha: "27 jun 2026", hora: "2026-06-27T18:30:00", estadio: "Estadio Atlanta", flagLocal: "cd", flagVisitante: "uz" },
  ],
  L: [
    { id: "L1", local: "Inglaterra", visitante: "Croacia", fecha: "17 jun 2026", hora: "2026-06-17T15:00:00", estadio: "Estadio Arlington", flagLocal: "gb-eng", flagVisitante: "hr" },
    { id: "L2", local: "Ghana", visitante: "Panamá", fecha: "17 jun 2026", hora: "2026-06-17T18:00:00", estadio: "Estadio Toronto", flagLocal: "gh", flagVisitante: "pa" },
    { id: "L3", local: "Inglaterra", visitante: "Ghana", fecha: "23 jun 2026", hora: "2026-06-23T15:00:00", estadio: "Estadio Boston", flagLocal: "gb-eng", flagVisitante: "gh" },
    { id: "L4", local: "Panamá", visitante: "Croacia", fecha: "23 jun 2026", hora: "2026-06-23T18:00:00", estadio: "Estadio Monterrey", flagLocal: "pa", flagVisitante: "hr" },
    { id: "L5", local: "Panamá", visitante: "Inglaterra", fecha: "27 jun 2026", hora: "2026-06-27T16:00:00", estadio: "Estadio Monterrey", flagLocal: "pa", flagVisitante: "gb-eng" },
    { id: "L6", local: "Croacia", visitante: "Ghana", fecha: "27 jun 2026", hora: "2026-06-27T16:00:00", estadio: "Estadio Chicago", flagLocal: "hr", flagVisitante: "gh" },
  ],
}

const TODOS_PARTIDOS = [...Object.values(GRUPOS).flat(), ...PARTIDOS_R32]

  // Lista de partidos ordenada por fecha (datos estáticos, se ordena una vez)
  const sortedPartidos = [...TODOS_PARTIDOS].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

export default function App() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [usuario, setUsuario] = useState(null)
  const [pronosticos, setPronosticos] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [fechaEnvio, setFechaEnvio] = useState(null)
  const [tab, setTab] = useState("fase-final")
  const [grupoActivo, setGrupoActivo] = useState("A")
  const [tabla, setTabla] = useState([])
  const [tablaFaseFinal, setTablaFaseFinal] = useState([])
  const [resultados, setResultados] = useState({})
  const [marcadores, setMarcadores] = useState({})
  const [usuariosAdmin, setUsuariosAdmin] = useState([])
  const [grupoAdminActivo, setGrupoAdminActivo] = useState("A")
  const [adminTab, setAdminTab] = useState("resultados")
  const [ahora, setAhora] = useState(new Date())
  const [detalleData, setDetalleData] = useState({})
  const [detalleFaseFinal, setDetalleFaseFinal] = useState({})
  const [marcadorFaseFinal, setMarcadorFaseFinal] = useState({})
  const [marcadorFaseFinalR16, setMarcadorFaseFinalR16] = useState({})
  const [picksFaseFinalR16, setPicksFaseFinalR16] = useState({})
  const [modalFaseFinalEtapa, setModalFaseFinalEtapa] = useState("R32")
  const [modalUsuario, setModalUsuario] = useState(null)
  const [modalUsuarioFaseFinal, setModalUsuarioFaseFinal] = useState(null)
  const [modalGrupo, setModalGrupo] = useState("A")
  const [perfilData, setPerfilData] = useState(null)
  const [gruposData, setGruposData] = useState({})

  const [mostrarGruposTabs, setMostrarGruposTabs] = useState(true)
  const [scrollPrevio, setScrollPrevio] = useState(0)
  const [etapaFaseFinal, setEtapaFaseFinal] = useState("DIECISEISAVOS")

  // === R32 (Dieciseisavos de Final) - completamente separado de fase de grupos ===
  const [pronosticosR32, setPronosticosR32] = useState({})
  const [enviadoR32, setEnviadoR32] = useState(false)

  const [resultadosR32, setResultadosR32] = useState({})
  const [marcadoresR32, setMarcadoresR32] = useState({})
  const [mensajeR32, setMensajeR32] = useState("")

  // === R16 (Octavos de Final) - completamente separado de R32 ===
  const [pronosticosR16, setPronosticosR16] = useState({})
  const [enviadoR16, setEnviadoR16] = useState(false)

  const [resultadosR16, setResultadosR16] = useState({})
  const [marcadoresR16, setMarcadoresR16] = useState({})
  const [mensajeR16, setMensajeR16] = useState("")
  const [guardadoR16, setGuardadoR16] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollActual = window.scrollY
      if (scrollActual > scrollPrevio && scrollActual > 60) {
        setMostrarGruposTabs(false)
      } else {
        setMostrarGruposTabs(true)
      }
      setScrollPrevio(scrollActual)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrollPrevio])
  useEffect(() => {
    const interval = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Cargar resultados cuando el usuario inicia sesión
  useEffect(() => {
    if (usuario) {
      cargarResultados()
      cargarResultadosR32()
      cargarResultadosR16()
    }
  }, [usuario?.uid])

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

    // Paso 1: autenticación. Solo aquí puede fallar por credenciales incorrectas.
    let cred
    try {
      cred = await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setError("Correo o contraseña incorrectos")
      return
    }

    setUsuario(cred.user)

    // Paso 2: carga de datos. Cada llamada es independiente (Promise.allSettled):
    // si una falla (permiso momentáneo, red, etc.) las demás NO se cancelan,
    // y jamás mostramos "credenciales incorrectas" por un fallo de carga
    // (el login ya fue exitoso en el paso 1).
    const resultadosCarga = await Promise.allSettled([
      cargarPronosticos(cred.user.uid),
      cargarPronosticosR32(cred.user.uid),
      cargarPronosticosR16(cred.user.uid),
      cargarResultados(),
      cargarResultadosR32(),
      cargarResultadosR16(),
    ])

    resultadosCarga.forEach((r) => {
      if (r.status === "rejected") console.error("Error cargando datos tras el login:", r.reason)
    })

    try {
      await cargarTablaFaseFinal()
    } catch (e) {
      console.error("Error cargando tabla de fase final:", e)
    }

    if (cred.user.email === ADMIN_EMAIL) setTab("admin")
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
    if (snap.exists()) {
      setResultados(snap.data().picks || {})
      setMarcadores(snap.data().marcadores || {})
    }
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

  const cargarTablaFaseFinal = async () => {
    // === R32 (Dieciseisavos) ===
    const pronSnapR32 = await getDocs(collection(db, "pronosticosR32"))
    const resSnapR32 = await getDoc(doc(db, "resultadosR32", "oficial"))
    const marcadoresOficialesR32 = resSnapR32.exists() ? resSnapR32.data().marcadores || {} : {}

    // === R16 (Octavos) ===
    const pronSnapR16 = await getDocs(collection(db, "pronosticosR16"))
    const resSnapR16 = await getDoc(doc(db, "resultadosR16", "oficial"))
    const marcadoresOficialesR16 = resSnapR16.exists() ? resSnapR16.data().marcadores || {} : {}

    // Mapa uid -> { puntosR16, enviadoR16 } calculado en tiempo real
    const infoR16PorUid = {}
    pronSnapR16.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return
      const picks = data.picks || {}
      let puntos = 0
      PARTIDOS_R16.forEach(p => {
        if (picks[p.id] && marcadoresOficialesR16[p.id]) {
          puntos += calcularPuntosR32(picks[p.id], marcadoresOficialesR16[p.id])
        }
      })
      infoR16PorUid[d.id] = { puntos, enviado: data.enviado, picks: data.picks }
    })

    const filas = []
    const uidsVistos = new Set()

    // Recorremos R32 (siempre existe primero) y sumamos lo que haya en R16
    pronSnapR32.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return

      // Calcular puntos R32 en tiempo real basado en resultados actuales (nunca se pierde, se recalcula siempre)
      const picks = data.picks || {}
      let puntosR32 = 0
      PARTIDOS_R32.forEach(p => {
        if (picks[p.id] && marcadoresOficialesR32[p.id]) {
          puntosR32 += calcularPuntosR32(picks[p.id], marcadoresOficialesR32[p.id])
        }
      })

      const infoR16 = infoR16PorUid[d.id] || { puntos: 0 }

      filas.push({
        uid: d.id,
        email: data.email,
        nombre: getNombre(data.email),
        puntos: puntosR32 + infoR16.puntos,
        puntosR32,
        puntosR16: infoR16.puntos,
        enviado: data.enviado,
        picks: data.picks
      })
      uidsVistos.add(d.id)
    })

    // Por si algún usuario tiene pronósticos de R16 pero no de R32 (caso raro, para no dejarlo fuera)
    pronSnapR16.forEach(d => {
      const data = d.data()
      if (data.email === ADMIN_EMAIL) return
      if (uidsVistos.has(d.id)) return

      const infoR16 = infoR16PorUid[d.id] || { puntos: 0 }
      filas.push({
        uid: d.id,
        email: data.email,
        nombre: getNombre(data.email),
        puntos: infoR16.puntos,
        puntosR32: 0,
        puntosR16: infoR16.puntos,
        enviado: data.enviado,
        picks: data.picks
      })
    })

    filas.sort((a, b) => b.puntos - a.puntos)
    setTablaFaseFinal(filas)
  }

  const cargarGrupos = async () => {
    const snap = await getDoc(doc(db, "resultados", "oficial"))
    const marc = snap.exists() ? snap.data().marcadores || {} : {}
    const standings = {}
    Object.keys(GRUPOS).forEach(g => {
      const equipos = {}
      const teams = [...new Set(GRUPOS[g].flatMap(p => [p.local, p.visitante]))]
      teams.forEach(t => { equipos[t] = { nombre: t, flag: "", pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 } })
      GRUPOS[g].forEach(partido => {
        const loc = partido.local
        const vis = partido.visitante
        equipos[loc].flag = partido.flagLocal
        equipos[vis].flag = partido.flagVisitante
        const m = marc[partido.id]
        if (m !== undefined && m.local !== "" && m.visitante !== "" && m.local !== undefined && m.visitante !== undefined) {
          const gl = parseInt(m.local) || 0
          const gv = parseInt(m.visitante) || 0
          equipos[loc].pj++; equipos[vis].pj++
          equipos[loc].gf += gl; equipos[loc].gc += gv
          equipos[vis].gf += gv; equipos[vis].gc += gl
          if (gl > gv) { equipos[loc].g++; equipos[loc].pts += 3; equipos[vis].p++ }
          else if (gl < gv) { equipos[vis].g++; equipos[vis].pts += 3; equipos[loc].p++ }
          else { equipos[loc].e++; equipos[vis].e++; equipos[loc].pts++; equipos[vis].pts++ }
        }
      })
      standings[g] = Object.values(equipos).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf)
    })
    setGruposData(standings)
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

  // === R32 Firebase functions ===
  /* disabled (no-unused-vars lint) */
  const cargarPronosticosR32 = async (uid) => {

    const snap = await getDoc(doc(db, "pronosticosR32", uid))
    if (snap.exists()) {
      setPronosticosR32(snap.data().picks || {})
      setEnviadoR32(snap.data().enviado || false)
      setFechaEnvioR32(snap.data().fechaEnvio || null)
    }
  }

  /* disabled (no-unused-vars lint) */
  const cargarResultadosR32 = async () => {

    const snap = await getDoc(doc(db, "resultadosR32", "oficial"))
    if (snap.exists()) {
      setResultadosR32(snap.data().picks || {})
      setMarcadoresR32(snap.data().marcadores || {})
    }
  }

  const enviarPronosticosR32 = async () => {
    if (Object.keys(pronosticosR32).length === 0) {
      setMensajeR32("⚠️ Debes pronosticar al menos 1 partido antes de guardar.")
      return
    }
    
    // Validar que todos los pronósticos tengan AMBOS valores (local y visitante)
    for (const [id, pronos] of Object.entries(pronosticosR32)) {
      if (pronos.local === "" || pronos.local === undefined || pronos.visitante === "" || pronos.visitante === undefined) {
        setMensajeR32("⚠️ Todos los pronósticos deben tener ambos marcadores (goles local y visitante).")
        return
      }
    }
    
    try {
      // Cargar datos actuales para preservar puntajeR32 Y los picks ya guardados
      const docSnap = await getDoc(doc(db, "pronosticosR32", usuario.uid))
      const datosActuales = docSnap.exists() ? docSnap.data() : {}
      const picksActuales = datosActuales.picks || {}

      // Fusionar: lo que ya estaba guardado + lo que hay en el estado local ahora mismo.
      // Así nunca se borra un partido que ya se había guardado antes.
      const picksFusionados = { ...picksActuales, ...pronosticosR32 }

      const fecha = new Date().toISOString()
      await setDoc(doc(db, "pronosticosR32", usuario.uid), {
        ...datosActuales,  // ← PRESERVAR DATOS ANTERIORES (incluyendo puntajeR32)
        email: usuario.email, 
        picks: picksFusionados, 
        enviado: true, 
        fechaEnvio: fecha
      })
      setPronosticosR32(picksFusionados) // sincroniza el estado local con lo realmente guardado
      setEnviadoR32(true)
      setGuardadoR32(true)
      setMensajeR32("✅ ¡Pronósticos guardados!")

      // Vuelve al estado normal después de 2 segundos
      setTimeout(() => {
        setGuardadoR32(false)
      }, 2000)
    } catch (e) {
      setMensajeR32("Error al guardar. Intenta de nuevo.")
    }
  }

  const limpiarPronosticosR32 = async () => {
    if (!window.confirm("¿Seguro que quieres limpiar tus pronósticos de Dieciseisavos?")) return
    try {
      await deleteDoc(doc(db, "pronosticosR32", usuario.uid))
      setPronosticosR32({})
      setEnviadoR32(false)

      setMensajeR32("🗑️ Pronósticos de Dieciseisavos eliminados.")
    } catch (e) {
      setMensajeR32("Error al limpiar.")
    }
  }

  /* disabled (no-unused-vars lint) */
  const guardarResultadosR32 = async () => {
    try {
      // Guardar marcadores y picks reales
      await setDoc(doc(db, "resultadosR32", "oficial"), {
        picks: resultadosR32,
        marcadores: marcadoresR32,
        fechaActualizacion: new Date().toISOString()
      })

      // Calcular puntos de todos los usuarios
      const snap = await getDocs(collection(db, "pronosticosR32"))
      const actualizaciones = []

      snap.forEach(d => {
        const data = d.data()
        if (data.email === ADMIN_EMAIL) return

        const picks = data.picks || {}
        let puntajeTotal = 0

        // Calcular puntos por cada partido
        PARTIDOS_R32.forEach(p => {
          if (picks[p.id] && marcadoresR32[p.id]) {
            puntajeTotal += calcularPuntosR32(picks[p.id], marcadoresR32[p.id])
          }
        })

        // Guardar puntos en el documento del usuario
        actualizaciones.push(
          setDoc(doc(db, "pronosticosR32", d.id), {
            ...data,
            puntajeR32: puntajeTotal
          })
        )
      })

      await Promise.all(actualizaciones)
      setMensajeR32("✅ Resultados guardados y puntos calculados correctamente.")
      
      // Recargar tabla de fase final
      await cargarTablaFaseFinal()
    } catch (e) {
      console.error(e)
      setMensajeR32("Error al guardar resultados.")
    }
  }

  // === R16 (Octavos) Functions ===
  const cargarPronosticosR16 = async (uid) => {
    const snap = await getDoc(doc(db, "pronosticosR16", uid))
    if (snap.exists()) {
      setPronosticosR16(snap.data().picks || {})
      setEnviadoR16(snap.data().enviado || false)
    }
  }

  const cargarResultadosR16 = async () => {
    const snap = await getDoc(doc(db, "resultadosR16", "oficial"))
    if (snap.exists()) {
      setResultadosR16(snap.data().picks || {})
      setMarcadoresR16(snap.data().marcadores || {})
    }
  }

  const enviarPronosticosR16 = async () => {
    if (Object.keys(pronosticosR16).length === 0) {
      setMensajeR16("⚠️ Debes pronosticar al menos 1 partido antes de guardar.")
      return
    }
    
    // Validar que todos los pronósticos tengan AMBOS valores (local y visitante)
    for (const [id, pronos] of Object.entries(pronosticosR16)) {
      if (pronos.local === "" || pronos.local === undefined || pronos.visitante === "" || pronos.visitante === undefined) {
        setMensajeR16("⚠️ Todos los pronósticos deben tener ambos marcadores (goles local y visitante).")
        return
      }
    }
    
    try {
      // Cargar datos actuales para preservar datos anteriores (incluyendo picks ya guardados)
      const docSnap = await getDoc(doc(db, "pronosticosR16", usuario.uid))
      const datosActuales = docSnap.exists() ? docSnap.data() : {}
      const picksActuales = datosActuales.picks || {}

      // Fusionar: lo que ya estaba guardado + lo que hay en el estado local ahora mismo.
      // Así nunca se borra un partido que ya se había guardado antes.
      const picksFusionados = { ...picksActuales, ...pronosticosR16 }
      
      const fecha = new Date().toISOString()
      await setDoc(doc(db, "pronosticosR16", usuario.uid), {
        ...datosActuales,
        email: usuario.email, 
        picks: picksFusionados, 
        enviado: true, 
        fechaEnvio: fecha
      })
      setPronosticosR16(picksFusionados) // sincroniza el estado local con lo realmente guardado
      setEnviadoR16(true)
      setGuardadoR16(true)
      setMensajeR16("✅ ¡Pronósticos guardados!")

      // Vuelve al estado normal después de 2 segundos
      setTimeout(() => {
        setGuardadoR16(false)
      }, 2000)
    } catch (e) {
      setMensajeR16("Error al guardar. Intenta de nuevo.")
    }
  }

  const limpiarPronosticosR16 = async () => {
    if (!window.confirm("¿Seguro que quieres limpiar tus pronósticos de Octavos?")) return
    try {
      await deleteDoc(doc(db, "pronosticosR16", usuario.uid))
      setPronosticosR16({})
      setEnviadoR16(false)
      setMensajeR16("🗑️ Pronósticos de Octavos eliminados.")
    } catch (e) {
      setMensajeR16("Error al limpiar.")
    }
  }

  const guardarResultadosR16 = async () => {
    try {
      // Guardar marcadores y picks reales
      await setDoc(doc(db, "resultadosR16", "oficial"), {
        picks: resultadosR16,
        marcadores: marcadoresR16,
        fechaActualizacion: new Date().toISOString()
      })

      // Calcular puntos de todos los usuarios
      const snap = await getDocs(collection(db, "pronosticosR16"))
      const actualizaciones = []

      snap.forEach(d => {
        const data = d.data()
        if (data.email === ADMIN_EMAIL) return

        const picks = data.picks || {}
        let puntajeTotal = 0

        // Calcular puntos por cada partido
        PARTIDOS_R16.forEach(p => {
          if (picks[p.id] && marcadoresR16[p.id]) {
            puntajeTotal += calcularPuntosR32(picks[p.id], marcadoresR16[p.id])
          }
        })

        // Guardar puntos en el documento del usuario
        actualizaciones.push(
          setDoc(doc(db, "pronosticosR16", d.id), {
            ...data,
            puntajeR16: puntajeTotal
          })
        )
      })

      await Promise.all(actualizaciones)
      setMensajeR16("✅ Resultados guardados y puntos calculados correctamente.")
      
      // Recargar tabla de fase final
      await cargarTablaFaseFinal()
    } catch (e) {
      console.error(e)
      setMensajeR16("Error al guardar resultados.")
    }
  }

  const seleccionar = useCallback((partidoId, opcion) => {
    if (enviado || torneoFinalizado()) return
    setPronosticos(prev => ({ ...prev, [partidoId]: opcion }))
  }, [enviado])

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

  const [guardadoR32, setGuardadoR32] = useState(false)

  const limpiarMisPronosticos = async () => {
    if (!window.confirm("¿Seguro que quieres limpiar tus pronósticos?")) return
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
        picks: resultados,
        marcadores: marcadores,
        fechaActualizacion: new Date().toISOString()
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
    setPronosticosR32({})
    setEnviadoR32(false)
    setMensajeR32("")
    setPronosticosR16({})
    setEnviadoR16(false)
    setMensajeR16("")
    setTab("pronosticos")
    setTabla([])
    setTablaFaseFinal([])
    setModalUsuario(null)
    setModalUsuarioFaseFinal(null)
    setPerfilData(null)
    setGruposData({})
  }

  const cambiarTab = async (t) => {
    setTab(t)
    setMensaje("")
    if (t === "tabla") { await cargarTabla(); await cargarResultadosR32() }
    if (t === "tabla-fase-final") await cargarTablaFaseFinal()
    if (t === "grupos") { await cargarGrupos(); await cargarResultadosR32() }
    if (t === "perfil") await cargarPerfil()
    if (t === "pronosticos") { await cargarResultadosR32(); await cargarResultadosR16() }
    if (t === "admin") { await cargarResultados(); await cargarResultadosR32(); await cargarUsuariosAdmin() }
  }

  const abrirModal = async (fila) => {
    const resSnap = await getDoc(doc(db, "resultados", "oficial"))
    const resOficial = resSnap.exists() ? resSnap.data().picks || {} : {}
    setDetalleData(resOficial)
    setModalUsuario(fila)
    setModalGrupo("A")
  }

  const abrirModalFaseFinal = async (fila) => {
    const resSnap = await getDoc(doc(db, "resultadosR32", "oficial"))
    let marcadores = resSnap.exists() ? resSnap.data().marcadores || {} : {}
    
    // Asegurar que todos los marcadores tienen la estructura correcta
    marcadores = Object.entries(marcadores).reduce((acc, [id, marc]) => {
      acc[id] = {
        local: marc?.local ?? "",
        visitante: marc?.visitante ?? ""
      }
      return acc
    }, {})
    
    // Cargar resultados oficiales de R16 (octavos)
    const resSnapR16 = await getDoc(doc(db, "resultadosR16", "oficial"))
    let marcadoresR16Data = resSnapR16.exists() ? resSnapR16.data().marcadores || {} : {}
    marcadoresR16Data = Object.entries(marcadoresR16Data).reduce((acc, [id, marc]) => {
      acc[id] = {
        local: marc?.local ?? "",
        visitante: marc?.visitante ?? ""
      }
      return acc
    }, {})

    // Cargar los pronósticos de R16 de este usuario en particular
    const pronR16Snap = await getDoc(doc(db, "pronosticosR16", fila.uid))
    const picksR16 = pronR16Snap.exists() ? pronR16Snap.data().picks || {} : {}

    setMarcadorFaseFinal(marcadores)
    setMarcadorFaseFinalR16(marcadoresR16Data)
    setPicksFaseFinalR16(picksR16)
    setModalFaseFinalEtapa("R32")
    setModalUsuarioFaseFinal(fila)
  }

  const calcularPuntosR32 = (pick, marcador) => {
    if (!pick || !marcador) return 0
    
    const pickLocal = parseInt(pick.local) || 0
    const pickVisitante = parseInt(pick.visitante) || 0
    const marLocal = parseInt(marcador.local) || 0
    const marVisitante = parseInt(marcador.visitante) || 0
    
    // Determinar resultado del pick
    let pickResultado
    if (pickLocal > pickVisitante) pickResultado = "local"
    else if (pickLocal < pickVisitante) pickResultado = "visitante"
    else pickResultado = "empate"
    
    // Determinar resultado oficial
    let marResultado
    if (marLocal > marVisitante) marResultado = "local"
    else if (marLocal < marVisitante) marResultado = "visitante"
    else marResultado = "empate"
    
    // Si el resultado es diferente, 0 puntos (Sin Acierto)
    if (pickResultado !== marResultado) return 0
    
    // Para empates acertados
    if (pickResultado === "empate") {
      // Empate exacto (mismo marcador): 7 puntos (Empate Exacto)
      if (pickLocal === marLocal && pickVisitante === marVisitante) return 7
      // Empate correcto pero goles diferentes: 5 puntos (Empate Correcto)
      return 5
    }
    
    // Para ganadores acertados
    // Si marcador exacto: 10 puntos (Marcador Exacto con ganador)
    if (pickLocal === marLocal && pickVisitante === marVisitante) return 10
    
    // Si ganador correcto y misma diferencia de gol: 7 puntos (Ganador + Diferencia)
    const pickDiferencia = Math.abs(pickLocal - pickVisitante)
    const marDiferencia = Math.abs(marLocal - marVisitante)
    if (pickDiferencia === marDiferencia) return 7
    
    // Si solo ganador correcto: 3 puntos (Resultado Correcto)
    return 3
  }

  const exportarPDF = (usuario) => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(`Pronósticos Fase Final - ${usuario.nombre}`, 14, 15)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Descargado: ${new Date().toLocaleDateString("es-CO")}`, 14, 22)
    
    let y = 32
    const colWidths = { partido: 45, pronostico: 35, resultado: 35, estado: 28, puntos: 20 }
    const headers = ["Partido", "Mi Pronóstico", "Resultado", "Estado", "Pts"]
    const colPositions = [14, 14 + colWidths.partido, 14 + colWidths.partido + colWidths.pronostico, 14 + colWidths.partido + colWidths.pronostico + colWidths.resultado, 14 + colWidths.partido + colWidths.pronostico + colWidths.resultado + colWidths.estado]

    const dibujarHeaders = () => {
      doc.setFontSize(10)
      doc.setTextColor(57, 255, 106)
      doc.setFont(undefined, "bold")
      headers.forEach((h, i) => {
        doc.text(h, colPositions[i], y)
      })
      y += 2
      doc.setLineWidth(0.5)
      doc.setDrawColor(57, 255, 106)
      doc.line(14, y, 200, y)
      y += 6
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")
      doc.setFontSize(8)
    }

    const dibujarSeccion = (titulo, partidos, picks, marcadores) => {
      // Título de la etapa
      doc.setFontSize(12)
      doc.setTextColor(255, 215, 0)
      doc.setFont(undefined, "bold")
      doc.text(titulo, 14, y)
      y += 8

      dibujarHeaders()

      partidos.forEach(p => {
        const pick = picks?.[p.id]
        const marcador = marcadores[p.id]

        doc.text(`${p.local} vs ${p.visitante}`, colPositions[0], y)

        const pronosticoText = pick && pick.local !== "" && pick.visitante !== "" ? `${pick.local}-${pick.visitante}` : "—"
        doc.text(pronosticoText, colPositions[1], y)

        const resultadoText = marcador && marcador.local !== "" ? `${marcador.local}-${marcador.visitante}` : "Pendiente"
        doc.text(resultadoText, colPositions[2], y)

        let estado = "—"
        let puntos = 0

        if (pick && marcador && marcador.local !== "") {
          puntos = calcularPuntosR32(pick, marcador)
          estado = puntos > 0 ? "Ganada" : "Perdida"
        } else if (!pick) {
          estado = "No pronóstico"
        } else {
          estado = "Pendiente"
        }

        if (estado === "Ganada") {
          doc.setTextColor(57, 255, 106)
        } else if (estado === "Perdida") {
          doc.setTextColor(255, 107, 107)
        } else {
          doc.setTextColor(0, 0, 0)
        }
        doc.text(estado, colPositions[3], y)

        doc.setTextColor(0, 0, 0)
        doc.text(puntos.toString(), colPositions[4], y)

        y += 7

        if (y > 270) {
          doc.addPage()
          y = 20
          dibujarHeaders()
        }
      })

      y += 6
    }

    dibujarSeccion("DIECISEISAVOS (R32)", PARTIDOS_R32, usuario.picks, marcadorFaseFinal)

    if (y > 250) {
      doc.addPage()
      y = 20
    }

    dibujarSeccion("OCTAVOS (R16)", PARTIDOS_R16, picksFaseFinalR16, marcadorFaseFinalR16)

    doc.save(`Pronosticos_FaseFinal_${usuario.nombre}.pdf`)
  }

  /* disabled (no-unused-vars lint) */
  const cargarComparacion = async (uid) => {

    if (!uid) {
      setComparacionData(null)
      setCompararConUID(null)
      return
    }
    try {
      const userSnap = await getDoc(doc(db, "usuarios", uid))
      if (userSnap.exists()) {
        const pron = userSnap.data().pronosticos || {}
        setComparacionData(pron)
        setCompararConUID(uid)
      }
    } catch (e) {
      console.error("Error cargando comparación:", e)
      setComparacionData(null)
    }
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

  const getEstadoPartido = (hora) => {
    const inicio = new Date(hora)
    const fin = new Date(inicio.getTime() + 110 * 60 * 1000)
    const ahoraD = new Date()
    if (ahoraD < inicio) return "proximo"
    if (ahoraD >= inicio && ahoraD <= fin) return "envivo"
    return "finalizado"
  }

  const formatHora = (hora) => {
    const d = new Date(hora)
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
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

  const renderEstado = (hora) => {
    const estado = getEstadoPartido(hora)
    if (estado === "proximo") return <span style={{ color: "#ffffff55", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px" }}>PRÓXIMAMENTE</span>
    if (estado === "envivo") return (
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#ff4444", fontSize: "0.72rem", fontWeight: "900", letterSpacing: "1px" }}>EN VIVO</span>
        <span style={{ display: "inline-block", width: "50px", height: "3px", background: "#ff444422", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
          <span style={{ position: "absolute", width: "12px", height: "3px", background: "#ff4444", borderRadius: "2px", animation: "slide 1.2s linear infinite" }} />
        </span>
      </span>
    )
    return <span style={{ color: "#39ff6a88", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px" }}>FINALIZADO</span>
  }

  const renderEstadoPronostico = (partido) => {
    const estado = getEstadoPartido(partido.hora)
    if (estado === "proximo") return <span style={{ color: "#ffffff55", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px" }}>PRÓXIMAMENTE</span>
    if (estado === "envivo") return (
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <span style={{ color: "#ff4444", fontSize: "0.72rem", fontWeight: "900", letterSpacing: "1px" }}>EN VIVO</span>
        <span style={{ display: "inline-block", width: "50px", height: "3px", background: "#ff444422", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
          <span style={{ position: "absolute", width: "12px", height: "3px", background: "#ff4444", borderRadius: "2px", animation: "slide 1.2s linear infinite" }} />
        </span>
      </span>
    )

    const pick = pronosticos[partido.id]
    const oficial = resultados[partido.id]
    if (!pick || !oficial) return (
      <span className="estado-pronostico estado-finalizado">
        <span className="estado-pronostico-full">FINALIZADO</span>
        <span className="estado-pronostico-short">F</span>
      </span>
    )

    const acertado = pick === oficial
    return (
      <span className={`estado-pronostico ${acertado ? "estado-ganada" : "estado-perdida"}`}>
        <span className="estado-pronostico-full">{acertado ? "GANADA" : "PERDIDA"}</span>
        <span className="estado-pronostico-short">{acertado ? "G" : "P"}</span>
      </span>
    )
  }

  const renderTablaGrupo = (g) => {
    const data = gruposData[g]
    if (!data) return null
    return (
      <div key={g} style={{ marginBottom: "40px" }}>
        <p className="grupo-titulo">📊 Grupo {g}</p>
        <div className="tabla-responsive">
          <table className="tabla tabla-grupo">
            <thead>
              <tr>
                <th>#</th>
                <th>EQUIPO</th>
                <th style={{ textAlign: "center" }}>PJ</th>
                <th style={{ textAlign: "center" }}>G</th>
                <th style={{ textAlign: "center" }}>E</th>
                <th style={{ textAlign: "center" }}>P</th>
                <th style={{ textAlign: "center" }}>GF</th>
                <th style={{ textAlign: "center" }}>GC</th>
                <th style={{ textAlign: "center" }}>DG</th>
                <th style={{ textAlign: "center" }}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((equipo, i) => (
                <tr key={equipo.nombre} style={{ borderLeft: i < 2 ? "3px solid #39ff6a" : i === 2 ? "3px solid #ffd700" : "3px solid transparent" }}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img loading="lazy" src={`https://flagcdn.com/w20/${equipo.flag}.png`} alt="" style={{ borderRadius: "2px" }} />
                      <span>{equipo.nombre}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center", color: "#ffffff88" }}>{equipo.pj}</td>
                  <td style={{ textAlign: "center", color: "#39ff6a" }}>{equipo.g}</td>
                  <td style={{ textAlign: "center", color: "#ffffff88" }}>{equipo.e}</td>
                  <td style={{ textAlign: "center", color: "#ff6b6b" }}>{equipo.p}</td>
                  <td style={{ textAlign: "center", color: "#ffffff88" }}>{equipo.gf}</td>
                  <td style={{ textAlign: "center", color: "#ffffff88" }}>{equipo.gc}</td>
                  <td style={{ textAlign: "center", color: equipo.gf - equipo.gc > 0 ? "#39ff6a" : equipo.gf - equipo.gc < 0 ? "#ff6b6b" : "#ffffff88" }}>
                    {equipo.gf - equipo.gc > 0 ? "+" : ""}{equipo.gf - equipo.gc}
                  </td>
                  <td style={{ textAlign: "center" }}><span className="badge-puntos">{equipo.pts}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderPartidos = (grupo, esAdmin = false) => {
    return GRUPOS[grupo].map(partido => {
      const resultadoOficial = resultados[partido.id]
      const pick = pronosticos[partido.id]

      const esAcierto = !esAdmin && tab === "pronosticos" && pick && resultadoOficial && pick === resultadoOficial
      const esFallo = !esAdmin && tab === "pronosticos" && pick && resultadoOficial && pick !== resultadoOficial
      return (

        <PartidoCard
          key={partido.id}
          partido={partido}
          esAdmin={esAdmin}
          resultados={resultados}
          pronosticos={pronosticos}
          marcadores={marcadores}
          seleccionar={seleccionar}
          setMarcadores={setMarcadores}
          setResultados={setResultados}
          enviado={enviado}
          torneoFinalizado={torneoFinalizado}
          tab={tab}
          renderEstadoPronostico={renderEstadoPronostico}
          renderEstado={renderEstado}
        />
      )
    })
  }

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    :root { --ticker-h: 42px; }
    * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    .ticker-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 101; height: var(--ticker-h); background: linear-gradient(90deg, #00754A 0%, #006847 12%, #B31942 28%, #0A3161 50%, #002868 60%, #D52B1E 78%, #C8102E 92%, #00754A 100%); border-bottom: 1px solid #39ff6a33; overflow: hidden; white-space: nowrap; display: flex; align-items: center; }
    .ticker-track { display: inline-flex; animation: ticker-scroll 35s linear infinite; will-change: transform; }
    .ticker-bar:hover .ticker-track { animation-play-state: paused; }
    .ticker-content { display: inline-flex; align-items: center; flex-shrink: 0; }
    .ticker-item { display: inline-flex; align-items: center; gap: 10px; padding: 0 28px; border-right: 1px solid #ffffff14; flex-shrink: 0; text-transform: uppercase; }
    .ticker-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; letter-spacing: 1px; white-space: nowrap; }
    .ticker-badge-final { background: #39ff6a1a; border: 1px solid #39ff6a55; color: #39ff6a; }
    .ticker-badge-vivo { background: #ff44441a; border: 1px solid #ff444466; color: #ff4444; }
    .ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff4444; animation: ticker-pulse 1.2s ease-in-out infinite; }
    .ticker-badge-hora { background: #ffd70022; border: 1px solid #ffd70066; color: #FFD700; }
    .ticker-flag { width: 24px; border-radius: 2px; }
    .ticker-equipo { color: white; font-weight: 700; font-size: 1rem; letter-spacing: 0.3px; }
    .ticker-vs { color: #ffffff44; font-size: 0.9rem; font-weight: 800; }
    .ticker-marcador { color: #FFD700; font-weight: 900; font-size: 1.05rem; letter-spacing: 1px; }
    .ticker-grupo { color: #f0f0f0; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; }
    .ticker-vacio { width: 100%; text-align: center; color: #ffffff44; font-size: 0.95rem; font-weight: 600; letter-spacing: 0.5px; }
    @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes ticker-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .header { position: fixed; top: var(--ticker-h); left: 0; right: 0; z-index: 100; background: linear-gradient(90deg, #1e2d3d, #17212B); border-bottom: 1px solid #39ff6a33; padding: 18px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header-titulo { color: #39ff6a; font-weight: 900; font-size: 1.2rem; letter-spacing: 1.5px; text-shadow: 0 0 10px #39ff6a66; }
    .header-user { color: #ffffff88; font-size: 0.9rem; }
    .btn-logout { background: transparent; border: 1px solid #39ff6a66; color: #39ff6a; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; transition: all 0.3s; }
    .btn-logout:hover { background: #39ff6a22; box-shadow: 0 0 10px #39ff6a44; }
    .tabs { position: fixed; top: calc(77px + var(--ticker-h)); left: 0; right: 0; z-index: 99; background: #1a2733; border-bottom: 1px solid #39ff6a22; display: flex; gap: 4px; padding: 0 40px; overflow-x: auto; }
    .tab { padding: 14px 24px; background: transparent; border: none; border-bottom: 3px solid transparent; color: #ffffff55; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
    .tab:hover { color: #ffffff99; }
    .tab.activo { color: #39ff6a; border-bottom-color: #39ff6a; }
    .tab.admin-tab { color: #ffd70088; }
    .tab.admin-tab:hover { color: #ffd700; }
    .tab.admin-tab.activo { color: #ffd700; border-bottom-color: #ffd700; }
    .grupos-tabs { position: fixed; top: calc(125px + var(--ticker-h)); left: 0; right: 0; z-index: 98; background: #17212B; /* border-bottom: 1px solid #39ff6a11 */; display: flex; gap: 12px; padding: 12px 40px; overflow-x: auto; justify-content: center; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 1; transform: translateY(0); }
    .grupos-tabs.oculto { opacity: 0; transform: translateY(-100%); pointer-events: none; }
    .grupo-tab { padding: 8px 18px; background: transparent; border: 1.5px solid #39ff6a33; border-radius: 24px; color: #ffffff33; font-size: 0.8rem; font-weight: 700; letter-spacing: 1.2px; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
    .grupo-tab:hover { border-color: #39ff6a77; color: #ffffff77; }
    .grupo-tab.activo { background: #39ff6a22; border-color: #39ff6a; color: #39ff6a; box-shadow: 0 0 12px #39ff6a44; }
    .grupo-tab.admin-grupo.activo { background: #ffd70033; border-color: #ffd700; color: #ffd700; box-shadow: 0 0 12px #ffd70044; }
    .grupo-tab.admin-grupo { border-color: #ffd70033; color: #ffd70055; }
    .grupo-tab.admin-grupo:hover { border-color: #ffd70077; color: #ffd70088; }
    .fase-tabs { position: fixed; top: calc(125px + var(--ticker-h)); left: 0; right: 0; z-index: 98; background: #17212B; /* border-bottom: 1px solid #39ff6a11 */; display: flex; gap: 12px; padding: 12px 40px; overflow-x: auto; justify-content: center; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 1; transform: translateY(0); }
    .fase-tabs.oculto { opacity: 0; transform: translateY(-100%); pointer-events: none; }
    .fase-tab { padding: 8px 18px; background: transparent; border: 1.5px solid #39ff6a33; border-radius: 24px; color: #ffffff33; font-size: 0.8rem; font-weight: 700; letter-spacing: 1.2px; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
    .fase-tab:hover { border-color: #39ff6a77; color: #ffffff77; }
    .fase-tab.activo { background: #39ff6a22; border-color: #39ff6a; color: #39ff6a; box-shadow: 0 0 12px #39ff6a44; }
    .grupo-titulo { color: #39ff6a; font-size: 1rem; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
    .partido-card { background: linear-gradient(145deg, #1e2d3d, #17212B); border: 1px solid #39ff6a22; border-radius: 14px; padding: 28px 40px 22px; margin-bottom: 16px; transition: box-shadow 0.3s; }
    .partido-card:hover { box-shadow: 0 0 20px #39ff6a18; }
    .partido-card.partido-acierto { border-color: rgba(57, 255, 106, 0.5); box-shadow: 0 0 12px rgba(57, 255, 106, 0.08); }
    .partido-card.partido-fallo { border-color: rgba(255, 107, 107, 0.5); box-shadow: 0 0 12px rgba(255, 107, 107, 0.08); }
    .partido-top-row { display: flex; justify-content: center; align-items: flex-start; margin-bottom: 12px; position: relative; }
    .partido-info { color: #ffffff55; font-size: 0.78rem; letter-spacing: 1px; text-align: center; max-width: calc(100% - 100px); word-break: break-word; }
    .partido-estado-wrap { position: absolute; right: 0; top: 0; min-width: 80px; display: flex; justify-content: flex-end; }
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
    .tabla-responsive { overflow-x: auto; width: 100%; }
    .tabla { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .tabla-grupo { table-layout: fixed; min-width: 620px; }
    .tabla-grupo th:nth-child(1), .tabla-grupo td:nth-child(1) { width: 42px; text-align: center; }
    .tabla-grupo th:nth-child(2), .tabla-grupo td:nth-child(2) { width: 220px; }
    .tabla-grupo th:nth-child(n+3), .tabla-grupo td:nth-child(n+3) { width: 56px; }
    .tabla th { color: #39ff6a; font-size: 0.8rem; letter-spacing: 2px; padding: 12px 16px; text-align: left; border-bottom: 1px solid #39ff6a33; }
    .tabla td { padding: 14px 16px; border-bottom: 1px solid #ffffff11; color: white; font-size: 0.95rem; }
    .tabla tr:hover td { background: #39ff6a0a; }
    .estado-pronostico { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 1px; }
    .estado-pronostico-full { display: inline; }
    .estado-pronostico-short { display: none; }
    .estado-ganada { color: #39ff6a; }
    .estado-perdida { color: #ff6b6b; }
    .estado-finalizado { color: #39ff6a88; }
    @media (max-width: 768px) {
      .estado-pronostico-full { display: none; }
      .estado-pronostico-short { display: inline; }
    }
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
    @keyframes slide { 0% { left: -12px; } 100% { left: 40px; } }
    @media (max-width: 768px) {
      .ticker-item { padding: 0 16px; gap: 8px; }
      .ticker-equipo { font-size: 0.78rem; }
      .ticker-badge { font-size: 0.66rem; padding: 3px 9px; }
      .ticker-flag { width: 18px; }
      .header { padding: 12px 16px; }
      .header-titulo { font-size: 0.85rem; letter-spacing: 0.5px; }
      .header-user { display: none; }
      .btn-logout { padding: 6px 10px; font-size: 0.7rem; }
      .tabs { padding: 0 4px; top: calc(62px + var(--ticker-h)); }
      .tab { padding: 10px 10px; font-size: 0.7rem; letter-spacing: 0; }
      .grupos-tabs { top: calc(106px + var(--ticker-h)); padding: 8px 8px; gap: 6px; justify-content: flex-start; }
      .grupo-tab { padding: 6px 12px; font-size: 0.72rem; }
      .fase-tabs { top: calc(106px + var(--ticker-h)); padding: 8px 8px; gap: 6px; justify-content: flex-start; }
      .fase-tab { padding: 6px 12px; font-size: 0.72rem; }
      .partido-card { padding: 14px 10px; }
      .admin-card { padding: 14px 10px; }
      .partido-top-row { flex-direction: column; align-items: center; position: static; gap: 8px; }
      .partido-info { max-width: 100%; }
      .partido-estado-wrap { position: static; width: auto; justify-content: center; }
      .partido-equipos { gap: 6px; }
      .equipo-nombre { font-size: 0.78rem; }
      .btn-opcion { font-size: 0.65rem; padding: 7px 3px; max-width: 100%; letter-spacing: 0; }
      .btn-resultado { font-size: 0.65rem; padding: 7px 3px; max-width: 100%; letter-spacing: 0; }
      .tabla-responsive { overflow-x: auto; }
      .tabla-grupo { min-width: 560px; }
      .tabla-grupo th:nth-child(2), .tabla-grupo td:nth-child(2) { width: 140px; }
      .tabla-grupo th:nth-child(n+3), .tabla-grupo td:nth-child(n+3) { width: 42px; }
      .contador-box { flex-direction: column; gap: 8px; text-align: center; padding: 12px; }
      .perfil-card { padding: 20px 12px; }
      .perfil-nombre { font-size: 1.3rem; }
      .perfil-stats { gap: 8px; }
      .stat-card { padding: 10px 6px; }
      .stat-valor { font-size: 1.4rem; }
      .stat-label { font-size: 0.62rem; }
      .perfil-estado { flex-direction: column; gap: 12px; text-align: center; }
      .tabla th { font-size: 0.65rem; padding: 8px 5px; letter-spacing: 0; }
      .tabla td { font-size: 0.78rem; padding: 8px 5px; }
      .modal { max-height: 92vh; }
      .modal-body { padding: 10px 12px; }
      .modal-header { padding: 12px 14px; }
      .modal-grupos { padding: 0 8px; }
      .btn-enviar { padding: 13px 24px; font-size: 0.85rem; }
      .btn-guardar { padding: 13px 24px; font-size: 0.85rem; }
      .usuarios-tabla th { font-size: 0.65rem; padding: 7px 5px; }
      .usuarios-tabla td { font-size: 0.75rem; padding: 7px 5px; }
    }
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
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{STYLES}</style>
      <TickerBar
        partidos={TODOS_PARTIDOS}
        marcadores={{ ...marcadores, ...marcadoresR32 }}
        ahora={ahora}
        getEstadoPartido={getEstadoPartido}
        formatHora={formatHora}
      />
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
          <button className={`tab ${tab === "grupos" ? "activo" : ""}`} onClick={() => cambiarTab("grupos")}>📊 GRUPOS</button>          
          {!isAdmin && <button className={`tab ${tab === "fase-final" ? "activo" : ""}`} onClick={() => setTab("fase-final")}>🏅 FASE FINAL</button>}
          <button className={`tab ${tab === "tabla-fase-final" ? "activo" : ""}`} onClick={() => cambiarTab("tabla-fase-final")}>🏆 TABLA FASE FINAL</button>
          {!isAdmin && <button className={`tab ${tab === "perfil" ? "activo" : ""}`} onClick={() => cambiarTab("perfil")}>👤 MI PERFIL</button>}
          <button className={`tab ${tab === "reglas" ? "activo" : ""}`} onClick={() => cambiarTab("reglas")}>📖 REGLAS</button>
          {isAdmin && <button className={`tab admin-tab ${tab === "admin" ? "activo" : ""}`} onClick={() => cambiarTab("admin")}>⚙️ ADMIN</button>}
        </div>

        {(tab === "pronosticos" || tab === "admin") && (
          <div className={`grupos-tabs ${!mostrarGruposTabs ? "oculto" : ""}`}>
            {Object.keys(GRUPOS).map(g => (
              <button key={g} className={`grupo-tab ${tab === "admin" ? "admin-grupo" : ""} ${(tab === "pronosticos" ? grupoActivo : grupoAdminActivo) === g ? "activo" : ""}`}
                onClick={() => { tab === "pronosticos" ? setGrupoActivo(g) : setGrupoAdminActivo(g); window.scrollTo({ top: 0, behavior: "smooth" }) }}>
                GRUPO {g}
              </button>
            ))}
          </div>
        )}

        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "30px 16px", marginTop: tab === "pronosticos" || tab === "admin" || tab === "fase-final" ? "calc(170px + var(--ticker-h))" : "calc(120px + var(--ticker-h))", flex: 1 }}>

          {tab === "pronosticos" && (
            <>
              {!torneoFinalizado() && (
                <div className="contador-box">
                  <span style={{ color: "#ffffff66", fontSize: "0.85rem", fontWeight: "600" }}>⏰ TIEMPO PARA CERRAR PRONÓSTICOS</span>
                  <span style={{ color: "#39ff6a", fontWeight: "900", fontSize: "1.1rem", letterSpacing: "2px", textShadow: "0 0 10px #39ff6a66" }}>{contadorTexto()}</span>
                </div>
              )}
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

          {tab === "grupos" && (
            <>
              <div style={{ marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#39ff6a" }} />
                  <span style={{ color: "#ffffff55", fontSize: "0.78rem" }}>Clasifican directo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#ffd700" }} />
                  <span style={{ color: "#ffffff55", fontSize: "0.78rem" }}>Posible clasificado (mejor 3ro)</span>
                </div>
              </div>
              {Object.keys(GRUPOS).map(g => renderTablaGrupo(g))}
            </>
          )}

          {tab === "fase-final" && (
            <>
              {etapaFaseFinal !== "DIECISEISAVOS" && etapaFaseFinal !== "OCTAVOS" && (
                <p className="grupo-titulo" style={{ marginTop: "40px", textAlign: "center", color: "#ffffff44", fontSize: "0.9rem", fontWeight: "600" }}>
                  🛠️ Fase Final - PROXIMAMENTE
                </p>
              )}
              <div className={`fase-tabs ${!mostrarGruposTabs ? "oculto" : ""}`}>
                {["DIECISEISAVOS", "OCTAVOS", "CUARTOS", "SEMIFINALES", "TERCER PUESTO", "FINAL"].map(etapa => (
                  <button key={etapa} className={`fase-tab ${etapaFaseFinal === etapa ? "activo" : ""}`} onClick={() => setEtapaFaseFinal(etapa)}>{etapa}</button>
                ))}
              </div>

              {etapaFaseFinal === "DIECISEISAVOS" && (
                <>
                  <div style={{ marginBottom: "18px" }}>
                    <div className="progreso-texto" style={{ textAlign: "right" }}>
                      {PARTIDOS_R32.filter(p => pronosticosR32[p.id]?.local !== undefined && pronosticosR32[p.id]?.local !== "" && pronosticosR32[p.id]?.visitante !== undefined && pronosticosR32[p.id]?.visitante !== "").length}/{PARTIDOS_R32.length} partidos pronosticados
                    </div>
                    <div className="progreso-bar">
                      <div
                        className="progreso-fill"
                        style={{ width: `${(PARTIDOS_R32.filter(p => pronosticosR32[p.id]?.local !== undefined && pronosticosR32[p.id]?.local !== "" && pronosticosR32[p.id]?.visitante !== undefined && pronosticosR32[p.id]?.visitante !== "").length / PARTIDOS_R32.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {PARTIDOS_R32.map((partido) => (
                    <PartidoCardR32
                      key={partido.id}
                      partido={partido}
                      esAdmin={false}
                      marcadoresR32={marcadoresR32}
                      pronosticosR32={pronosticosR32}
                      setMarcadoresR32={setMarcadoresR32}
                      setPronosticosR32={setPronosticosR32}
                      enviadoR32={enviadoR32}
                      r32Cerrado={torneoFinalizado()}
                      tab="fase-final"
                      renderEstadoPronostico={renderEstadoPronostico}
                      renderEstado={renderEstado}
                    />
                  ))}

                  {mensajeR32 && (
                    <p className={mensajeR32.startsWith("✅") || mensajeR32.startsWith("🗑️") ? "msg-enviado" : "msg-warning"}>
                      {mensajeR32}
                    </p>
                  )}

                  {Object.keys(pronosticosR32).length > 0 ? (
                    <>
                      <button 
                        className="btn-enviar" 
                        onClick={enviarPronosticosR32}
                        disabled={false}
                        style={{
                          opacity: false ? 0.5 : 1,
                          cursor: false ? "not-allowed" : "pointer"
                        }}
                      >
                        {guardadoR32 ? "✅ ¡GUARDADO!" : "💾 GUARDAR PRONÓSTICOS"}  
                      </button>
                      <button className="btn-limpiar" onClick={limpiarPronosticosR32}>
                        🗑️ LIMPIAR MIS PRONÓSTICOS
                      </button>
                      {enviadoR32 && (
                        <p className="msg-enviado" style={{ marginTop: "12px" }}>
                          ✅ Pronósticos guardados. Puedes editar cualquier pronóstico mientras haya tiempo disponible para ese partido.
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#ffffff44", textAlign: "center" }}>Haz pronósticos para poder guardarlos</p>
                  )}
                </>
              )}

              {etapaFaseFinal === "OCTAVOS" && (
                <>
                  <div style={{ marginBottom: "18px" }}>
                    <div className="progreso-texto" style={{ textAlign: "right" }}>
                      {PARTIDOS_R16.filter(p => pronosticosR16[p.id]?.local !== undefined && pronosticosR16[p.id]?.local !== "" && pronosticosR16[p.id]?.visitante !== undefined && pronosticosR16[p.id]?.visitante !== "").length}/{PARTIDOS_R16.length} partidos pronosticados
                    </div>
                    <div className="progreso-bar">
                      <div
                        className="progreso-fill"
                        style={{ width: `${(PARTIDOS_R16.filter(p => pronosticosR16[p.id]?.local !== undefined && pronosticosR16[p.id]?.local !== "" && pronosticosR16[p.id]?.visitante !== undefined && pronosticosR16[p.id]?.visitante !== "").length / PARTIDOS_R16.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {PARTIDOS_R16.map((partido) => (
                    <PartidoCardR16
                      key={partido.id}
                      partido={partido}
                      esAdmin={false}
                      marcadoresR16={marcadoresR16}
                      pronosticosR16={pronosticosR16}
                      setMarcadoresR16={setMarcadoresR16}
                      setPronosticosR16={setPronosticosR16}
                      enviadoR16={enviadoR16}
                      r16Cerrado={torneoFinalizado()}
                      tab="fase-final"
                      renderEstadoPronostico={renderEstadoPronostico}
                      renderEstado={renderEstado}
                    />
                  ))}

                  {mensajeR16 && (
                    <p className={mensajeR16.startsWith("✅") || mensajeR16.startsWith("🗑️") ? "msg-enviado" : "msg-warning"}>
                      {mensajeR16}
                    </p>
                  )}

                  {Object.keys(pronosticosR16).length > 0 ? (
                    <>
                      <button 
                        className="btn-enviar" 
                        onClick={enviarPronosticosR16}
                        disabled={false}
                        style={{
                          opacity: false ? 0.5 : 1,
                          cursor: false ? "not-allowed" : "pointer"
                        }}
                      >
                        {guardadoR16 ? "✅ ¡GUARDADO!" : "💾 GUARDAR PRONÓSTICOS"}  
                      </button>
                      <button className="btn-limpiar" onClick={limpiarPronosticosR16}>
                        🗑️ LIMPIAR MIS PRONÓSTICOS
                      </button>
                      {enviadoR16 && (
                        <p className="msg-enviado" style={{ marginTop: "12px" }}>
                          ✅ Pronósticos guardados. Puedes editar cualquier pronóstico mientras haya tiempo disponible para ese partido.
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#ffffff44", textAlign: "center" }}>Haz pronósticos para poder guardarlos</p>
                  )}
                </>
              )}
            </>
          )}

          {tab === "reglas" && (
            <div style={{ marginTop: "30px" }}>
              <div style={{ 
                textAlign: "center", 
                marginBottom: "50px"
              }}>
                <h2 style={{
                  color: "#39ff6a",
                  fontSize: "2rem",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  textShadow: "0 0 16px #39ff6a77",
                  marginBottom: "16px"
                }}>
                  SISTEMA DE PUNTUACIÓN
                </h2>
                
                {/* NUEVO: Sección "¿Cómo funciona?" */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "1px solid #39ff6a33",
                  borderRadius: "12px",
                  padding: "24px",
                  marginTop: "20px",
                  textAlign: "left",
                  maxWidth: "800px",
                  margin: "20px auto 0"
                }}>
                  <h3 style={{
                    color: "#39ff6a",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "16px",
                    letterSpacing: "1px"
                  }}>
                    ¿CÓMO FUNCIONA?
                  </h3>
                  
                  <p style={{
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "12px",
                    lineHeight: "1.6"
                  }}>
                    Predice el resultado de cada partido 30 MINUTOS antes de que comience. Cuanto más precisa sea tu predicción, más puntos ganarás.
                  </p>

                  <p style={{
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "12px",
                    lineHeight: "1.6"
                  }}>
                    Se toma en cuenta el resultado completo del partido (90' + tiempo extra). <strong>IMPORTANTE:</strong> Las series de penales <strong>NO cuentan</strong> para el resultado.
                  </p>

                  <p style={{
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0px",
                    lineHeight: "1.6"
                  }}>
                    En caso de haber más de un ganador final en la tabla de puntuación, el monto total será dividido entre estos.
                  </p>
                </div>
              </div>

              {/* TARJETAS DE PUNTUACIÓN - Igual a como estaba */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom: "40px"
              }}>
                {/* TARJETA 1 - 0 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #ffffff11",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "#ff6b6b"
                  }} />
                  <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#ff6b6b",
                    marginBottom: "12px",
                    textShadow: "0 0 12px #ff6b6b66"
                  }}>
                    0
                  </div>
                  <h3 style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    SIN ACIERTO
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    Cuando tu pronóstico no coincide con el resultado real del partido.
                  </p>
                </div>

                {/* TARJETA 2 - 3 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #ffffff11",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "#4a9eff"
                  }} />
                  <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#4a9eff",
                    marginBottom: "12px",
                    textShadow: "0 0 12px #4a9eff66"
                  }}>
                    3
                  </div>
                  <h3 style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    RESULTADO CORRECTO
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    Acertaste el ganador o el equipo que avanza a la siguiente fase. Sin importar los goles.
                  </p>
                </div>

                {/* TARJETA 3 - 5 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #ffffff11",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "#ffd700"
                  }} />
                  <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#ffd700",
                    marginBottom: "12px",
                    textShadow: "0 0 12px #ffd70066"
                  }}>
                    5
                  </div>
                  <h3 style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    EMPATE CORRECTO
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    Acertaste que el partido terminaría en empate. <strong>SIN</strong> importar la cantidad de goles.
                  </p>
                </div>

                {/* TARJETA 4 - 7 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #ffffff11",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "#39ff6a"
                  }} />
                  <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#39ff6a",
                    marginBottom: "12px",
                    textShadow: "0 0 12px #39ff6a77"
                  }}>
                    7
                  </div>
                  <h3 style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    GANADOR + DIFERENCIA
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    Acertaste el ganador <strong>y</strong> la misma diferencia de goles exacta.
                  </p>
                </div>

                {/* TARJETA 5 - 7 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #ffffff11",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "#39ff6a"
                  }} />
                  <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "#39ff6a",
                    marginBottom: "12px",
                    textShadow: "0 0 12px #39ff6a77"
                  }}>
                    7
                  </div>
                  <h3 style={{
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    EMPATE EXACTO 🎯
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    Acertaste que el partido terminaría en empate <strong>Y</strong> la cantidad exacta de goles anotados.
                  </p>
                </div>

                {/* TARJETA 6 - 10 PUNTOS */}
                <div style={{
                  background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                  border: "2px solid #39ff6a44",
                  borderRadius: "12px",
                  padding: "24px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 0 20px #39ff6a22"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #39ff6a, #ffd700)"
                  }} />
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "baseline",
                    marginBottom: "12px"
                  }}>
                    <div style={{
                      fontSize: "2.5rem",
                      fontWeight: "900",
                      color: "#39ff6a",
                      textShadow: "0 0 12px #39ff6a77"
                    }}>
                      10
                    </div>
                    <div style={{
                      fontSize: "0.75rem",
                      color: "#39ff6a",
                      fontWeight: "700",
                      letterSpacing: "1px"
                    }}>
                      🏆 MÁXIMO
                    </div>
                  </div>
                  <h3 style={{
                    color: "#39ff6a",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    letterSpacing: "0.5px"
                  }}>
                    MARCADOR EXACTO
                  </h3>
                  <p style={{
                    color: "#ffffff66",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    fontWeight: "500"
                  }}>
                    🎯 ¡Acertaste completamente! Ganador, diferencia y el marcador exacto al 100%.
                  </p>
                </div>
              </div>

              {/* TABLA RESUMEN */}
              <div style={{
                background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                border: "1px solid #39ff6a33",
                borderRadius: "12px",
                padding: "30px",
                marginTop: "40px"
              }}>
                <h3 style={{
                  color: "#39ff6a",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}>
                  📊 Tabla Resumen
                </h3>

                <div style={{
                  overflowX: "auto"
                }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom: "2px solid #39ff6a66",
                          color: "#39ff6a",
                          fontWeight: "700",
                          fontSize: "0.9rem",
                          letterSpacing: "1px"
                        }}>
                          TIPO DE ACIERTO
                        </th>
                        <th style={{
                          textAlign: "center",
                          padding: "12px",
                          borderBottom: "2px solid #39ff6a66",
                          color: "#39ff6a",
                          fontWeight: "700",
                          fontSize: "0.9rem",
                          letterSpacing: "1px"
                        }}>
                          PUNTOS
                        </th>
                        <th style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom: "2px solid #39ff6a66",
                          color: "#39ff6a",
                          fontWeight: "700",
                          fontSize: "0.9rem",
                          letterSpacing: "1px"
                        }}>
                          DESCRIPCIÓN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { tipo: "Sin Acierto", puntos: 0, desc: "Pronóstico incorrecto" },
                        { tipo: "Resultado Correcto", puntos: 3, desc: "Ganador o clasificado correcto" },
                        { tipo: "Empate Correcto", puntos: 5, desc: "Empate acertado sin importar goles" },
                        { tipo: "Ganador + Diferencia", puntos: 7, desc: "Ganador y diferencia de goles exacta" },
                        { tipo: "Empate Exacto", puntos: 7, desc: "Empate acertado con marcador exacto" },
                        { tipo: "Marcador Exacto", puntos: 10, desc: "Resultado completamente correcto 🏆" }
                      ].map((fila, idx) => (
                        <tr key={idx} style={{
                          borderBottom: "1px solid #ffffff11"
                        }}>
                          <td style={{
                            padding: "14px 12px",
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "0.95rem"
                          }}>
                            {fila.tipo}
                          </td>
                          <td style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#39ff6a",
                            fontWeight: "900",
                            fontSize: "1.1rem",
                            textShadow: "0 0 8px #39ff6a55"
                          }}>
                            {fila.puntos}
                          </td>
                          <td style={{
                            padding: "14px 12px",
                            color: "#ffffff88",
                            fontSize: "0.9rem"
                          }}>
                            {fila.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECCIÓN: EJEMPLOS PRÁCTICOS */}
              <div style={{
                background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                border: "1px solid #39ff6a33",
                borderRadius: "12px",
                padding: "30px",
                marginTop: "30px"
              }}>
                <h3 style={{
                  color: "#39ff6a",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}>
                  💡 Ejemplos Prácticos
                </h3>

                <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  
                  {/* Ejemplo 1 */}
                  <div style={{
                    background: "#17212B",
                    border: "1px solid #ffffff11",
                    borderRadius: "8px",
                    padding: "16px",
                    borderLeft: "4px solid #4a9eff"
                  }}>
                    <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "0.95rem", marginBottom: "8px" }}>
                      📌 <strong>Ejemplo 1:</strong> Resultado Correcto (3 pts)
                    </p>
                    <p style={{ color: "#ffffff88", fontSize: "0.85rem", lineHeight: "1.5", margin: "0" }}>
                      <strong>Partido:</strong> México 2 - 1 Sudáfrica<br/>
                      <strong>Tu pronóstico:</strong> México gana (cualquier marcador)<br/>
                      <strong>Puntos:</strong> 3 ✅
                    </p>
                  </div>

                  {/* Ejemplo 2 */}
                  <div style={{
                    background: "#17212B",
                    border: "1px solid #ffffff11",
                    borderRadius: "8px",
                    padding: "16px",
                    borderLeft: "4px solid #ffd700"
                  }}>
                    <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "0.95rem", marginBottom: "8px" }}>
                      📌 <strong>Ejemplo 2:</strong> Empate Correcto (5 pts)
                    </p>
                    <p style={{ color: "#ffffff88", fontSize: "0.85rem", lineHeight: "1.5", margin: "0" }}>
                      <strong>Partido:</strong> Brasil 1 - 1 Haití<br/>
                      <strong>Tu pronóstico:</strong> Empate (2-2, 3-3, etc.)<br/>
                      <strong>Puntos:</strong> 5 ✅
                    </p>
                  </div>

                  {/* Ejemplo 3 */}
                  <div style={{
                    background: "#17212B",
                    border: "1px solid #ffffff11",
                    borderRadius: "8px",
                    padding: "16px",
                    borderLeft: "4px solid #39ff6a"
                  }}>
                    <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "0.95rem", marginBottom: "8px" }}>
                      📌 <strong>Ejemplo 3:</strong> Marcador Exacto (10 pts)
                    </p>
                    <p style={{ color: "#ffffff88", fontSize: "0.85rem", lineHeight: "1.5", margin: "0" }}>
                      <strong>Partido:</strong> Alemania 3 - 1 Curaçao<br/>
                      <strong>Tu pronóstico:</strong> Alemania 3 - 1 Curaçao<br/>
                      <strong>Puntos:</strong> 10 🏆
                    </p>
                  </div>

                </div>
              </div>

              {/* SECCIÓN: PREGUNTAS FRECUENTES */}
              <div style={{
                background: "linear-gradient(135deg, #1e2d3d 0%, #17212B 100%)",
                border: "1px solid #39ff6a33",
                borderRadius: "12px",
                padding: "30px",
                marginTop: "30px"
              }}>
                <h3 style={{
                  color: "#39ff6a",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  marginBottom: "24px",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}>
                  ❓ Preguntas Frecuentes
                </h3>

                <div style={{ display: "grid", gap: "16px" }}>
                  
                  {[
                    {
                      pregunta: "¿Qué pasa si un partido va a penales?",
                      respuesta: "Los penales NO cuentan para tu pronóstico. Solo se toma en cuenta el resultado después de los 90' + tiempo extra."
                    },
                    {
                      pregunta: "¿Cuándo se cierra el plazo para pronosticar?",
                      respuesta: "Las predicciones se cierran 5 MINS ANTES de que comience cada partido. Una vez terminado este tiempo, no puedes cambiar tu pronóstico."
                    },
                    {
                      pregunta: "¿Cómo se actualiza el ranking?",
                      respuesta: "El ranking se actualiza en tiempo real conforme finaliza cada partido. Los puntos se suman automáticamente cuando se ingresa el resultado oficial."
                    },
                    {
                      pregunta: "¿Puedo cambiar mis pronósticos?",
                      respuesta: "Sí, puedes cambiar tus pronósticos siempre y cuando este en el tiempo permitido. Una vez falten 5 mins para el inicio del partido, tu pronóstico queda bloqueado."
                    },
                    {
                      pregunta: "¿Qué pasa si hay empate de puntos en el primer lugar?",
                      respuesta: "Si hay múltiples ganadores con la misma puntuación, el premio total se divide equitativamente entre todos."
                    }
                  ].map((faq, idx) => (
                    <div key={idx} style={{
                      background: "#17212B",
                      border: "1px solid #ffffff11",
                      borderRadius: "8px",
                      padding: "16px"
                    }}>
                      <p style={{
                        color: "#39ff6a",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        marginBottom: "8px",
                        margin: "0 0 8px 0"
                      }}>
                        {faq.pregunta}
                      </p>
                      <p style={{
                        color: "#ffffff88",
                        fontSize: "0.9rem",
                        lineHeight: "1.6",
                        margin: "0"
                      }}>
                        {faq.respuesta}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* NOTA FINAL */}
              <div style={{
                background: "#17212B",
                border: "1px solid #39ff6a22",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "30px",
                textAlign: "center"
              }}>
                <p style={{
                  color: "#ffffff66",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  fontWeight: "500"
                }}>
                  💡 <strong>Recuerda:</strong> Los puntos se suman progresivamente. ¡Buena suerte y que gane el mejor! 🎯
                </p>
              </div>

            </div>
          )}

          {tab === "tabla" && (
            <>
              <p className="grupo-titulo">🏆 Tabla de Posiciones</p>
              {tabla.length > 0 && (
                <div style={{ background: "linear-gradient(145deg, #1e2d3d, #17212B)", border: "1px solid #ffd70033", borderRadius: "14px", padding: "20px 16px", marginBottom: "28px", textAlign: "center", boxShadow: "0 0 30px #ffd70011" }}>
                  <p style={{ color: "#ffffff66", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "1px", marginBottom: "8px" }}>💰 PREMIO TOTAL</p>
                  <p style={{ color: "#ffd700", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: "900", letterSpacing: "1px", textShadow: "0 0 20px #ffd70088", marginBottom: "6px" }}>$ {(tabla.length * 10000).toLocaleString("es-CO")} COP</p>
                  <p style={{ color: "#ffffff44", fontSize: "0.75rem", marginBottom: "12px" }}>{tabla.length} participante{tabla.length !== 1 ? "s" : ""} × $10.000 COP</p>
                  <div style={{ background: "#ffd70011", border: "1px solid #ffd70033", borderRadius: "6px", padding: "8px 12px", display: "inline-block" }}>
                    <p style={{ color: "#ffd700", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.5px", margin: "0" }}>🏆 El que más aciertos se lleva todo</p>
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

          {tab === "tabla-fase-final" && (
            <>
              <p className="grupo-titulo">🏆 Tabla Fase Final</p>
              {tablaFaseFinal.length > 0 && (
                <div style={{ background: "linear-gradient(145deg, #1e2d3d, #17212B)", border: "1px solid #ffd70033", borderRadius: "14px", padding: "20px 16px", marginBottom: "28px", textAlign: "center", boxShadow: "0 0 30px #ffd70011" }}>
                  <p style={{ color: "#ffffff66", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "1px", marginBottom: "8px" }}>💰 PREMIO TOTAL (FASE FINAL)</p>
                  <p style={{ color: "#ffd700", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: "900", letterSpacing: "1px", textShadow: "0 0 20px #ffd70088", marginBottom: "6px" }}>$ {(tablaFaseFinal.length * 20000 + 20000).toLocaleString("es-CO")} COP</p>
                  <p style={{ color: "#ffffff44", fontSize: "0.75rem", marginBottom: "12px" }}>{tablaFaseFinal.length} participante{tablaFaseFinal.length !== 1 ? "s" : ""} × $20.000 COP + $20.000 COP Bonus</p>
                  <div style={{ background: "#ffd70011", border: "1px solid #ffd70033", borderRadius: "6px", padding: "8px 12px", display: "inline-block" }}>
                    <p style={{ color: "#ffd700", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.5px", margin: "0" }}>🏆 El que más aciertos tenga en fase final se lleva todo</p>
                  </div>
                </div>
              )}
              {tablaFaseFinal.length === 0 ? (
                <p style={{ color: "#ffffff44", textAlign: "center", marginTop: "40px" }}>Aún no hay participantes con pronósticos de fase final.</p>
              ) : (
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>#</th><th>PARTICIPANTE</th><th>PRONÓSTICOS</th><th>PUNTOS</th>
                      {torneoFinalizado() && <th>DETALLE</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tablaFaseFinal.map((fila, i) => (
                      <tr key={fila.uid} className={i === 0 ? "posicion-1" : i === 1 ? "posicion-2" : i === 2 ? "posicion-3" : ""}>
                        <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                        <td>{fila.nombre}</td>
                        <td>{fila.enviado ? "✅ Enviados" : "⏳ Pendiente"}</td>
                        <td><span className="badge-puntos">{fila.puntos} pts</span></td>
                        {torneoFinalizado() && <td><button className="btn-detalle" onClick={() => abrirModalFaseFinal(fila)}>👁️ Ver</button></td>}
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

              {tabla.length > 1 && (
                <>
                  <p className="grupo-titulo" style={{ marginTop: "40px" }}>🔥 Mis Pronósticos</p>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tabla" style={{ minWidth: "800px" }}>
                      <thead>
                        <tr>
                          <th>FECHA</th>
                          <th>PARTIDO</th>
                          <th style={{ textAlign: "center" }}>MI PRONÓSTICO</th>
                          <th style={{ textAlign: "center" }}>RESULTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPartidos.map(partido => {
                          const tuPron = pronosticos[partido.id]
                          const oficial = resultados[partido.id]
                          const tuAcierto = tuPron && oficial && tuPron === oficial
                          return (
                            <tr key={partido.id}>
                              <td style={{ color: "#ffffff66", fontSize: "0.85rem", minWidth: "90px" }}>{partido.fecha}</td>
                              <td style={{ minWidth: "250px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <img loading="lazy" src={`https://flagcdn.com/w20/${partido.flagLocal}.png`} alt="" style={{ borderRadius: "2px" }} />
                                  <span style={{ fontSize: "0.85rem", color: "#ffffff88" }}>{partido.local}</span>
                                  <span style={{ fontSize: "0.75rem", color: "#ffffff44" }}>vs</span>
                                  <span style={{ fontSize: "0.85rem", color: "#ffffff88" }}>{partido.visitante}</span>
                                  <img loading="lazy" src={`https://flagcdn.com/w20/${partido.flagVisitante}.png`} alt="" style={{ borderRadius: "2px" }} />
                                </div>
                              </td>
                              <td style={{ textAlign: "center", color: tuPron ? "#39ff6a" : "#ffffff33", fontWeight: "600" }}>
                                {tuPron ? (tuPron === "empate" ? "EMPATE" : `GANA ${tuPron === "local" ? partido.local.toUpperCase() : partido.visitante.toUpperCase()}`) : "—"}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "700" }}>
                                {!tuPron ? "—" : !oficial ? "⏳" : tuAcierto ? <span style={{ color: "#39ff6a" }}>✅</span> : <span style={{ color: "#ff6b6b" }}>❌</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "admin" && isAdmin && (
            <>
              <div style={{ display: "flex", gap: "0", marginBottom: "30px", borderBottom: "1px solid #ffd70022" }}>
                <button onClick={() => setAdminTab("resultados")} style={{ padding: "12px 28px", background: "transparent", border: "none", borderBottom: adminTab === "resultados" ? "2px solid #ffd700" : "2px solid transparent", color: adminTab === "resultados" ? "#ffd700" : "#ffffff44", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px", cursor: "pointer", transition: "all 0.25s" }}>📋 RESULTADOS</button>
                <button onClick={() => setAdminTab("resultados-r32")} style={{ padding: "12px 28px", background: "transparent", border: "none", borderBottom: adminTab === "resultados-r32" ? "2px solid #ffd700" : "2px solid transparent", color: adminTab === "resultados-r32" ? "#ffd700" : "#ffffff44", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px", cursor: "pointer", transition: "all 0.25s" }}>🏅 RESULTADOS R32</button>
                <button onClick={() => setAdminTab("resultados-r16")} style={{ padding: "12px 28px", background: "transparent", border: "none", borderBottom: adminTab === "resultados-r16" ? "2px solid #ffd700" : "2px solid transparent", color: adminTab === "resultados-r16" ? "#ffd700" : "#ffffff44", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px", cursor: "pointer", transition: "all 0.25s" }}>🏆 RESULTADOS R16</button>
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
              {adminTab === "resultados-r32" && (
                <>
                  <p className="admin-titulo">🏅 Dieciseisavos — Resultados Reales</p>
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ color: "#ffd700", fontWeight: "700", marginBottom: "12px" }}>Ingresa los marcadores de los dieciseisavos:</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                      {PARTIDOS_R32.map(partido => (
                        <div key={partido.id} style={{ background: "#17212B", border: "1px solid #ffd70033", borderRadius: "8px", padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                              <img loading="lazy" src={`https://flagcdn.com/w40/${partido.flagLocal}.png`} alt="" style={{ borderRadius: "3px", width: "30px", height: "20px" }} onError={(e) => e.target.style.display = "none"} />
                              <span style={{ color: "#ffffff88", fontSize: "0.85rem", fontWeight: "600" }}>{partido.local}</span>
                            </div>
                            <span style={{ color: "#ffd700", fontSize: "0.75rem" }}>vs</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
                              <span style={{ color: "#ffffff88", fontSize: "0.85rem", fontWeight: "600" }}>{partido.visitante}</span>
                              <img loading="lazy" src={`https://flagcdn.com/w40/${partido.flagVisitante}.png`} alt="" style={{ borderRadius: "3px", width: "30px", height: "20px" }} onError={(e) => e.target.style.display = "none"} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="2"
                              value={marcadoresR32?.[partido.id]?.local ?? ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "")
                                const nuevoLocal = val === "" ? "" : parseInt(val, 10)
                                setMarcadoresR32((prev) => ({
                                  ...prev,
                                  [partido.id]: { ...prev?.[partido.id], local: nuevoLocal },
                                }))
                              }}
                              style={{ width: "50px", height: "50px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#0a1419", border: "2px solid #ffd70044", borderRadius: "6px", color: "#ffd700", outline: "none" }}
                            />
                            <span style={{ color: "#ffd700", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="2"
                              value={marcadoresR32?.[partido.id]?.visitante ?? ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "")
                                const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
                                setMarcadoresR32((prev) => ({
                                  ...prev,
                                  [partido.id]: { ...prev?.[partido.id], visitante: nuevoVisitante },
                                }))
                              }}
                              style={{ width: "50px", height: "50px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#0a1419", border: "2px solid #ffd70044", borderRadius: "6px", color: "#ffd700", outline: "none" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn-guardar" onClick={guardarResultadosR32}>GUARDAR RESULTADOS R32</button>
                  {mensajeR32 && <p className={mensajeR32.startsWith("✅") ? "msg-enviado" : "msg-warning"}>{mensajeR32}</p>}
                </>
              )}
              {adminTab === "resultados-r16" && (
                <>
                  <p className="admin-titulo">🏆 Octavos de Final — Resultados Reales</p>
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ color: "#ffd700", fontWeight: "700", marginBottom: "12px" }}>Ingresa los marcadores de los Octavos de Final:</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                      {PARTIDOS_R16.map(partido => (
                        <div key={partido.id} style={{ background: "#17212B", border: "1px solid #ffd70033", borderRadius: "8px", padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                              <img loading="lazy" src={`https://flagcdn.com/w40/${partido.flagLocal}.png`} alt="" style={{ borderRadius: "3px", width: "30px", height: "20px" }} onError={(e) => e.target.style.display = "none"} />
                              <span style={{ color: "#ffffff88", fontSize: "0.85rem", fontWeight: "600" }}>{partido.local}</span>
                            </div>
                            <span style={{ color: "#ffd700", fontSize: "0.75rem" }}>vs</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
                              <span style={{ color: "#ffffff88", fontSize: "0.85rem", fontWeight: "600" }}>{partido.visitante}</span>
                              <img loading="lazy" src={`https://flagcdn.com/w40/${partido.flagVisitante}.png`} alt="" style={{ borderRadius: "3px", width: "30px", height: "20px" }} onError={(e) => e.target.style.display = "none"} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="2"
                              value={marcadoresR16?.[partido.id]?.local ?? ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "")
                                const nuevoLocal = val === "" ? "" : parseInt(val, 10)
                                setMarcadoresR16((prev) => ({
                                  ...prev,
                                  [partido.id]: { ...prev?.[partido.id], local: nuevoLocal },
                                }))
                              }}
                              style={{ width: "50px", height: "50px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#0a1419", border: "2px solid #ffd70044", borderRadius: "6px", color: "#ffd700", outline: "none" }}
                            />
                            <span style={{ color: "#ffd700", fontSize: "1.5rem", fontWeight: "900" }}>-</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="2"
                              value={marcadoresR16?.[partido.id]?.visitante ?? ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "")
                                const nuevoVisitante = val === "" ? "" : parseInt(val, 10)
                                setMarcadoresR16((prev) => ({
                                  ...prev,
                                  [partido.id]: { ...prev?.[partido.id], visitante: nuevoVisitante },
                                }))
                              }}
                              style={{ width: "50px", height: "50px", textAlign: "center", fontSize: "1.5rem", fontWeight: "900", background: "#0a1419", border: "2px solid #ffd70044", borderRadius: "6px", color: "#ffd700", outline: "none" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn-guardar" onClick={guardarResultadosR16}>GUARDAR RESULTADOS R16</button>
                  {mensajeR16 && <p className={mensajeR16.startsWith("✅") ? "msg-enviado" : "msg-warning"}>{mensajeR16}</p>}
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
                        <img loading="lazy" src={`https://flagcdn.com/w20/${partido.flagLocal}.png`} alt="" style={{ borderRadius: "2px" }} />
                        <span className="modal-partido-nombre">{partido.local} vs {partido.visitante}</span>
                        <img loading="lazy" src={`https://flagcdn.com/w20/${partido.flagVisitante}.png`} alt="" style={{ borderRadius: "2px" }} />
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

        {modalUsuarioFaseFinal && torneoFinalizado() && (
          <div className="modal-overlay" onClick={() => setModalUsuarioFaseFinal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "900px" }}>
              <div className="modal-header">
                <span className="modal-titulo">👤 Pronósticos Fase Final - {modalUsuarioFaseFinal.nombre}</span>
                <button className="modal-cerrar" onClick={() => setModalUsuarioFaseFinal(null)}>✕</button>
              </div>
              <div className="modal-grupos">
                <button className={`modal-grupo-tab ${modalFaseFinalEtapa === "R32" ? "activo" : ""}`} onClick={() => setModalFaseFinalEtapa("R32")}>🏁 DIECISEISAVOS (R32)</button>
                <button className={`modal-grupo-tab ${modalFaseFinalEtapa === "R16" ? "activo" : ""}`} onClick={() => setModalFaseFinalEtapa("R16")}>⚽ OCTAVOS (R16)</button>
              </div>
              <div style={{ padding: "20px 28px", overflow: "auto", maxHeight: "60vh" }}>
                <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <button onClick={() => exportarPDF(modalUsuarioFaseFinal)} style={{ padding: "8px 16px", background: "#ffd700", color: "#17212B", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>📄 Descargar PDF</button>
                </div>
                <table className="tabla" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>PARTIDO</th><th>MI PRONÓSTICO</th><th>RESULTADO</th><th>ESTADO</th><th>PUNTOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(modalFaseFinalEtapa === "R32" ? PARTIDOS_R32 : PARTIDOS_R16).map(partido => {
                      const pick = modalFaseFinalEtapa === "R32" ? modalUsuarioFaseFinal.picks?.[partido.id] : picksFaseFinalR16?.[partido.id]
                      const marcador = modalFaseFinalEtapa === "R32" ? marcadorFaseFinal[partido.id] : marcadorFaseFinalR16[partido.id]
                      const puntos = calcularPuntosR32(pick, marcador)
                      return (
                        <tr key={partido.id}>
                          <td style={{ color: "#ffffff88" }}>{partido.local} vs {partido.visitante}</td>
                          <td style={{ color: pick ? "#39ff6a" : "#ffffff33" }}>
                            {pick && pick.local !== "" && pick.visitante !== "" ? `${pick.local}-${pick.visitante}` : "Sin pronóstico"}
                          </td>
                          <td style={{ color: marcador ? "#ffd700" : "#ffffff33" }}>
                            {!marcador ? "⏳" : `${marcador.local ?? "-"}-${marcador.visitante ?? "-"}`}
                          </td>
                          <td>{!pick ? "—" : !marcador ? "⏳" : puntos > 0 ? "✅" : "❌"}</td>
                          <td style={{ color: puntos === 10 ? "#ffd700" : puntos === 7 ? "#39ff6a" : puntos === 5 ? "#00aaff" : puntos === 3 ? "#ffffff88" : "#ff6b6b", fontWeight: "700" }}>
                            {puntos} pts
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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