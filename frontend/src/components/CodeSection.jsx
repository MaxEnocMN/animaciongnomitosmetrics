import { useState, useEffect, useRef } from "react";

/* ==== FUNCIÓN DE DECODIFICACIÓN ==== */
function decodeBase64OrPlain(text) {
  // Si es claramente HTML, no intentar decodificar como base64
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return text;
  }
  
  const cleaned = text
    .replace(/\s/g, "")
    .replace(/^["'`]/, "")
    .replace(/["'`]$/, "");

  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  const isBase64 = base64Pattern.test(cleaned);

  if (!isBase64) return text;

  let padded = cleaned;
  const missing = padded.length % 4;
  if (missing) padded += "=".repeat(4 - missing);

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return text;
  }
}

/* ==== COMENTARIOS DE RESGUARDO ==== */
const fallbackCodes = {
  "Animation about anxiety at work - Game 1 (Large Code)": `// NOTA: El código completo está disponible en IPFS
// Este es un juego interactivo sobre ansiedad laboral
// Incluye personajes animados, partículas y efectos especiales

// Create a temporary canvas
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// [... más de 800 líneas de código ...]`,

  "Animation about anxiety at work - Version 2 (800+ lines)": `// NOTA: El código completo está disponible en IPFS  
// Versión 2 del juego con rayos Tesla y efectos mejorados
// Incluye MiniGnomitos con texto personalizable

// Create a temporary canvas
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// [... más de 800 líneas de código ...]`,
};

/* ==== COMPONENTE PRINCIPAL ==== */
export default function CodeSection({
  title,
  code = "",
  ipfsUrl = "",
  onCopy = () => {}, // Valor por defecto para evitar errores si no se pasa
  messageId,
  textareaId,
}) {
  // Inicialización más robusta del contenido
  const getInitialContent = () => {
    if (code) return code;
    if (fallbackCodes[title]) return fallbackCodes[title];
    return "// Cargando código...";
  };

  const [codeContent, setCodeContent] = useState(getInitialContent());
  const [lineCount, setLineCount] = useState(() => getInitialContent().split("\n").length);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [copyStatus, setCopyStatus] = useState("idle");
  const textareaRef = useRef(null);

  /* ---------- Utilidades ---------- */
  const updateLineCount = (txt) => setLineCount(txt.split("\n").length);

  const copyToClipboard = async () => {
    console.log(`📋 Iniciando copia para: ${title} (textareaId: ${textareaId})`);
    setCopyStatus("copying");
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeContent);
        console.log('✅ Copia exitosa con navigator.clipboard');
        setCopyStatus("success");
        console.log('🔄 Llamando onCopy...');
        onCopy(); // Llama a onCopy (será handleCopy para textarea 2 y 3)
        setTimeout(() => setCopyStatus("idle"), 2000);
        return;
      }
      
      console.log('⚠️ navigator.clipboard no disponible, intentando execCommand...');
      const textArea = document.createElement("textarea");
      textArea.value = codeContent;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('✅ Copia exitosa con execCommand');
        setCopyStatus("success");
        console.log('🔄 Llamando onCopy...');
        onCopy(); // Llama a onCopy
        setTimeout(() => setCopyStatus("idle"), 2000);
      } else {
        throw new Error("execCommand failed");
      }
      
    } catch (error) {
      console.error("❌ Copy failed:", error.message);
      setCopyStatus("error");
      
      if (textareaRef.current) {
        try {
          console.log('⚠️ Intentando copia fallback con textareaRef...');
          textareaRef.current.select();
          document.execCommand('copy');
          console.log('✅ Copia fallback exitosa');
          setCopyStatus("success");
          console.log('🔄 Llamando onCopy en fallback...');
          onCopy(); // Llama a onCopy
        } catch (fallbackError) {
          console.error("❌ All copy methods failed:", fallbackError.message);
          alert(
            "No se pudo copiar automáticamente. Por favor:\n" +
            "1. Selecciona todo el texto manualmente (Ctrl+A)\n" +
            "2. Copia con Ctrl+C (o Cmd+C en Mac)"
          );
        }
      }
      
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  const handleInput = (e) => {
    const txt = e.target.value;
    setCodeContent(txt);
    updateLineCount(txt);
  };

  /* ---------- Carga desde IPFS ---------- */
  const loadFromIpfs = async (url) => {
    if (!url) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    // Extraer el hash de la URL de IPFS
    const hashMatch = url.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|B[A-Z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48}|F[0-9A-Za-z]{50})/);
    const hash = hashMatch ? hashMatch[0] : null;

    if (!hash) {
      setLoadError("URL de IPFS no válida");
      setIsLoading(false);
      return;
    }

    const gateways = [
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://${hash}.ipfs.dweb.link/`,
      `https://ipfs.infura.io/ipfs/${hash}`,
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          headers: {
            'Accept': 'text/plain',
          },
        });
        
        if (!response.ok) continue;
        
        const content = await response.text();
        
        // Si recibimos HTML en lugar del código esperado
        if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
          continue; // Intentar con el siguiente gateway
        }
        
        const decoded = decodeBase64OrPlain(content);
        setCodeContent(decoded);
        updateLineCount(decoded);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(`Error loading from ${gateway}:`, error);
        continue;
      }
    }
    
    // Si todos los gateways fallan
    setLoadError(
      "No se pudo cargar desde IPFS. Intenta copiar el URL manualmente en tu navegador."
    );
    setIsLoading(false);
  };

  /* ---------- Efectos ---------- */
  useEffect(() => {
    // Solo cargar desde IPFS si hay una URL y no hay código directo
    if (ipfsUrl && !code) {
      loadFromIpfs(ipfsUrl);
    } else {
      // Usar el contenido inicial ya establecido
      const content = getInitialContent();
      setCodeContent(content);
      updateLineCount(content);
    }
  }, [ipfsUrl, code, title]);

  // Efecto separado para sincronizar el textarea cuando cambia el contenido
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== codeContent) {
      textareaRef.current.value = codeContent;
    }
  }, [codeContent]);

  /* ---------- IDs seguros ---------- */
  const safeMsgId = messageId ?? `msg-${title.replace(/\s+/g, "-")}`;
  const safeTaId = textareaId ?? `ta-${title.replace(/\s+/g, "-")}`;

  const getButtonContent = () => {
    switch (copyStatus) {
      case "copying":
        return { text: "Copying...", color: "#0969da" };
      case "success":
        return { text: "Copied!", color: "#238636" };
      case "error":
        return { text: "Failed", color: "#da3633" };
      default:
        return { text: "Copy", color: "#238636" };
    }
  };

  const buttonContent = getButtonContent();

  /* ---------- Render ---------- */
  return (
    <div className="code-section" style={{ margin: "20px 0" }}>
      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px"
        }}
      >
        <h3 style={{ margin: 0, color: "#e6edf3" }}>{title}</h3>
        <button
          onClick={copyToClipboard}
          disabled={copyStatus === "copying"}
          style={{
            cursor: copyStatus === "copying" ? "not-allowed" : "pointer",
            background: buttonContent.color,
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            opacity: copyStatus === "copying" ? 0.7 : 1,
          }}
        >
          {buttonContent.text}
        </button>
      </div>

      {/* Estado de carga y errores */}
      {isLoading && (
        <div
          style={{
            background: "#0969da20",
            border: "1px solid #0969da",
            borderRadius: "4px",
            padding: "10px",
            margin: "10px 0",
            color: "#0969da",
          }}
        >
          🔄 Cargando desde IPFS...
        </div>
      )}
      
      {loadError && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "4px",
            padding: "10px",
            margin: "10px 0",
            color: "#856404",
          }}
        >
          <strong>⚠ Aviso:</strong> {loadError}
        </div>
      )}

      {/* Área de código */}
      <div className="code-content">
        <textarea
          id={safeTaId}
          ref={textareaRef}
          defaultValue={codeContent}
          onChange={handleInput}
          placeholder="Cargando código..."
          style={{
            width: "100%",
            minHeight: "300px",
            maxHeight: "500px",
            background: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "6px",
            color: "#e6edf3",
            fontFamily: "'Courier New', monospace",
            fontSize: "14px",
            padding: "15px",
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = "#238636"}
          onBlur={(e) => e.target.style.borderColor = "#30363d"}
        />
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "12px",
            color: "#7d8590"
          }}
        >
          <span>
            📝 Lines: <strong style={{ color: "#e6edf3" }}>{lineCount}</strong>
          </span>
          <span>
            📄 Characters: <strong style={{ color: "#e6edf3" }}>{codeContent.length}</strong>
          </span>
          {ipfsUrl && (
            <span>
              🌐 Source: <span style={{ color: "#0969da" }}>IPFS</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}