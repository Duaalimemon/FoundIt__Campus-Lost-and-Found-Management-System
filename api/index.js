let cachedApp = null;
let cachedConnectDB = null;

/**
 * Lazily imports and caches the ES Module Express app and database connection helper.
 * Dynamic import() ensures seamless compatibility when invoked from a CommonJS serverless context.
 */
async function bootstrap() {
  if (!cachedApp || !cachedConnectDB) {
    const [appModule, dbModule] = await Promise.all([
      import('../server/src/app.js'),
      import('../server/src/config/db.js')
    ]);
    cachedApp = appModule.default || appModule;
    cachedConnectDB = dbModule.connectDB;
  }
  return { app: cachedApp, connectDB: cachedConnectDB };
}

/**
 * Vercel Serverless Function entry point.
 * Ensures the database connection is active before dispatching the HTTP request to Express.
 */
export default async function handler(req, res) {
  try {
    const { app, connectDB } = await bootstrap();
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[FoundIt Serverless] Request processing failed:', error.stack || error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
}
