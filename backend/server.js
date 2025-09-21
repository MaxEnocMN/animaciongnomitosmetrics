import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests por IP
  message: { error: 'Demasiadas solicitudes, intenta más tarde' }
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1, // máximo 1 request por minuto
  message: { error: 'Solo se permite 1 evento por minuto' }
});

app.use('/api/', limiter);

app.use((req, res, next) => {
  const allowedOrigins = ['https://maxenocmn.github.io'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

let db;
try {
  const firebaseApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  db = getFirestore(firebaseApp);
} catch (error) {
  console.error('Error inicializando Firebase Admin:', error);
  process.exit(1);
}

const validateAnalyticsData = (req, res, next) => {
  const { type, sessionId, country } = req.body;
  
  if (!type || !sessionId || !country) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: type, sessionId, country'
    });
  }
  
  next();
};

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Blog1metrics Backend',
    firebase: 'Connected'
  });
});

app.post('/api/v1/analytics', analyticsLimiter, validateAnalyticsData, async (req, res) => {
  try {
    const { type, sessionId, country, extra = {} } = req.body;
    
    const analyticsData = {
      timestamp: new Date(),
      country: country,
      sessionId: sessionId,
      type: type,
      page: 'MEMN_blog',
      extra: extra
    };
    
    const docRef = await db.collection('analytics').add(analyticsData);
    
    res.status(201).json({
      success: true,
      message: 'Evento registrado correctamente',
      eventId: docRef.id,
      type: type
    });
    
  } catch (error) {
    console.error('Error registrando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el evento'
    });
  }
});

app.get('/api/v1/analytics/stats', async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    
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
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
});

app.get('/api/v1/analytics/summary', async (req, res) => {
  try {
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
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el resumen'
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe'
  });
});

app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Algo salió mal'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
