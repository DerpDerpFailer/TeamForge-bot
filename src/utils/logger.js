// Utilitaire de logs centralisé avec timestamps et niveaux
const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

const logger = {
  info:    (msg) => console.log(`[${timestamp()}] ℹ️  INFO    | ${msg}`),
  success: (msg) => console.log(`[${timestamp()}] ✅ SUCCESS | ${msg}`),
  warn:    (msg) => console.warn(`[${timestamp()}] ⚠️  WARN    | ${msg}`),
  error:   (msg) => console.error(`[${timestamp()}] ❌ ERROR   | ${msg}`),
  cmd:     (msg) => console.log(`[${timestamp()}] 🔧 COMMAND | ${msg}`),
  event:   (msg) => console.log(`[${timestamp()}] 📡 EVENT   | ${msg}`),
};

module.exports = logger;