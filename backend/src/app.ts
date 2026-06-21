import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logging';
import { errorHandler, AppError } from './middleware/error';
import routes from './routes';

const app = express();

// Parse JSON request payloads
app.use(express.json());

// Parse url-encoded request payloads
app.use(express.urlencoded({ extended: true }));

// Configure CORS for security compliance
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://search-type-ahead.vercel.app',
    'https://search-type-ahead.vercel.app/'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply structured request logging middleware
app.use(requestLogger);

// Attach the API routing structure (including GET /health)
app.use('/', routes);

// Handle unknown route mappings (404 Error handler)
app.use((req, _res, next) => {
  next(new AppError(`Cannot find path '${req.originalUrl}' using method ${req.method}`, 404));
});

// Register the global error handler middleware
app.use(errorHandler);

export default app;
