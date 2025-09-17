import { useState } from "react";
import Modal from "./Modal";

function Gallery({ images }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showImage = (idx) => {
    setCurrentIdx(idx);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="gallery-container">
      <h2 className="gallery-header">
        Click on any image to see details and zoom
      </h2>

      {/* Miniaturas */}
      <div className="image-gallery">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`gallery-item ${idx === currentIdx ? "active" : ""}`}
            onClick={() => showImage(idx)}
          >
            <img
              src={img}
              alt={`Step ${idx + 1}`}
              className="gallery-thumbnail"
            />
          </div>
        ))}
      </div>

      {/* Imagen principal (clic → modal) */}
      <div className="main-display">
        <img
          id="mainDisplayImage"
          src={images[currentIdx]}
          alt="Selected Step"
          onClick={openModal}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* Modal (solo se muestra cuando está abierto) */}
      {isModalOpen && (
        <Modal
          images={images}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          closeModal={closeModal}
        />
      )}
    </div>
  );
}

export default Gallery;