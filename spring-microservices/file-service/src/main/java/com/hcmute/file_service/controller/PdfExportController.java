package com.hcmute.file_service.controller;

import com.hcmute.file_service.dto.response.ApiResponse;
import com.hcmute.file_service.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/pdf/export")
@RequiredArgsConstructor
public class PdfExportController {

    private final PdfExportService pdfExportService;

    @GetMapping("/test")
    public ApiResponse<?> test() {


        return ApiResponse.success(null, "Export admin profile to PDF successfully");
    }

    @GetMapping("/admin-profile")
    public ResponseEntity<?> exportAdminProfileToPdf() throws IOException {

        byte[] pdfBytesOfAdminProfile = pdfExportService.generateAdminProfilePdf();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytesOfAdminProfile);
    }

    @GetMapping("/educational-unit/{unitId}")
    public ResponseEntity<byte[]> exportEducationalUnitProfile(@PathVariable Integer unitId) throws IOException {
        byte[] pdf = pdfExportService.generateEducationalUnitProfilePdf(unitId);

        String fileName = "educational-unit-" + unitId + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
