package demo.app.chat_app.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.app.chat_app.events.CourseCreatedEvent;
import demo.app.chat_app.service.impl.WorkspaceServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseEventConsumer {
    private final WorkspaceServiceImpl workspaceService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    /**
     * Kafka listener cho course created events
     * Sử dụng service token vì đây là background task (không có user context)
     */
    @KafkaListener(
            topics = "${kafka.topic.course-events}",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void listenCourseCreatedAndAssignForATeacher(String message) {
        try {
            CourseCreatedEvent event = mapper.readValue(message, CourseCreatedEvent.class);
            System.out.println("Received Student: " + event);
            System.out.println("Received Student: " + event.getCourseName());

            workspaceService.createWorkspaceWhenCourseCreatedAndAssignForATeacher(event);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
