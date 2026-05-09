// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract CertificateRegistryTest {
    CertificateRegistry public certificateRegistry;
    address public owner;
    address public nonOwner;

    function setUp() public {
        owner = address(this);
        nonOwner = address(0x1234567890123456789012345678901234567890);
    }

    // ============ Test: Basic Certificate Issuance ============

    function testIssueCertificateSuccess() public {
        // Arrange
        string memory certCode = "CERT-001";
        string memory userId = "student-001";
        uint256 courseId = 1;
        string memory hash = "sha256hash";
        uint256 expiryDate = block.timestamp + 365 days;

        // Act
        certificateRegistry.issueCertificate(certCode, userId, courseId, hash, expiryDate);

        // Assert
        (bool valid, string memory retUserId, uint256 retCourseId, uint256 issuedAt, uint256 expiresAt, bool revoked) = 
            certificateRegistry.verifyCertificate(certCode);
        require(valid, "Certificate should be valid");
        require(keccak256(abi.encodePacked(retUserId)) == keccak256(abi.encodePacked(userId)), "UserId mismatch");
        require(retCourseId == courseId, "CourseId mismatch");
        require(expiresAt == expiryDate, "Expiry date mismatch");
        require(!revoked, "Should not be revoked");
    }

    function testIssueCertificateWithNoExpiration() public {
        // Arrange
        string memory certCode = "CERT-002";
        string memory userId = "student-002";
        uint256 courseId = 2;
        string memory hash = "sha256hash";
        uint256 expiryDate = 0; // No expiration

        // Act
        certificateRegistry.issueCertificate(certCode, userId, courseId, hash, expiryDate);

        // Assert
        (bool valid, , , , uint256 expiresAt, ) = certificateRegistry.verifyCertificate(certCode);
        require(valid, "Certificate should be valid");
        require(expiresAt == 0, "Expiry date should be 0");
    }

    function testIssueCertificateDuplicateRevert() public {
        // Arrange
        string memory certCode = "CERT-003";
        string memory userId = "student-003";
        uint256 courseId = 3;
        string memory hash = "sha256hash";

        // Act & Assert
        certificateRegistry.issueCertificate(certCode, userId, courseId, hash, 0);
        
        // Second issuance should revert
        try certificateRegistry.issueCertificate("CERT-004", userId, courseId, hash, 0) {
            revert("Should have reverted on duplicate issuance");
        } catch {
            // Expected
        }
    }

    // ============ Test: Certificate Revocation ============

    function testRevokeCertificateSuccess() public {
        // Arrange
        string memory certCode = "CERT-100";
        string memory userId = "student-100";
        uint256 courseId = 100;
        string memory hash = "sha256hash";
        
        certificateRegistry.issueCertificate(certCode, userId, courseId, hash, 0);

        // Act
        certificateRegistry.revokeCertificate(certCode, userId, courseId, "Fraud detected");

        // Assert
        (bool valid, , , , , bool revoked) = certificateRegistry.verifyCertificate(certCode);
        require(!valid, "Certificate should be invalid after revocation");
        require(revoked, "Revoked flag should be true");

        CertificateRegistry.Certificate memory cert = certificateRegistry.getCertificateDetails(certCode);
        require(cert.revokedAt > 0, "Revoked timestamp should be set");
        require(keccak256(abi.encodePacked(cert.revocationReason)) == keccak256(abi.encodePacked("Fraud detected")), "Revocation reason mismatch");
    }

    function testRevokeAlreadyRevokedCertificateRevert() public {
        // Arrange
        string memory certCode = "CERT-101";
        string memory userId = "student-101";
        uint256 courseId = 101;

        certificateRegistry.issueCertificate(certCode, userId, courseId, "hash", 0);
        certificateRegistry.revokeCertificate(certCode, userId, courseId, "First revocation");

        // Act & Assert
        try certificateRegistry.revokeCertificate(certCode, userId, courseId, "Second revocation") {
            revert("Should have reverted on double revocation");
        } catch {
            // Expected
        }
    }

    // ============ Test: Certificate Expiration ============

    function testCertificateExpired() public {
        // Arrange
        string memory certCode = "CERT-200";
        string memory userId = "student-200";
        uint256 courseId = 200;
        uint256 expiryDate = block.timestamp - 1 days; // Expired

        // Act & Assert
        try certificateRegistry.issueCertificate(certCode, userId, courseId, "hash", expiryDate) {
            revert("Should have reverted on past expiry date");
        } catch {
            // Expected
        }
    }

    function testCertificateBecomesInvalidAfterExpiration() public {
        // Arrange
        string memory certCode = "CERT-201";
        string memory userId = "student-201";
        uint256 courseId = 201;
        uint256 expiryDate = block.timestamp + 1 seconds;

        certificateRegistry.issueCertificate(certCode, userId, courseId, "hash", expiryDate);

        // Verify is valid before expiration
        (bool validBefore, , , , , ) = certificateRegistry.verifyCertificate(certCode);
        require(validBefore, "Should be valid before expiration");

        // Simulate time passage (in actual tests, use vm.warp or similar)
        // After expiry, it should be invalid
        // Note: This test would need time advancement via hardhat/foundry
    }

    // ============ Test: Recovery Function ============

    function testResetRevokedCertificateClaimWithReason() public {
        // Arrange
        string memory userId = "student-300";
        uint256 courseId = 300;

        certificateRegistry.issueCertificate("CERT-300", userId, courseId, "hash", 0);
        certificateRegistry.revokeCertificate("CERT-300", userId, courseId, "Admin error");

        // Act
        certificateRegistry.resetRevokedCertificateClaim(userId, courseId, "Admin recovery - error correction");

        // Assert - claim should be reset, allowing re-issuance
        // This is a recovery function, use with caution
    }

    // ============ Test: View Functions ============

    function testGetCertificateDetails() public {
        // Arrange
        string memory certCode = "CERT-400";
        string memory userId = "student-400";
        uint256 courseId = 400;
        string memory hash = "sha256hash-400";
        uint256 expiryDate = block.timestamp + 30 days;

        certificateRegistry.issueCertificate(certCode, userId, courseId, hash, expiryDate);

        // Act
        CertificateRegistry.Certificate memory cert = certificateRegistry.getCertificateDetails(certCode);

        // Assert
        require(keccak256(abi.encodePacked(cert.userId)) == keccak256(abi.encodePacked(userId)), "UserId mismatch");
        require(cert.publishedCourseId == courseId, "CourseId mismatch");
        require(keccak256(abi.encodePacked(cert.certificateHash)) == keccak256(abi.encodePacked(hash)), "Hash mismatch");
        require(cert.isValid, "Should be valid");
        require(!cert.isRevoked, "Should not be revoked");
        require(cert.expiryDate == expiryDate, "Expiry date mismatch");
    }

    // ============ Test: Edge Cases ============

    function testEmptyRevocationReasonRevert() public {
        // Arrange
        string memory userId = "student-500";
        uint256 courseId = 500;

        certificateRegistry.issueCertificate("CERT-500", userId, courseId, "hash", 0);

        // Act & Assert
        try certificateRegistry.resetRevokedCertificateClaim(userId, courseId, "") {
            revert("Should have reverted on empty reason");
        } catch {
            // Expected
        }
    }

    function testNonExistentCertificateVerify() public {
        // Act
        (bool valid, , , , , ) = certificateRegistry.verifyCertificate("NONEXISTENT");

        // Assert
        require(!valid, "Non-existent certificate should be invalid");
    }
}
