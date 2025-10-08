import { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageSection from './components/ImageSection';
import Gallery from './components/Gallery';
import CodeSection from './components/CodeSection';
import Footer from './components/Footer';
import './assets/styles.css';

// URLs de imágenes (usando ipfs.io como gateway)
const images = [
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso01.png',
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso02.png',
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso03.png',
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso04.png',
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso05.png',
  'https://ipfs.io/ipfs/bafybeibizlxdq6itwbifuhcdaz4co27fzim75dawgsqkns2jwwnsnv325y/paso06.png',
];

// Códigos para los <textarea>
const codeSnippets = {
  'Code to make browser dark theme': `
console.clear();
document.body.style.backgroundColor = '#000000';
document.body.style.margin = '0';
document.body.style.padding = '0';
  `.trim(),
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

// 🔐 Función para ofuscar logs sensibles
const logSafely = (message, data = null) => {
  // COMPLETAMENTE DESHABILITADO para máxima seguridad
  // Si quieres debug, cambia false por import.meta.env.MODE === 'development'
  if (false) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

function App() {
  // Estado para almacenar el país del usuario
  const [userCountry, setUserCountry] = useState('Unknown');
  
  // 🛡️ NUEVO: Estado para rastrear qué textareas ya fueron copiadas (anti-spam)
  const [copiedTextareas, setCopiedTextareas] = useState(new Set());

  // Obtener el país del usuario al cargar la aplicación
  useEffect(() => {
    const fetchCountry = async () => {
      logSafely('🌍 Iniciando solicitud de geolocalización...');
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.status === 'success') {
          logSafely('✅ País obtenido:', data.country);
          setUserCountry(data.country || 'Unknown');
        } else {
          setUserCountry('Unknown');
        }
      } catch (error) {
        setUserCountry('Unknown');
      }
    };

    fetchCountry();
  }, []); // Se ejecuta solo al montar el componente

  // Función handleCopy con logs para depuración + validación anti-spam
  const handleCopy = async (textareaId) => {
    logSafely(`🔥 Iniciando handleCopy para textarea: ${textareaId}, país: ${userCountry}`);
    
    // 🛡️ NUEVO: Verificar si ya se copió esta textarea en esta sesión
    if (copiedTextareas.has(textareaId)) {
      logSafely(`⚠️ Textarea ${textareaId} ya fue copiada anteriormente, saltando registro`);
      return; // Salir sin registrar en Firebase
    }

    try {
      const payload = {
        type: 'code_copy',
        sessionId: 'session-' + Date.now(),
        country: userCountry,
        extra: { textarea: textareaId },
      };
      
      logSafely('📤 Enviando evento...', { textareaId }); // Sin mostrar URL ni payload completo

      const res = await fetch(`${API_BASE_URL}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      });

      logSafely('📥 Respuesta recibida, status:', res.status);
      
      const data = await res.json();
      
      logSafely('✅ Evento registrado exitosamente');
      
      // 🛡️ NUEVO: Marcar esta textarea como ya copiada
      setCopiedTextareas(prev => new Set([...prev, textareaId]));
      
    } catch (err) {
      logSafely('❌ Error al registrar evento:', err.message);
      // En producción, falla silenciosamente sin revelar información
    }
  };

  return (
    <div className="container">
      <Header />
      <ImageSection
        src="https://ipfs.io/ipfs/bafybeifspiezmq4yzm23by7n3vbbxx7nagb66iqrcrbnc5t5kyxekznm5u"
        alt="Creative Evolution Animation"
      />
      <h2 className="section-header">General Idea</h2>
      <ImageSection
        src="https://azure-useful-hippopotamus-376.mypinata.cloud/ipfs/bafybeigxbr6yl35yhlyq6rg2uov5yrjfx3c5gjhgkl2xocg4ggdywqu2ta"
        alt="General Idea Visualization"
      />
      <h2 className="section-header">Step-by-Step Gallery</h2>
      <Gallery images={images} />
      <h2 className="section-header">Browser Setup Code</h2>
      <CodeSection
        title="Code to make browser dark theme"
        code={codeSnippets['Code to make browser dark theme']}
        messageId="msg-dark-theme"
        textareaId="ta-dark-theme"
        onCopy={() => {
          logSafely('🖥️ Copia en textarea 1 (ta-dark-theme) - Sin acción');
        }} // Log para confirmar, pero sin acción
      />
      <h2 className="section-header">Enjoy the Animation - Part 1</h2>
      <CodeSection
        title="Animation about anxiety at work - Game 1 (Large Code)"
        ipfsUrl="https://bafkreigrfzzas7qfwsfwsjkn57skxwvv5ygazcprx2ght6d76peqi6hkiq.ipfs.dweb.link/"
        messageId="msg-game1"
        textareaId="ta-game1"
        onCopy={() => {
          logSafely('🖥️ Llamando onCopy para textarea 2 (ta-game1)');
          handleCopy(2);
        }}
      />
      <h2 className="section-header">Enhanced Version - Part 2</h2>
      <CodeSection
        title="Animation about anxiety at work - Version 2 (800+ lines)"
        ipfsUrl="https://bafkreiewjs5itrkxvy5rcpetzg43jwchuj56lnbg4mnl2zt2tpgn5mfbdq.ipfs.dweb.link/"
        messageId="msg-game2"
        textareaId="ta-game2"
        onCopy={() => {
          logSafely('🖥️ Llamando onCopy para textarea 3 (ta-game2)');
          handleCopy(3);
        }}
      />
      <Footer />
    </div>
  );
}

export default App;