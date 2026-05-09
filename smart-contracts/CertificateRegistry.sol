// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract CertificateRegistry is ERC721URIStorage, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Certificate {
        address studentWallet;
        string userId;
        uint256 publishedCourseId;
        uint256 issueDate;
        uint256 expiryDate; // 0 means no expiration
        string certificateHash; // SHA-256 hash or verify code
        string tokenUri;
        uint256 tokenId;
        bool isValid;
        bool isRevoked;
        uint256 revokedAt;
        string revocationReason; // Reason for revocation if any
    }

    mapping(string => Certificate) public certificates;
    mapping(bytes32 => bool) public userCourseClaims;
    mapping(string => uint256) public certificateCodeToTokenId;
    mapping(uint256 => string) public tokenIdToCertificateCode;
    mapping(string => uint256) public certificateHashToTokenId;

    event CertificateIssued(
        string certificateCode,
        string userId,
        uint256 publishedCourseId,
        uint256 tokenId,
        uint256 timestamp
    );
    event CertificateRevoked(string indexed certificateCode, string userId, uint256 publishedCourseId, uint256 timestamp, string reason);
    event CertificateExpired(string indexed certificateCode, string userId, uint256 publishedCourseId, uint256 expiryDate);
    event CertificateNFTMinted(string certificateCode, uint256 tokenId, string tokenUri, address indexed issuer);

    constructor() ERC721("CertificateNFT", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    function addIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, issuer);
    }

    function removeIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, issuer);
    }

    function isIssuer(address account) external view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }

    function issueCertificate(
        address _studentWallet,
        string memory _certificateCode,
        string memory _userId,
        uint256 _publishedCourseId,
        string memory _certificateHash,
        string memory _tokenUri,
        uint256 _tokenId,
        uint256 _expiryDate
    ) public onlyRole(ISSUER_ROLE) returns (uint256) {
        require(_studentWallet != address(0), "Student wallet is required");
        require(_expiryDate == 0 || _expiryDate > block.timestamp, "Expiry date must be in the future or 0");
        require(bytes(_certificateCode).length > 0, "Certificate code is required");
        require(bytes(_userId).length > 0, "User ID is required");
        require(bytes(_certificateHash).length > 0, "Certificate hash is required");
        require(_tokenId > 0, "Token ID must be greater than zero");

        bytes32 claimKey = keccak256(abi.encodePacked(_userId, _publishedCourseId));
        require(!userCourseClaims[claimKey], "Certificate already issued for this user and course");
        require(certificateCodeToTokenId[_certificateCode] == 0, "Certificate code already exists");
        require(certificateHashToTokenId[_certificateHash] == 0, "Certificate hash already exists");

        _safeMint(_studentWallet, _tokenId);
        _setTokenURI(_tokenId, _tokenUri);

        certificates[_certificateCode] = Certificate({
            studentWallet: _studentWallet,
            userId: _userId,
            publishedCourseId: _publishedCourseId,
            issueDate: block.timestamp,
            expiryDate: _expiryDate,
            certificateHash: _certificateHash,
            tokenUri: _tokenUri,
            tokenId: _tokenId,
            isValid: true,
            isRevoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        certificateCodeToTokenId[_certificateCode] = _tokenId;
        tokenIdToCertificateCode[_tokenId] = _certificateCode;
        certificateHashToTokenId[_certificateHash] = _tokenId;
        userCourseClaims[claimKey] = true;

        emit CertificateIssued(_certificateCode, _userId, _publishedCourseId, _tokenId, block.timestamp);
        emit CertificateNFTMinted(_certificateCode, _tokenId, _tokenUri, msg.sender);

        return _tokenId;
    }

    // Prevent transfers (soulbound) by blocking non-mint/non-burn token movements
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override(ERC721) // Bỏ ERC721URIStorage đi, chỉ để lại ERC721
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Logic Soulbound: Chỉ cho phép Mint (from == 0) hoặc Burn (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfer disabled");
        }

        // Gọi hàm update của lớp cha (super)
        return super._update(to, tokenId, auth);
    }

    function revokeCertificate(
        string memory _certificateCode,
        string memory _userId,
        uint256 _publishedCourseId,
        string memory _reason
    ) public onlyRole(ADMIN_ROLE) {
        Certificate storage cert = certificates[_certificateCode];
        require(cert.isValid, "Certificate not found or already invalid");
        require(!cert.isRevoked, "Certificate already revoked");

        bytes32 claimKey = keccak256(abi.encodePacked(_userId, _publishedCourseId));
        require(userCourseClaims[claimKey], "No certificate claim exists");

        cert.isRevoked = true;
        cert.revokedAt = block.timestamp;
        cert.revocationReason = _reason;
        cert.isValid = false;

        emit CertificateRevoked(_certificateCode, _userId, _publishedCourseId, block.timestamp, _reason);
    }

    function resetRevokedCertificateClaim(
        string memory _userId,
        uint256 _publishedCourseId,
        string memory _reason
    ) public onlyRole(ADMIN_ROLE) {
        bytes32 claimKey = keccak256(abi.encodePacked(_userId, _publishedCourseId));
        require(userCourseClaims[claimKey], "No certificate claim exists");
        require(bytes(_reason).length > 0, "Recovery reason required");

        userCourseClaims[claimKey] = false;
        emit CertificateRevoked("", _userId, _publishedCourseId, block.timestamp, _reason);
    }

    function verifyCertificateByHash(string memory _certificateHash)
        public
        view
        returns (bool isCurrentlyValid, string memory userId, uint256 courseId, uint256 issuedAt)
    {
        uint256 tokenId = certificateHashToTokenId[_certificateHash];
        require(tokenId > 0, "Certificate hash not found");

        string memory certificateCode = tokenIdToCertificateCode[tokenId];
        Certificate memory cert = certificates[certificateCode];

        bool expired = cert.expiryDate > 0 && cert.expiryDate <= block.timestamp;
        bool currentlyValid = cert.isValid && !cert.isRevoked && !expired;

        return (currentlyValid, cert.userId, cert.publishedCourseId, cert.issueDate);
    }

    function verifyCertificate(string memory _certificateCode)
        public
        view
        returns (bool isCurrentlyValid, string memory userId, uint256 courseId, uint256 issuedAt, uint256 expiresAt, bool revoked)
    {
        Certificate memory cert = certificates[_certificateCode];

        bool expired = cert.expiryDate > 0 && cert.expiryDate <= block.timestamp;
        bool currentlyValid = cert.isValid && !cert.isRevoked && !expired;

        return (currentlyValid, cert.userId, cert.publishedCourseId, cert.issueDate, cert.expiryDate, cert.isRevoked);
    }

    function getCertificateDetails(string memory _certificateCode) public view returns (Certificate memory) {
        return certificates[_certificateCode];
    }

    function getCertificateByTokenId(uint256 _tokenId) public view returns (Certificate memory) {
        string memory certificateCode = tokenIdToCertificateCode[_tokenId];
        require(bytes(certificateCode).length > 0, "Token ID not found");
        return certificates[certificateCode];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

