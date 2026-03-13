// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    
    struct Certificate {
        string userId;
        uint256 publishedCourseId;
        uint256 issueDate;
        string certificateHash; // SHA-256 hash or verify code
        bool isValid;
    }

    // Mapping from Certificate Code (UUID) to Certificate Data
    mapping(string => Certificate) public certificates;
    
    // Mapping to check if a user has already claimed a certificate for a course
    // Key: keccak256(abi.encodePacked(userId, publishedCourseId))
    mapping(bytes32 => bool) public userCourseClaims;

    event CertificateIssued(string certificateCode, string userId, uint256 publishedCourseId, uint256 timestamp);

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @dev Issues a new certificate.
     * @param _certificateCode Unique UUID code for the certificate.
     * @param _userId The ID of the user.
     * @param _publishedCourseId The ID of the course.
     * @param _certificateHash Integrity hash of the certificate.
     */
    function issueCertificate(
        string memory _certificateCode,
        string memory _userId,
        uint256 _publishedCourseId,
        string memory _certificateHash
    ) public onlyOwner {
        // Create a unique key for user + course to prevent duplicate claims on-chain if desired
        bytes32 claimKey = keccak256(abi.encodePacked(_userId, _publishedCourseId));
        require(!userCourseClaims[claimKey], "Certificate already issued for this user and course");

        certificates[_certificateCode] = Certificate({
            userId: _userId,
            publishedCourseId: _publishedCourseId,
            issueDate: block.timestamp,
            certificateHash: _certificateHash,
            isValid: true
        });

        userCourseClaims[claimKey] = true;

        emit CertificateIssued(_certificateCode, _userId, _publishedCourseId, block.timestamp);
    }

    /**
     * @dev Verifies if a certificate is valid.
     */
    function verifyCertificate(string memory _certificateCode) public view returns (bool, string memory, uint256, uint256) {
        Certificate memory cert = certificates[_certificateCode];
        return (cert.isValid, cert.userId, cert.publishedCourseId, cert.issueDate);
    }
}
