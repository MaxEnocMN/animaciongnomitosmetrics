import { useEffect } from "react";

export default function Modal({ images, currentIdx, setCurrentIdx, closeModal }) {
  const prev = (e) => {
    // e puede ser KeyboardEvent o MouseEvent
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    setCurrentIdx((p) => (p - 1 + images.length) % images.length);
  };
  const next = (e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    setCurrentIdx((p) => (p + 1) % images.length);
  };

  useEffect(() => {
    const handler = (e) => {
      // Si el foco está en un control editable, no interceptamos las teclas
      const tgt = e.target;
      const tag = tgt && tgt.tagName ? tgt.tagName.toLowerCase() : "";
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (tgt && tgt.isContentEditable);

      if (isEditable) return; // <-- PROTECCIÓN: permite escribir en textareas sin que cambien las imágenes

      if (e.key === "ArrowLeft") prev(e);
      else if (e.key === "ArrowRight") next(e);
      else if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "auto";
    };
  }, [closeModal]); // mantengo la dependencia como en tu versión original

  return (
    <div className="modal show" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={images[currentIdx]} alt="ampliada" />

        {/* Botón sigue siendo absoluto en la esquina superior (no lo muevo) */}
        <button className="close-modal-btn" onClick={closeModal} aria-label="Cerrar galería (ESC)">
          ✗
          <span className="tooltip-text">Press the ESC key to exit the gallery.</span>
        </button>

        <button id="navPrev" className="nav-btn" onClick={prev}>←</button>
        <button id="navNext" className="nav-btn" onClick={next}>→</button>
      </div>
    </div>
  );
}