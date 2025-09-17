import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();

// Middleware para validar datos de analytics
const validateAnalyticsData = (req, res, next) => {
  const { type, sessionId, country } = req.body;
  
  const validTypes = [
    'page_visit',
    'image_view', 
    'modal_open',
    'modal_close',
    'modal_nav',
    'code_copy'
  ];
  
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de evento inválido',
      validTypes: validTypes
    });
  }
  
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'sessionId es requerido y debe ser string'
    });
  }
  
  if (!country || typeof country !== 'string') {
    return res.status(400).json({
      error: 'country es requerido y debe ser string'
    });
  }
  
  next();
};

// POST /api/v1/analytics - Registrar evento
router.post('/', validateAnalyticsData, async (req, res) => {
  try {
    const db = getFirestore();
    const { type, sessionId, country, extra = {} } = req.body;
    
    // Estructura exacta como en tu frontend
    const analyticsData = {
      timestamp: new Date(),
      country: country,
      sessionId: sessionId,
      type: type,
      page: 'MEMN_blog',
      extra: extra
    };
    
    // Validaciones específicas por tipo de evento
    if (type === 'image_view' && typeof extra.imageIndex !== 'number') {
      return res.status(400).json({
        error: 'Para image_view se requiere extra.imageIndex (number)'
      });
    }
    
    if (type === 'code_copy' && !extra.codeVersion) {
      return res.status(400).json({
        error: 'Para code_copy se requiere extra.codeVersion'
      });
    }
    
    // Guardar en Firestore
    const docRef = await db.collection('analytics').add(analyticsData);
    
    console.log(`📊 Evento ${type} registrado - ID: ${docRef.id} - Sesión: ${sessionId}`);
    
    res.status(201).json({
      success: true,
      message: 'Evento registrado correctamente',
      eventId: docRef.id,
      type: type,
      timestamp: analyticsData.timestamp
    });
    
  } catch (error) {
    console.error('❌ Error registrando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el evento'
    });
  }
});

// GET /api/v1/analytics/stats - Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const db = getFirestore();
    const { 
      limit = 100, 
      type, 
      country, 
      sessionId,
      startDate,
      endDate 
    } = req.query;
    
    let query = db.collection('analytics').orderBy('timestamp', 'desc');
    
    // Filtros opcionales
    if (type) {
      query = query.where('type', '==', type);
    }
    
    if (country) {
      query = query.where('country', '==', country);
    }
    
    if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }
    
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
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
      events: events,
      filters: { type, country, sessionId, startDate, endDate, limit }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
});

// GET /api/v1/analytics/summary - Resumen de métricas
router.get('/summary', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('analytics').get();
    
    const summary = {
      totalEvents: 0,
      eventTypes: {},
      countries: {},
      uniqueSessions: new Set(),
      codeVersions: {},
      imageViews: {},
      dateRange: {
        oldest: null,
        newest: null
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      summary.totalEvents++;
      
      // Contar tipos de eventos
      summary.eventTypes[data.type] = (summary.eventTypes[data.type] || 0) + 1;
      
      // Contar países
      summary.countries[data.country] = (summary.countries[data.country] || 0) + 1;
      
      // Sesiones únicas
      summary.uniqueSessions.add(data.sessionId);
      
      // Análisis específico por tipo de evento
      if (data.type === 'code_copy' && data.extra?.codeVersion) {
        summary.codeVersions[data.extra.codeVersion] = 
          (summary.codeVersions[data.extra.codeVersion] || 0) + 1;
      }
      
      if (data.type === 'image_view' && typeof data.extra?.imageIndex === 'number') {
        const imgIndex = data.extra.imageIndex;
        summary.imageViews[imgIndex] = (summary.imageViews[imgIndex] || 0) + 1;
      }
      
      // Rango de fechas
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

export default router;