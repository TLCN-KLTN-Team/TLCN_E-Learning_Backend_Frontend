import axiosInstance from "../httpClient/axiosInstance";

const FILE_PREFIX = "/file-handler/pdf/export";

/**
 * Calls file-service to render a PDF profile of an educational unit
 * and returns the binary blob, ready to be saved by the browser.
 */
const exportEducationalUnitProfile = async (
  unitId: number
): Promise<Blob> => {
  const response = await axiosInstance.get<Blob>(
    `${FILE_PREFIX}/educational-unit/${unitId}`,
    {
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    }
  );

  return response.data;
};

/**
 * Triggers a browser download for an arbitrary blob.
 * Creates a temporary anchor, clicks it, then revokes the object URL.
 */
const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * High-level helper: fetch the PDF and trigger the browser download.
 * Pass the unit name so the saved file has a human-friendly name.
 */
const downloadEducationalUnitProfile = async (
  unitId: number,
  unitName?: string
): Promise<void> => {
  const blob = await exportEducationalUnitProfile(unitId);
  const safeName = (unitName || `unit-${unitId}`)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();
  downloadBlob(blob, `ho-so-${safeName}.pdf`);
};

export default {
  exportEducationalUnitProfile,
  downloadEducationalUnitProfile,
  downloadBlob,
};
