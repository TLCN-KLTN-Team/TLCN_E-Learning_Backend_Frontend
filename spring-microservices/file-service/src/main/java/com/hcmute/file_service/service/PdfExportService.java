package com.hcmute.file_service.service;

import com.hcmute.file_service.dto.response.ApiResponse;
import com.hcmute.file_service.dto.response.EducationalUnitDetailResponse;
import com.hcmute.file_service.exception.AppException;
import com.hcmute.file_service.exception.ErrorCode;
import com.hcmute.file_service.repository.httpclient.CourseServiceClient;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final CourseServiceClient courseServiceClient;

    // ===== Brand colors (education-themed) =====
    private static final Color PRIMARY = new DeviceRgb(0x1E, 0x40, 0xAF);   // deep blue
    private static final Color ACCENT = new DeviceRgb(0xF5, 0x9E, 0x0B);    // amber
    private static final Color MUTED = new DeviceRgb(0x6B, 0x72, 0x80);     // slate-500
    private static final Color BG_SOFT = new DeviceRgb(0xEF, 0xF6, 0xFF);   // soft blue
    private static final Color BORDER_SOFT = new DeviceRgb(0xE5, 0xE7, 0xEB);

    public byte[] generateAdminProfilePdf() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        document.setFont(font);

        document.add(new Paragraph("USER REPORT DEMO")
                .setBold()
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Name: Admin User"));
        document.add(new Paragraph("Email: admin@example.com"));
        document.add(new Paragraph("Role: Administrator"));

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateEducationalUnitProfilePdf(Integer unitId) throws IOException {
        EducationalUnitDetailResponse unit = fetchEducationalUnit(unitId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);

        document.setMargins(48, 48, 56, 48);

        PdfFont regular = loadUnicodeFont(false);
        PdfFont bold = loadUnicodeFont(true);
        document.setFont(regular);

        renderHeader(document, unit, regular, bold);
        renderTitleBand(document, bold);
        renderGeneralInfo(document, unit, regular, bold);
        renderStatistics(document, unit, regular, bold);
        renderDescription(document, unit, regular, bold);
        renderRepresentative(document, unit, regular, bold);
        renderDepartments(document, unit, regular, bold);
        renderTeachers(document, unit, regular, bold);
        renderCourses(document, unit, regular, bold);
        renderFooter(document, regular);

        document.close();
        return baos.toByteArray();
    }

    private EducationalUnitDetailResponse fetchEducationalUnit(Integer unitId) {
        try {
            ApiResponse<EducationalUnitDetailResponse> response =
                    courseServiceClient.getEducationalUnitById(unitId);
            if (response == null || response.getResult() == null) {
                throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
            }
            return response.getResult();
        } catch (AppException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Failed to fetch educational unit {}: {}", unitId, e.getMessage(), e);
            throw new AppException(ErrorCode.FEIGN_CLIENT_ERROR);
        }
    }

    // ===== Sections =====

    private void renderHeader(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1, 4}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        Cell logoCell = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE);
        try {
            if (unit.getLogo() != null && !unit.getLogo().isBlank()) {
                Image logo = new Image(ImageDataFactory.create(unit.getLogo()))
                        .setAutoScale(true)
                        .setMaxHeight(70)
                        .setMaxWidth(110);
                logoCell.add(logo);
            } else {
                logoCell.add(new Paragraph("EDU").setFont(bold).setFontSize(28).setFontColor(PRIMARY));
            }
        } catch (Exception ex) {
            log.warn("Could not load logo {}: {}", unit.getLogo(), ex.getMessage());
            logoCell.add(new Paragraph("EDU").setFont(bold).setFontSize(28).setFontColor(PRIMARY));
        }
        header.addCell(logoCell);

        Cell info = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE);
        info.add(new Paragraph(safe(unit.getName(), "Educational Unit"))
                .setFont(bold).setFontSize(18).setFontColor(PRIMARY).setMarginBottom(2));
        if (unit.getType() != null) {
            info.add(new Paragraph(unit.getType()).setFont(regular).setFontSize(11).setFontColor(MUTED).setMarginBottom(2));
        }
        if (unit.getWebsite() != null) {
            info.add(new Paragraph(unit.getWebsite()).setFont(regular).setFontSize(10).setFontColor(ACCENT));
        }
        header.addCell(info);

        doc.add(header);

        SolidLine headerLine = new SolidLine(1.2f);
        headerLine.setColor(PRIMARY);
        doc.add(new LineSeparator(headerLine));
    }

    private void renderTitleBand(Document doc, PdfFont bold) {
        Paragraph title = new Paragraph("HỒ SƠ ĐƠN VỊ ĐÀO TẠO")
                .setFont(bold)
                .setFontSize(20)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(PRIMARY)
                .setPaddingTop(10)
                .setPaddingBottom(10)
                .setMarginTop(14)
                .setMarginBottom(4);
        doc.add(title);

        doc.add(new Paragraph("Educational Unit Profile")
                .setFont(bold)
                .setFontSize(10)
                .setFontColor(MUTED)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(14));
    }

    private void renderGeneralInfo(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        sectionHeading(doc, "1. Thông tin chung / General Information", bold);

        Table table = new Table(UnitValue.createPercentArray(new float[]{1.2f, 3f}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(BORDER_SOFT, 0.6f));

        addInfoRow(table, "Tên đơn vị / Name", safe(unit.getName(), "—"), regular, bold);
        addInfoRow(table, "Loại hình / Type", safe(unit.getType(), "—"), regular, bold);
        addInfoRow(table, "Năm thành lập / Established", unit.getEstablishedYear() == null ? "—" : unit.getEstablishedYear().toString(), regular, bold);
        addInfoRow(table, "Địa chỉ / Address", safe(unit.getAddress(), "—"), regular, bold);
        addInfoRow(table, "Điện thoại / Phone", safe(unit.getPhone(), "—"), regular, bold);
        addInfoRow(table, "Email", safe(unit.getEmail(), "—"), regular, bold);
        addInfoRow(table, "Website", safe(unit.getWebsite(), "—"), regular, bold);

        doc.add(table);
    }

    private void renderStatistics(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        sectionHeading(doc, "2. Thống kê / Statistics", bold);

        long depCount = unit.getDepartments() == null ? 0 : unit.getDepartments().size();
        long teaCount = unit.getTeachers() == null ? 0 : unit.getTeachers().size();
        long couCount = unit.getCourses() == null ? 0 : unit.getCourses().size();
        long stuCount = unit.getTotalStudents() == null ? 0L : unit.getTotalStudents();

        Table stats = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);
        stats.addCell(statCard("Khoa / Departments", String.valueOf(depCount), regular, bold));
        stats.addCell(statCard("Giảng viên / Teachers", String.valueOf(teaCount), regular, bold));
        stats.addCell(statCard("Khóa học / Courses", String.valueOf(couCount), regular, bold));
        stats.addCell(statCard("Học viên / Students", String.valueOf(stuCount), regular, bold));
        doc.add(stats);
    }

    private Cell statCard(String label, String value, PdfFont regular, PdfFont bold) {
        Cell c = new Cell()
                .setBackgroundColor(BG_SOFT)
                .setBorder(new SolidBorder(BORDER_SOFT, 0.5f))
                .setPadding(10)
                .setMargin(3)
                .setTextAlignment(TextAlignment.CENTER);
        c.add(new Paragraph(value).setFont(bold).setFontSize(20).setFontColor(PRIMARY).setMarginBottom(2));
        c.add(new Paragraph(label).setFont(regular).setFontSize(9).setFontColor(MUTED));
        return c;
    }

    private void renderDescription(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        if (unit.getDescription() == null || unit.getDescription().isBlank()) return;
        sectionHeading(doc, "3. Giới thiệu / About", bold);
        doc.add(new Paragraph(unit.getDescription())
                .setFont(regular)
                .setFontSize(11)
                .setMarginBottom(10));
    }

    private void renderRepresentative(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        if (unit.getRepresentativeName() == null
                && unit.getRepresentativeEmail() == null
                && unit.getRepresentativePhone() == null) {
            return;
        }
        sectionHeading(doc, "4. Người đại diện / Representative", bold);

        Table table = new Table(UnitValue.createPercentArray(new float[]{1.2f, 3f}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(BORDER_SOFT, 0.6f));
        addInfoRow(table, "Họ tên / Full name", safe(unit.getRepresentativeName(), "—"), regular, bold);
        addInfoRow(table, "Email", safe(unit.getRepresentativeEmail(), "—"), regular, bold);
        addInfoRow(table, "Điện thoại / Phone", safe(unit.getRepresentativePhone(), "—"), regular, bold);
        doc.add(table);
    }

    private void renderDepartments(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        List<String> departments = Optional.ofNullable(unit.getDepartments()).orElse(List.of());
        if (departments.isEmpty()) return;

        sectionHeading(doc, "5. Danh sách khoa / Departments", bold);

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 4f}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(BORDER_SOFT, 0.6f));
        table.addHeaderCell(headerCell("#", bold));
        table.addHeaderCell(headerCell("Tên khoa / Name", bold));
        for (int i = 0; i < departments.size(); i++) {
            table.addCell(bodyCell(String.valueOf(i + 1), regular).setTextAlignment(TextAlignment.CENTER));
            table.addCell(bodyCell(departments.get(i), regular));
        }
        doc.add(table);
    }

    private void renderTeachers(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        List<EducationalUnitDetailResponse.Teacher> teachers =
                Optional.ofNullable(unit.getTeachers()).orElse(List.of());
        if (teachers.isEmpty()) return;

        sectionHeading(doc, "6. Đội ngũ giảng viên / Teaching Staff", bold);

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 2.5f, 1.5f, 2f}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(BORDER_SOFT, 0.6f));
        table.addHeaderCell(headerCell("#", bold));
        table.addHeaderCell(headerCell("Họ tên / Name", bold));
        table.addHeaderCell(headerCell("Học vị / Degree", bold));
        table.addHeaderCell(headerCell("Khoa / Department", bold));
        for (int i = 0; i < teachers.size(); i++) {
            EducationalUnitDetailResponse.Teacher t = teachers.get(i);
            table.addCell(bodyCell(String.valueOf(i + 1), regular).setTextAlignment(TextAlignment.CENTER));
            table.addCell(bodyCell(safe(t.getName(), "—"), regular));
            table.addCell(bodyCell(safe(t.getAcademicDegree(), "—"), regular));
            table.addCell(bodyCell(safe(t.getDepartmentName(), "—"), regular));
        }
        doc.add(table);
    }

    private void renderCourses(Document doc, EducationalUnitDetailResponse unit, PdfFont regular, PdfFont bold) {
        List<EducationalUnitDetailResponse.Course> courses =
                Optional.ofNullable(unit.getCourses()).orElse(List.of());
        if (courses.isEmpty()) return;

        sectionHeading(doc, "7. Khóa học đang đào tạo / Courses Offered", bold);

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.5f, 3f, 1.5f, 1f, 1f, 1.2f}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(BORDER_SOFT, 0.6f));
        table.addHeaderCell(headerCell("#", bold));
        table.addHeaderCell(headerCell("Tên khóa học / Title", bold));
        table.addHeaderCell(headerCell("Khoa / Dept", bold));
        table.addHeaderCell(headerCell("Học viên / Students", bold));
        table.addHeaderCell(headerCell("Đánh giá / Rating", bold));
        table.addHeaderCell(headerCell("Học phí / Price", bold));
        for (int i = 0; i < courses.size(); i++) {
            EducationalUnitDetailResponse.Course c = courses.get(i);
            table.addCell(bodyCell(String.valueOf(i + 1), regular).setTextAlignment(TextAlignment.CENTER));
            table.addCell(bodyCell(safe(c.getName(), "—"), regular));
            table.addCell(bodyCell(safe(c.getDepartmentName(), "—"), regular));
            table.addCell(bodyCell(String.valueOf(c.getNumberOfStudents()), regular).setTextAlignment(TextAlignment.CENTER));
            table.addCell(bodyCell(String.format("%.1f / 5", c.getAverageRating()), regular).setTextAlignment(TextAlignment.CENTER));
            table.addCell(bodyCell(safe(c.getPrice(), "—"), regular).setTextAlignment(TextAlignment.RIGHT));
        }
        doc.add(table);
    }

    private void renderFooter(Document doc, PdfFont regular) {
        String generated = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        doc.add(new Paragraph(" "));

        SolidLine footerLine = new SolidLine(0.4f);
        footerLine.setColor(BORDER_SOFT);
        doc.add(new LineSeparator(footerLine));

        doc.add(new Paragraph("Tài liệu được sinh tự động bởi hệ thống — Generated automatically on " + generated)
                .setFont(regular)
                .setFontSize(8)
                .setFontColor(MUTED)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(6));
    }

    // ===== Helpers =====

    private void sectionHeading(Document doc, String text, PdfFont bold) {
        doc.add(new Paragraph(text)
                .setFont(bold)
                .setFontSize(12)
                .setFontColor(PRIMARY)
                .setMarginTop(14)
                .setMarginBottom(6)
                .setBorderBottom(new SolidBorder(ACCENT, 0.8f))
                .setPaddingBottom(2));
    }

    private void addInfoRow(Table table, String label, String value, PdfFont regular, PdfFont bold) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFont(bold).setFontSize(10).setFontColor(MUTED))
                .setBorder(new SolidBorder(BORDER_SOFT, 0.4f))
                .setBackgroundColor(BG_SOFT)
                .setPadding(6));
        table.addCell(new Cell()
                .add(new Paragraph(value).setFont(regular).setFontSize(10))
                .setBorder(new SolidBorder(BORDER_SOFT, 0.4f))
                .setPadding(6));
    }

    private Cell headerCell(String text, PdfFont bold) {
        return new Cell()
                .add(new Paragraph(text).setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(PRIMARY)
                .setBorder(new SolidBorder(PRIMARY, 0.4f))
                .setPadding(6)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Cell bodyCell(String text, PdfFont regular) {
        return new Cell()
                .add(new Paragraph(text).setFont(regular).setFontSize(10))
                .setBorder(new SolidBorder(BORDER_SOFT, 0.4f))
                .setPadding(5);
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    /**
     * Loads a Unicode TTF font with IDENTITY_H encoding so Vietnamese diacritics render correctly.
     * Lookup order:
     *   1. Bundled font on classpath: /fonts/Roboto-*.ttf
     *   2. Common Windows system fonts (Arial, Tahoma, Segoe UI)
     *   3. Common Linux system fonts (DejaVu, Liberation, Noto)
     *   4. Common macOS system fonts
     *   5. Fall back to Helvetica (limited charset — Vietnamese diacritics will not render)
     */
    private PdfFont loadUnicodeFont(boolean bold) throws IOException {
        String[] candidates = bold
                ? new String[] {
                        "classpath:/fonts/Roboto-Bold.ttf",
                        "classpath:/fonts/NotoSans-Bold.ttf",
                        "classpath:/fonts/DejaVuSans-Bold.ttf",
                        "C:/Windows/Fonts/arialbd.ttf",
                        "C:/Windows/Fonts/tahomabd.ttf",
                        "C:/Windows/Fonts/segoeuib.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
                        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
                }
                : new String[] {
                        "classpath:/fonts/Roboto-Regular.ttf",
                        "classpath:/fonts/NotoSans-Regular.ttf",
                        "classpath:/fonts/DejaVuSans.ttf",
                        "C:/Windows/Fonts/arial.ttf",
                        "C:/Windows/Fonts/tahoma.ttf",
                        "C:/Windows/Fonts/segoeui.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
                        "/System/Library/Fonts/Supplemental/Arial.ttf"
                };

        for (String location : candidates) {
            try {
                byte[] fontBytes = readFontBytes(location);
                if (fontBytes != null && fontBytes.length > 0) {
                    log.debug("Loaded Unicode font from {}", location);
                    return PdfFontFactory.createFont(
                            fontBytes,
                            PdfEncodings.IDENTITY_H,
                            PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
                }
            } catch (Exception e) {
                log.debug("Could not load font {}: {}", location, e.getMessage());
            }
        }

        log.warn("No Unicode TTF font found on classpath or known system paths. "
                + "Vietnamese diacritics may not render correctly. "
                + "Drop a Roboto/Noto/DejaVu TTF into src/main/resources/fonts/ to fix.");
        return PdfFontFactory.createFont(bold ? StandardFonts.HELVETICA_BOLD : StandardFonts.HELVETICA);
    }

    private byte[] readFontBytes(String location) throws IOException {
        if (location.startsWith("classpath:")) {
            String path = location.substring("classpath:".length());
            try (InputStream is = getClass().getResourceAsStream(path)) {
                return is == null ? null : is.readAllBytes();
            }
        }
        File file = new File(location);
        if (file.exists() && file.isFile()) {
            return Files.readAllBytes(file.toPath());
        }
        return null;
    }
}
