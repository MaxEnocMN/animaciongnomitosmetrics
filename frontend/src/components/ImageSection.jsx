function ImageSection({ src, alt }) {
    return (
        <div className="image-section">
            <img src={src} alt={alt} className="main-image" />
        </div>
    );
}

export default ImageSection;