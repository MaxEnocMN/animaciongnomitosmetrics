# Blog1metrics Backend

Backend seguro para manejar métricas de Firebase del blog con análisis de visitas, códigos copiados e imágenes vistas.

## 🚀 Configuración Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Firebase:

```env
FIREBASE_PROJECT_ID=blog1metrics
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@blog1metrics.iam.gserviceaccount.com
# ... resto de credenciales
```

### 3. Obtener credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `blog1metrics`
3. Ve a **Configuración del proyecto** > **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON y copia los valores al `.env`

### 4. Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📊 API Endpoints

### Registrar evento de analytics
```http
POST /api/v1/analytics
Content-Type: application/json

{
  "type": "page_visit",
  "sessionId": "unique-session-id",
  "country": "Mexico",
  "extra": {}
}
```

### Tipos de eventos soportados:
- `page_visit` - Visita a la página
- `image_view` - Vista de imagen (requiere `extra.imageIndex`)
- `modal_open` - Apertura de modal
- `modal_close` - Cierre de modal  
- `modal_nav` - Navegación en modal
- `code_copy` - Código copiado (requiere `extra.codeVersion`)

### Obtener estadísticas
```http
GET /api/v1/analytics/stats?limit=50&type=code_copy
```

### Obtener resumen
```http
GET /api/v1/analytics/summary
```

### Health check
```http
GET /health
```

## 🔧 Estructura del Proyecto

```
├── server.js              # Servidor principal
├── config/
│   └── firebase-admin.js  # Configuración Firebase Admin
├── routes/
│   └── analytics.js       # Rutas de analytics
├── .env.example           # Plantilla de variables de entorno
└── README.md
```

## 🛡️ Seguridad

- ✅ Credenciales de Firebase en variables de entorno
- ✅ CORS configurado para tu frontend
- ✅ Helmet para headers de seguridad
- ✅ Validación de datos de entrada
- ✅ Rate limiting implícito
- ✅ Logs de seguridad

## 🔗 Integración con Frontend

Tu frontend puede enviar eventos así:

```javascript
// Ejemplo de envío de evento
const trackEvent = async (type, extra = {}) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        sessionId: getSessionId(), // Tu función existente
        country: await getCountry(), // Tu función existente
        extra: extra
      })
    });
    
    const result = await response.json();
    console.log('Evento registrado:', result);
  } catch (error) {
    console.error('Error enviando evento:', error);
  }
};

// Usar en tu código existente
trackEvent('code_copy', { codeVersion: 'MEMN_v1' });
trackEvent('image_view', { imageIndex: 2 });
```

## 📈 Monitoreo

El servidor incluye logs detallados:
- ✅ Eventos registrados con timestamp
- ✅ Errores de Firebase
- ✅ Requests HTTP con Morgan
- ✅ Health checks

## 🚨 Troubleshooting

### Error: "Firebase Admin no inicializado"
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que la private key tenga los saltos de línea correctos

### Error: "Permission denied"
- Verifica que el service account tenga permisos de Firestore
- Confirma que el project ID sea correcto

### Error de CORS
- Actualiza `FRONTEND_URL` en el `.env`
- Verifica que el puerto del frontend coincida