export default () => ({
  port: process.env.PORT,
  brokerUri: process.env.BROKER_URI,
  queueName: process.env.QUEUE_NAME,
  exchangeName: process.env.EXCHANGE_NAME,
});
