export default () => ({
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  brokerUri: process.env.BROKER_URI,
  queueName: process.env.QUEUE_NAME,
});
