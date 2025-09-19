import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y logs
app.use(helmet());
app.use(morgan('combined'));

// 👇 CORS MANUAL - SOLUCIÓN GARANTIZADA PARA DESARROLLO
app.use((req, res, next) => {
  // Permitir frontend en tu IP local
  const allowedOrigins = ['https://maxenocmn.github.io'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  // Headers obligatorios para CORS
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Max-Age', '86400'); // 24h cache preflight

  // Responder inmediatamente a OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log(`✅ [CORS] Respondiendo a OPTIONS desde ${origin || 'sin origen'}`);
    return res.status(204).end();
  }

  next();
});

// Parsear cuerpo de las peticiones
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuración de Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Inicializar Firebase Admin
let db;
try {
  const firebaseApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  db = getFirestore(firebaseApp);
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error);
  process.exit(1);
}

// Middleware para validar datos requeridos
const validateAnalyticsData = (req, res, next) => {
  const { type, sessionId, country } = req.body;
  
  if (!type || !sessionId || !country) {
    console.log('⚠ Validación fallida:', { type, sessionId, country });
    return res.status(400).json({
      error: 'Faltan campos requeridos: type, sessionId, country'
    });
  }
  
  next();
};

// Rutas de la API

// Health check
app.get('/health', (req, res) => {
  console.log('📡 Recibida solicitud GET /health');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Blog1metrics Backend',
    firebase: 'Connected'
  });
});

// Endpoint para registrar eventos de analytics
app.post('/api/v1/analytics', validateAnalyticsData, async (req, res) => {
  try {
    const { type, sessionId, country, extra = {} } = req.body;
    
    console.log('📥 Recibida solicitud POST /api/v1/analytics:', { type, sessionId, country, extra });
    
    const analyticsData = {
      timestamp: new Date(),
      country: country,
      sessionId: sessionId,
      type: type,
      page: 'MEMN_blog',
      extra: extra
    };
    
    const docRef = await db.collection('analytics').add(analyticsData);
    
    console.log(`📊 Evento registrado: ${type} - ID: ${docRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Evento registrado correctamente',
      eventId: docRef.id,
      type: type
    });
    
  } catch (error) {
    console.error('❌ Error registrando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el evento'
    });
  }
});

// Endpoint para obtener métricas
app.get('/api/v1/analytics/stats', async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    
    console.log('📡 Recibida solicitud GET /api/v1/analytics/stats:', { limit, type });
    
    let query = db.collection('analytics').orderBy('timestamp', 'desc');
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    query = query.limit(parseInt(limit));
    
    const snapshot = await query.get();
    const events = [];
    
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    res.json({
      success: true,
      count: events.length,
      events: events
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
});

// Endpoint para obtener resumen
app.get('/api/v1/analytics/summary', async (req, res) => {
  try {
    console.log('📡 Recibida solicitud GET /api/v1/analytics/summary');
    
    const snapshot = await db.collection('analytics').get();
    
    const summary = {
      totalEvents: 0,
      eventTypes: {},
      countries: {},
      uniqueSessions: new Set(),
      dateRange: {
        oldest: null,
        newest: null
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      summary.totalEvents++;
      
      summary.eventTypes[data.type] = (summary.eventTypes[data.type] || 0) + 1;
      summary.countries[data.country] = (summary.countries[data.country] || 0) + 1;
      summary.uniqueSessions.add(data.sessionId);
      
      const timestamp = data.timestamp.toDate();
      if (!summary.dateRange.oldest || timestamp < summary.dateRange.oldest) {
        summary.dateRange.oldest = timestamp;
      }
      if (!summary.dateRange.newest || timestamp > summary.dateRange.newest) {
        summary.dateRange.newest = timestamp;
      }
    });
    
    summary.uniqueSessions = summary.uniqueSessions.size;
    
    res.json({
      success: true,
      summary: summary
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el resumen'
    });
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  console.log('⚠ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe'
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Frontend URL esperado: http://192.168.1.4:5173`);
  console.log(`📊 API Base: http://localhost:${PORT}/api/v1`);
});