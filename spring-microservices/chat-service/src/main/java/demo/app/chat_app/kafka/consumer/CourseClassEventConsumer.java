package demo.app.chat_app.kafka.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.events.KafkaEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.impl.ChannelServiceImpl;
import demo.app.chat_app.service.impl.SectionServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseClassEventConsumer {
    private final ObjectMapper mapper = new ObjectMapper();
    private final ChannelServiceImpl channelService;
    private final SectionServiceImpl sectionService;

    @KafkaListener(
            topics = "${kafka.topic.class-events}",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void listenCourseClassEvents(String message) {
        try {
            KafkaEvent<?> wrapper = mapper.readValue(
                    message,
                    new TypeReference<KafkaEvent<?>>() {}
            );

            String eventType = wrapper.getEventType();
            JsonNode data = mapper.valueToTree(wrapper.getData());

            switch (eventType) {
                case "CLASS_CREATED":
                    log.info("Received CLASS_CREATED event: {}", data);
                    ClassCreatedEvent classCreatedEvent = mapper.convertValue(data, ClassCreatedEvent.class);
                    sectionService.createSectionWhenClassCreated(classCreatedEvent);
                    break;
                case "STUDENTS_ENROLLED":
                    log.info("Received STUDENTS_ENROLLED event: {}", data);
                    EnrollStudentsEvent enrollStudentsEvent = mapper.convertValue(data, EnrollStudentsEvent.class);
                    channelService.addParticipantsWhenStudentsEnrolled(enrollStudentsEvent);
                    break;
                default:
                    log.warn("Unknown event type: {}", eventType);
            }

        } catch (Exception ex) {
            log.error(ex.getMessage(), ex);
            throw new AppException(ErrorCode.JSON_PROCESSING_ERROR);
        }
    }

}
