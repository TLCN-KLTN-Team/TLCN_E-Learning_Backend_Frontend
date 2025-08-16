package demo.app.chat_app.service.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) throws IOException {
        try{
            Map result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return result.get("secure_url").toString(); // url uploaded
        }catch (Exception ex){
            throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAILED);
        }
    }
}
