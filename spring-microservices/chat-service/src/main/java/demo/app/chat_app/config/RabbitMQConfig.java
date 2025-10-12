package demo.app.chat_app.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange.name}")
    private String exchangeName;
    @Value("${rabbitmq.routing.key}")
    private String routingKey;
    @Value("${rabbitmq.queue.edu-unit-queue}")
    private String educationalUnitQueueName;

    @Bean
    public Queue educationalUnitQueue() {
        return new Queue(educationalUnitQueueName, true);
    }
    @Bean
    public TopicExchange educationalUnitExchange() {
        return new TopicExchange(exchangeName);
    }
    @Bean
    public Binding educationalUnitBinding(Queue educationalUnitQueue, Exchange educationalUnitExchange) {
        return new Binding(educationalUnitQueue.getName(), Binding.DestinationType.QUEUE,
                educationalUnitExchange.getName(), routingKey, null);
    }
}
