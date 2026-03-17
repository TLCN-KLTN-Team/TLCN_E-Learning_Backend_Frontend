package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.MessageAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends MongoRepository<MessageAttachment, String> {
}
