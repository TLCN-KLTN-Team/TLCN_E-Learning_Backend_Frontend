package demo.app.chat_app.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupScoreRequest {

    @NotNull(message = "Điểm không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm phải >= 0")
    @DecimalMax(value = "10.0", message = "Điểm phải <= 10")
    Double finalScore;
}
