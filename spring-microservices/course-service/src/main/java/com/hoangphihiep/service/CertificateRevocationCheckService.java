package com.hoangphihiep.service;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.DERIA5String;
import org.bouncycastle.asn1.x509.CRLDistPoint;
import org.bouncycastle.asn1.x509.DistributionPoint;
import org.bouncycastle.asn1.x509.DistributionPointName;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.GeneralName;
import org.bouncycastle.asn1.x509.GeneralNames;
import org.bouncycastle.cert.X509CertificateHolder;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateFactory;
import java.security.cert.X509CRL;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CertificateRevocationCheckService {

    public RevocationCheckResult check(X509CertificateHolder certHolder, int timeoutMs) {
        if (certHolder == null) {
            return RevocationCheckResult.builder()
                    .status("MANUAL_REVIEW_REQUIRED")
                    .detail("SIGNER_CERT_MISSING")
                    .timedOut(false)
                    .build();
        }

        List<String> crlUrls = extractCrlUrls(certHolder);
        if (crlUrls.isEmpty()) {
            return RevocationCheckResult.builder()
                    .status("MANUAL_REVIEW_REQUIRED")
                    .detail("CRL_URL_NOT_FOUND")
                    .timedOut(false)
                    .build();
        }

        boolean checkedAtLeastOne = false;
        boolean timedOut = false;

        for (String crlUrl : crlUrls) {
            try {
                byte[] crlBytes = fetchWithTimeout(crlUrl, timeoutMs);
                if (crlBytes == null || crlBytes.length == 0) {
                    continue;
                }

                X509CRL x509crl = parseCrl(crlBytes);
                checkedAtLeastOne = true;

                if (x509crl.getRevokedCertificate(certHolder.getSerialNumber()) != null) {
                    return RevocationCheckResult.builder()
                            .status("REVOKED")
                            .detail("CRL_REVOKED:" + crlUrl)
                            .timedOut(false)
                            .build();
                }
            } catch (ResourceAccessException ex) {
                timedOut = true;
                log.warn("Timeout/access error while fetching CRL from {}: {}", crlUrl, ex.getMessage());
            } catch (Exception ex) {
                log.warn("Failed to check CRL from {}: {}", crlUrl, ex.getMessage());
            }
        }

        if (checkedAtLeastOne) {
            return RevocationCheckResult.builder()
                    .status("GOOD")
                    .detail("CRL_CHECKED")
                    .timedOut(false)
                    .build();
        }

        return RevocationCheckResult.builder()
                .status("MANUAL_REVIEW_REQUIRED")
                .detail(timedOut ? "CRL_TIMEOUT" : "CRL_UNREACHABLE")
                .timedOut(timedOut)
                .build();
    }

    private byte[] fetchWithTimeout(String url, int timeoutMs) {
        if (url == null || url.isBlank()) {
            return null;
        }

        if (timeoutMs <= 0) {
            return new RestTemplate().getForObject(url, byte[].class);
        }

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);
        RestTemplate timeoutTemplate = new RestTemplate(requestFactory);
        return timeoutTemplate.getForObject(url, byte[].class);
    }

    private X509CRL parseCrl(byte[] crlBytes) throws Exception {
        CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
        return (X509CRL) certificateFactory.generateCRL(new ByteArrayInputStream(crlBytes));
    }

    private List<String> extractCrlUrls(X509CertificateHolder certHolder) {
        List<String> urls = new ArrayList<>();
        try {
            Extension extension = certHolder.getExtension(Extension.cRLDistributionPoints);
            if (extension == null) {
                return urls;
            }

            ASN1Primitive primitive = extension.getParsedValue().toASN1Primitive();
            CRLDistPoint crlDistPoint = CRLDistPoint.getInstance(primitive);
            for (DistributionPoint distributionPoint : crlDistPoint.getDistributionPoints()) {
                DistributionPointName distPointName = distributionPoint.getDistributionPoint();
                if (distPointName == null || distPointName.getType() != DistributionPointName.FULL_NAME) {
                    continue;
                }

                GeneralNames generalNames = GeneralNames.getInstance(distPointName.getName());
                for (GeneralName generalName : generalNames.getNames()) {
                    if (generalName.getTagNo() == GeneralName.uniformResourceIdentifier) {
                        String uri = DERIA5String.getInstance(generalName.getName()).getString();
                        if (uri != null && !uri.isBlank()) {
                            urls.add(uri);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Cannot parse CRL distribution points from certificate: {}", ex.getMessage());
        }
        return urls;
    }

    @Getter
    @Builder
    public static class RevocationCheckResult {
        private String status;
        private String detail;
        private boolean timedOut;
    }
}
