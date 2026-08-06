import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

const isDevelopment = process.env.NODE_ENV !== 'production';

const sdk = new NodeSDK({
  traceExporter: isDevelopment ? new ConsoleSpanExporter() : undefined,
  instrumentations: [getNodeAutoInstrumentations()],
});

Promise.resolve(sdk.start()).catch(() => {
  // OpenTelemetry is best-effort; never block startup.
});
