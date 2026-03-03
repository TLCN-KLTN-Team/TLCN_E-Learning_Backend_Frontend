/**
 * This module provides API functions related to quiz management for teachers.
 */


/**
    * Summarize the content of an uploaded file and return a summary string.
*/
const summarizeExtractionFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const summaryFromQuizServiceResponse = await fetch(
            "http://localhost:8000/api/v1/parser/summarize",{
                method: "POST",
                body: formData,
            }
        );
        return summaryFromQuizServiceResponse;
    } catch (error) {
    console.error("Upload error:", error);
  }

}

export default {
    summarizeExtractionFile,
}