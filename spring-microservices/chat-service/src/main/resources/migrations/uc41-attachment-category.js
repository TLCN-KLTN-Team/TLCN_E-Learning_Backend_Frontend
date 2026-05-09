// UC-41 — Migration: gán category=GENERAL cho mọi attachment cũ chưa có field này.
//
// Chạy:
//     mongosh "<MONGO_URI>" --file uc41-attachment-category.js
// hoặc bên trong shell:
//     load("uc41-attachment-category.js")
//
// Idempotent: chỉ update document có category null/missing, lần chạy sau là no-op.

(function () {
    const filter = { category: { $in: [null] } };
    const update = { $set: { category: "GENERAL" } };
    const result = db.attachments.updateMany(filter, update);
    print(
        "[UC-41 migration] attachments.category=GENERAL — matched: " +
            result.matchedCount +
            ", modified: " +
            result.modifiedCount,
    );
})();
