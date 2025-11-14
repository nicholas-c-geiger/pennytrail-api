export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  environment: process.env.NODE_ENV ?? 'development',
});
