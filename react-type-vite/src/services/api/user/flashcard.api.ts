import axios from "axios";
import type {
  FlashCardRequest,
  FlashCardResponse,
  SaveFlashcardSetRequest,
} from "@/types/flashcard.type";
import axiosInstance from "../httpClient/axiosInstance";

const PYTHON_FLASHCARD_API = "http://localhost:8002/api/v1/flashcards";
const FLASHCARD_API = "/ai/flashcards";

/**
 * Generate flashcards using AI from the Python backend
 */
export const generateFlashcards = async (
  request: FlashCardRequest,
): Promise<FlashCardResponse> => {
  const response = await axios.post<FlashCardResponse>(
    `${PYTHON_FLASHCARD_API}/generate`,
    request,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

export const saveFlashcardSet = async (
  flashcardSetRequest: SaveFlashcardSetRequest
): Promise<any> => {
  const savedFlashcardSetResponse = await axiosInstance.post(
    `${FLASHCARD_API}/save`,
    flashcardSetRequest
  );

  if (savedFlashcardSetResponse.status === 200) {
    return savedFlashcardSetResponse.data;
  } else {
    throw new Error("Failed to save flashcard set");
  }
};

export default {
  generateFlashcards,
  saveFlashcardSet,
};
