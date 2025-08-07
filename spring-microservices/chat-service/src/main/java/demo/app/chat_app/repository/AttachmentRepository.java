package demo.app.chat_app.repository;

import demo.app.chat_app.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {
}
