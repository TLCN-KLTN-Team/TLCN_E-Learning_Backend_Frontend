package demo.app.chat_app.utils;

import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.enums.MessageType;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileUtils {

    @Value("${app.file.max-size}")
    private long maxFileSize;

    public boolean validateFile(MultipartFile file){
        if (file.isEmpty()){
            throw new AppException(ErrorCode.FILE_EMPTY);
        }
        if (file.getSize() > maxFileSize){
            throw new AppException(ErrorCode.FILE_SIZE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (contentType==null){
            throw new AppException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
        return true;
    }

    public MessageType getMessageType(String fileName){
        if (isImage(fileName)) {
            return MessageType.IMAGE;
        } else {
            // Tất cả file khác (video, audio, document, etc.) đều là FILE
            return MessageType.FILE;
        }
    }

    private boolean isImage(String fileName) {
        return fileName.endsWith("jpeg") ||
                fileName.endsWith("jpg") ||
                fileName.endsWith("png") ||
                fileName.endsWith("gif");
    }
}
