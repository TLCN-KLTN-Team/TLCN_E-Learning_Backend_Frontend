package demo.app.chat_app.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.ContainerProperties.AckMode;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka container & error-handling cho chat-service.
 *
 * <ul>
 *   <li>Ack mode = MANUAL_IMMEDIATE → handler tự ack sau khi thành công. Lỗi
 *   không ack → Kafka redeliver, kết hợp với idempotency lookup ở consumer
 *   để tránh side-effect lặp.</li>
 *
 *   <li>{@link DefaultErrorHandler} với {@link ExponentialBackOff}: retry 5 lần
 *   với backoff 1s → 30s. Sau khi cạn, record được publish sang topic DLT
 *   {@code <topic>.DLT} (qua {@link DeadLetterPublishingRecoverer}) để không
 *   block partition (poison-pill).</li>
 *
 *   <li>Concurrency = 1: giữ tuần tự per-partition. Idempotency layer đã đảm
 *   bảo replay an toàn, không cần bump concurrency.</li>
 * </ul>
 */
@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Value("${spring.kafka.consumer.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @Value("${spring.kafka.consumer.auto-offset-reset:earliest}")
    private String autoOffsetReset;

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        // Giảm message-in-flight để 1 lỗi không kéo theo replay cả batch lớn.
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 10);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * Producer dùng để gửi record sang DLT khi error handler "give up".
     * Không liên quan đến producer ở course-service.
     */
    @Bean
    public ProducerFactory<String, String> dltProducerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, String> dltKafkaTemplate(ProducerFactory<String, String> dltProducerFactory) {
        return new KafkaTemplate<>(dltProducerFactory);
    }

    /**
     * Listener container factory được consumers tham chiếu qua
     * {@code containerFactory = "manualAckKafkaListenerContainerFactory"}.
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> manualAckKafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory,
            KafkaTemplate<String, String> dltKafkaTemplate
    ) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(AckMode.MANUAL_IMMEDIATE);
        factory.setConcurrency(1);

        ExponentialBackOff backOff = new ExponentialBackOff(1000L, 2.0);
        backOff.setMaxInterval(30_000L);
        backOff.setMaxElapsedTime(120_000L); // ~5 lần retry rồi DLT

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(dltKafkaTemplate);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        errorHandler.setCommitRecovered(true);
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
