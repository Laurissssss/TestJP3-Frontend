import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const TIEMPO_POR_PREGUNTA = 15;

function App() {
  const [pantallaActual, setPantallaActual] = useState('inicio');
  const [categorias, setCategorias] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [esperando, setEsperando] = useState(false);
  
  // Estados para el temporizador
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_POR_PREGUNTA);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);

  // Cargar categorías
  useEffect(() => {
    if (pantallaActual === 'categorias' && categorias.length === 0) {
      axios.get('http://localhost:8000/api/categorias/')
        .then(res => setCategorias(res.data))
        .catch(err => console.error('Error cargando categorías:', err));
    }
  }, [pantallaActual, categorias.length]);

  // Temporizador (Intervalo)
  useEffect(() => {
    let interval = null;
    if (pantallaActual === 'trivia' && !esperando) {
      interval = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pantallaActual, esperando]);

  // Manejar cuando el tiempo llega a 0
  useEffect(() => {
    if (tiempoRestante === 0 && !esperando && pantallaActual === 'trivia') {
      manejarTiempoAgotado();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante, esperando, pantallaActual]);



  const seleccionarCategoria = (idCategoria) => {
    axios.get(`http://localhost:8000/api/preguntas/${idCategoria}/`)
      .then(res => {
        setPreguntas(res.data);
        setIndicePregunta(0);
        setPuntaje(0);
        setRespuestaSeleccionada(null);
        setEsperando(false);
        setTiempoRestante(TIEMPO_POR_PREGUNTA);
        setTiempoAgotado(false);
        if (res.data.length > 0) {
          setPantallaActual('trivia');
        } else {
          alert("Esta categoría aún no tiene preguntas.");
        }
      })
      .catch(err => console.error('Error cargando preguntas:', err));
  };

  const avanzarSiguiente = () => {
    setRespuestaSeleccionada(null);
    setTiempoAgotado(false);
    setEsperando(false);
    setTiempoRestante(TIEMPO_POR_PREGUNTA);
    
    if (indicePregunta + 1 < preguntas.length) {
      setIndicePregunta(prev => prev + 1);
    } else {
      setPantallaActual('resultados');
    }
  };

  const manejarTiempoAgotado = () => {
    setEsperando(true);
    setTiempoAgotado(true);
    // Avanzar a la siguiente después de 2 segundos
    setTimeout(avanzarSiguiente, 2000);
  };

  const manejarRespuesta = (respuesta) => {
    if (esperando) return;
    
    setEsperando(true);
    setRespuestaSeleccionada(respuesta.id);

    if (respuesta.es_correcta) {
      setPuntaje(prev => prev + 100);
    }

    setTimeout(avanzarSiguiente, 2000);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }
  };

  const preguntaActual = preguntas[indicePregunta];
  const opciones = preguntaActual ? (preguntaActual.respuestas || preguntaActual.opciones || []) : [];

  // Lógica de colores para el temporizador
  let colorTiempo = "#00ff00"; // Verde por defecto (15-10s)
  if (tiempoRestante < 5) colorTiempo = "#ff0000"; // Rojo parpadeante (4-0s)
  else if (tiempoRestante < 10) colorTiempo = "#ffff00"; // Amarillo cálido (9-5s)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden relative">
      
      {/* Encabezado Flotante Global de la Marca */}
      <motion.div
        animate={{
          filter: [
            "drop-shadow(0px 0px 8px rgba(0,255,255,0.8))",
            "drop-shadow(0px 0px 20px rgba(255,0,255,0.8))",
            "drop-shadow(0px 0px 8px rgba(0,255,255,0.8))"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 left-6 md:top-8 md:left-10 z-50 select-none"
      >
        <h1 className="text-3xl md:text-4xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink">
          TestJP3
        </h1>
      </motion.div>

      <AnimatePresence mode="wait">
        
        {pantallaActual === 'inicio' && (
          <motion.div
            key="inicio"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card p-10 max-w-lg w-full text-center flex flex-col items-center gap-8"
          >
            <motion.h1 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-orange drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] text-center"
            >
              ¡Desafío Trivia!
            </motion.h1>
            <p className="text-xl text-gray-200">¡Demuestra cuánto sabes en este desafío vibrante!</p>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgb(0, 255, 255)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPantallaActual('categorias')}
              className="mt-4 px-10 py-4 bg-neon-cyan text-gray-900 font-bold text-2xl rounded-full shadow-[0_0_15px_rgba(0,255,255,0.6)] cursor-pointer"
            >
              ¡Jugar Ahora!
            </motion.button>
          </motion.div>
        )}

        {pantallaActual === 'categorias' && (
          <motion.div
            key="categorias"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card p-10 max-w-3xl w-full text-center flex flex-col items-center gap-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan drop-shadow-[0_0_15px_rgba(0,255,0,0.8)]">
              Elige una Categoría
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
              {categorias.length === 0 ? (
                <div className="col-span-full text-white text-xl animate-pulse">Cargando categorías...</div>
              ) : (
                categorias.map(cat => (
                  <motion.div
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => seleccionarCategoria(cat.id)}
                    className="glass-card p-6 border-neon-cyan border-2 cursor-pointer transition-all shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
                  >
                    <h3 className="text-2xl font-bold text-white capitalize">{cat.nombre || cat.titulo}</h3>
                    {cat.descripcion && <p className="text-gray-300 mt-2 text-sm">{cat.descripcion}</p>}
                  </motion.div>
                ))
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgb(255, 0, 255)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPantallaActual('inicio')}
              className="mt-6 px-8 py-3 bg-neon-pink text-white font-bold text-xl rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] cursor-pointer"
            >
              Volver
            </motion.button>
          </motion.div>
        )}

        {pantallaActual === 'trivia' && preguntaActual && (
          <motion.div
            key="trivia"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card p-10 max-w-4xl w-full text-center flex flex-col items-center gap-6"
          >
            {/* Indicadores: Progreso general */}
            <div className="w-full flex justify-between text-sm text-gray-300 uppercase font-bold tracking-widest">
              <span>Pregunta {indicePregunta + 1} / {preguntas.length}</span>
              <span className="text-neon-yellow">Puntaje: {puntaje}</span>
            </div>

            {/* Temporizador */}
            <div className="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative border border-gray-600">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${tiempoRestante < 5 ? 'animate-pulse' : ''}`}
                style={{ 
                  width: `${(tiempoRestante / TIEMPO_POR_PREGUNTA) * 100}%`,
                  backgroundColor: colorTiempo,
                  boxShadow: `0 0 15px ${colorTiempo}`
                }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-900 drop-shadow-sm text-sm">
                {tiempoRestante}s
              </span>
            </div>

            {tiempoAgotado && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"
              >
                ¡TIEMPO AGOTADO!
              </motion.div>
            )}
            
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md py-2">
              {preguntaActual.texto || preguntaActual.contenido}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
              {opciones.map((opt) => {
                let bgColor = "rgba(255,255,255,0.1)";
                let borderColor = "transparent";
                
                // Mostrar correcta si se agotó el tiempo
                if (tiempoAgotado && opt.es_correcta) {
                  bgColor = "rgba(0,255,0,0.5)";
                  borderColor = "#00ff00";
                } 
                // O si el usuario seleccionó una respuesta manualmente
                else if (respuestaSeleccionada !== null) {
                  if (opt.es_correcta) {
                    bgColor = "rgba(0,255,0,0.5)";
                    borderColor = "#00ff00";
                  } else if (respuestaSeleccionada === opt.id) {
                    bgColor = "rgba(255,0,0,0.5)";
                    borderColor = "#ff0000";
                  }
                }

                return (
                  <motion.button
                    key={opt.id}
                    whileHover={esperando ? {} : { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    whileTap={esperando ? {} : { scale: 0.98 }}
                    onClick={() => manejarRespuesta(opt)}
                    style={{ backgroundColor: bgColor, borderColor: borderColor }}
                    className={`glass-card p-5 text-xl font-semibold border-2 transition-colors duration-300 ${!esperando ? 'hover:border-neon-cyan cursor-pointer' : 'cursor-default'}`}
                  >
                    {opt.texto || opt.contenido}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {pantallaActual === 'resultados' && (
          <motion.div
            key="resultados"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card p-10 max-w-lg w-full text-center flex flex-col items-center gap-8 border-neon-yellow border-2"
          >
            <motion.h2 
              initial={{ rotate: -10, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-yellow to-neon-orange drop-shadow-[0_0_20px_rgba(255,255,0,0.8)]"
            >
              ¡Juego Terminado!
            </motion.h2>
            
            <div className="text-3xl font-bold">
              Puntaje Final: <span className="text-neon-yellow drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">{puntaje}</span>
            </div>
            
            <p className="text-lg text-gray-200">
              {puntaje >= (preguntas.length * 100) / 2 ? "¡Excelente trabajo!" : "¡Puedes hacerlo mejor la próxima vez!"}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgb(255, 94, 0)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPantallaActual('inicio')}
              className="mt-6 px-10 py-4 bg-neon-orange text-white font-bold text-2xl rounded-full shadow-[0_0_15px_rgba(255,94,0,0.6)] cursor-pointer"
            >
              Volver a Jugar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
