import { useState } from "react";
import { FileText, Send, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ExerciseComponentProps {
  channelName: string;
  onSubmit?: () => void;
  isTimeExpired?: boolean;
}

const ExerciseComponent = ({
  channelName,
  onSubmit,
  isTimeExpired = false,
}: ExerciseComponentProps) => {
  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Vui lòng nhập câu trả lời trước khi nộp bài!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would call actual submission API
      console.log("Submitting exercise answer:", answer);

      setIsSubmitted(true);
      toast.success("Nộp bài thành công!");

      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error("Error submitting exercise:", error);
      toast.error("Lỗi khi nộp bài. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-semibold text-green-800">
            Đã nộp bài thành công!
          </h3>
        </div>
        <div className="bg-white p-4 rounded-md border border-green-200">
          <p className="text-sm text-gray-600 mb-2">Câu trả lời đã nộp:</p>
          <p className="text-gray-800">{answer}</p>
        </div>
        <p className="text-sm text-green-600 mt-3">
          Bài tập đã được nộp thành công. Vui lòng chờ giảng viên chấm điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <FileText className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Bài tập - {channelName}
        </h3>
      </div>

      {/* Exercise Question */}
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h4 className="font-medium text-blue-800 mb-2">Câu hỏi:</h4>
        <p className="text-blue-700">
          Hãy viết một đoạn văn ngắn (150-200 từ) về chủ đề: "Tầm quan trọng của
          việc học tập trực tuyến trong thời đại số hóa".
        </p>
      </div>

      {/* Answer Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Câu trả lời của bạn:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Nhập câu trả lời của bạn tại đây..."
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />

        {/* Character count */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{answer.length} ký tự</span>
          <span
            className={
              answer.length < 150 ? "text-yellow-600" : "text-green-600"
            }
          >
            {answer.length < 150 ? "Cần ít nhất 150 ký tự" : "Đủ độ dài"}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        {isTimeExpired && !isSubmitted ? (
          <div className="text-center space-y-2">
            <button
              disabled
              className="flex items-center space-x-2 px-6 py-2 bg-red-500 text-white font-medium rounded-md cursor-not-allowed opacity-60"
            >
              <span>Hết thời gian</span>
            </button>
            <p className="text-sm text-red-600">
              Thời gian làm bài đã kết thúc. Bài tập sẽ được tự động nộp.
            </p>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answer.length < 150}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang nộp bài...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Nộp bài</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong>Lưu ý:</strong> Bạn chỉ có thể nộp bài một lần. Hãy kiểm tra
          kỹ câu trả lời trước khi nộp. Bài tập sẽ tự động nộp khi hết thời
          gian.
        </p>
      </div>
    </div>
  );
};

export default ExerciseComponent;
