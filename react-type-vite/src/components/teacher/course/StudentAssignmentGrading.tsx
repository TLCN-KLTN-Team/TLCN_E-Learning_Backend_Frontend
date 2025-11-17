import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Send, Clock, AlertCircle, 
  Loader2, ArrowRight, CheckCircle, FileText, TrendingUp
} from 'lucide-react';
import * as assignmentGradingApi from '@/services/api/teacher/assignmentGradingApi';
import type { AssignmentSubmissionResponse } from '@/services/api/response/assignmentSubmissionResponse';
import type { GradingStatisticsResponse } from '@/services/api/response/gradingStatisticsResponse';
import { useSelectedClass } from '@/context/teacher/SelectedClassContext';

interface StudentAssignmentGradingProps {
  courseId: number;
}

const StudentAssignmentGrading: React.FC<StudentAssignmentGradingProps> = ({  
}) => {
  // Get selectedClass from context
  const { selectedClass } = useSelectedClass();

  const [submissions, setSubmissions] = useState<AssignmentSubmissionResponse[]>([]);
  const [statistics, setStatistics] = useState<GradingStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'graded'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmissionResponse | null>(null);
  const [gradingScore, setGradingScore] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  // Debug: Log when component mounts and when selectedClass changes
  useEffect(() => {
    console.log('StudentAssignmentGrading mounted');
    console.log('Selected Class:', selectedClass);
  }, [selectedClass]);

  // Fetch data when class is selected
  useEffect(() => {
    if (!selectedClass) {
      console.log('No class selected, clearing data');
      setSubmissions([]);
      setStatistics(null);
      setError(null);
      return;
    }
    
    console.log('Class selected, fetching data for classId:', selectedClass.id);
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    if (!selectedClass) {
      console.log('fetchData called but no class selected');
      return;
    }

    console.log('Starting to fetch data for class:', selectedClass.id);
    setLoading(true);
    setError(null);

    try {
      // Fetch submissions
      console.log('Fetching submissions...');
      const submissionsData = await assignmentGradingApi.getSubmissionsForClass(selectedClass.id);
      console.log('Submissions data received:', submissionsData);
      
      // Transform data to flat submission list
      const allSubmissions = submissionsData.flatMap(student => 
        student.latestSubmissions.map(submission => ({
          ...submission,
          studentName: student.studentName,
          email: student.email,
        }))
      );
      
      console.log('Transformed submissions:', allSubmissions);
      setSubmissions(allSubmissions);

      // Fetch statistics
      console.log('Fetching statistics...');
      const statsData = await assignmentGradingApi.getGradingStatistics(selectedClass.id);
      console.log('Statistics data received:', statsData);
      setStatistics(statsData);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu';
      setError(errorMessage);
      alert('Không thể tải dữ liệu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradingScore) {
      console.log('Cannot grade: missing submission or score');
      return;
    }

    console.log('Grading submission:', {
      submissionId: selectedSubmission.id,
      score: gradingScore,
      feedback: gradingFeedback
    });

    setGrading(true);
    try {
      const updatedSubmission = await assignmentGradingApi.gradeSubmission(
        selectedSubmission.id,
        {
          submissionId: selectedSubmission.id,
          score: parseFloat(gradingScore),
          feedback: gradingFeedback,
        }
      );

      console.log('Grade submitted successfully:', updatedSubmission);

      // Update submission in list
      setSubmissions(prev => prev.map(s => 
        s.id === selectedSubmission.id ? { ...s, ...updatedSubmission } : s
      ));

      // Refresh statistics
      if (selectedClass) {
        const statsData = await assignmentGradingApi.getGradingStatistics(selectedClass.id);
        setStatistics(statsData);
      }

      // Reset form
      setGradingScore('');
      setGradingFeedback('');
      setSelectedSubmission(null);

      alert('Chấm điểm thành công!');
    } catch (error: any) {
      console.error('Error grading submission:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể chấm điểm';
      alert('Không thể chấm điểm: ' + errorMessage);
    } finally {
      setGrading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.idUser?.includes(searchTerm) ||
      submission.assignmentTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && !submission.score) ||
      (filterStatus === 'graded' && submission.score !== null);

    return matchesSearch && matchesFilter;
  });

  // No class selected
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Chấm Bài Tập</h2>
          <p className="text-gray-600">Chấm điểm và phản hồi bài tập của sinh viên</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Vui lòng chọn một lớp học</p>
          <p className="text-sm text-gray-500 mb-4">
            Đi tới Quản Lý Lớp Học để chọn một lớp trước khi chấm bài tập.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <ArrowRight className="h-4 w-4" />
            Quản Lý Lớp Học <ArrowRight className="h-4 w-4" /> Chọn Lớp
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Chấm Bài Tập</h2>
          <p className="text-gray-600">
            Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Chấm Bài Tập</h2>
          <p className="text-gray-600">
            Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
          </p>
        </div>
        <div className="border-2 border-red-200 bg-red-50 rounded-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Có lỗi xảy ra</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Chấm Bài Tập</h2>
        <p className="text-gray-600">
          Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng Bài Tập</p>
                <p className="text-2xl font-bold">{statistics.totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã Chấm</p>
                <p className="text-2xl font-bold">{statistics.gradedSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chờ Chấm</p>
                <p className="text-2xl font-bold">{statistics.pendingSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiến Độ</p>
                <p className="text-2xl font-bold">{statistics.gradingProgress.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, MSSV, hoặc tên bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="inline h-4 w-4 mr-2" />
            Tất cả
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Chưa chấm
          </button>
          <button
            onClick={() => setFilterStatus('graded')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'graded'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Đã chấm
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {submissions.length === 0 
                ? 'Chưa có bài nộp nào trong lớp này' 
                : 'Không tìm thấy bài tập nào phù hợp với bộ lọc'}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={`bg-white border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedSubmission?.id === submission.id ? 'ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{submission.assignmentTitle}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        submission.score !== null
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {submission.score !== null ? 'Đã chấm' : 'Chưa chấm'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-900">
                        {submission.studentName || submission.idUser}
                      </p>
                      <p className="text-xs">{submission.idUser}</p>
                    </div>
                    <div>
                      <p className="font-medium">Nộp Bài</p>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Điểm</p>
                      <p className="text-base font-bold text-blue-600">
                        {submission.score !== null 
                          ? `${submission.score}/${submission.maxScore || 100}` 
                          : 'Chưa chấm'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Tệp</p>
                      {submission.submissionFiles && submission.submissionFiles.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(submission.submissionFiles![0], '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Tải xuống
                        </button>
                      ) : (
                        <p className="text-gray-400 text-sm">Không có file</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Content & Grading Panel */}
              {selectedSubmission?.id === submission.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                  {/* Submission Content Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Nội dung bài nộp
                    </h4>
                    
                    {/* Submission Text */}
                    {submission.submissionText && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Văn bản:</p>
                        <div className="bg-white border border-gray-200 rounded p-3 max-h-60 overflow-y-auto">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {submission.submissionText}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submission Link */}
                    {submission.submissionLink && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Liên kết:</p>
                        <a
                          href={submission.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                        >
                          {submission.submissionLink}
                        </a>
                      </div>
                    )}

                    {/* Submission Files */}
                    {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Tệp đính kèm ({submission.submissionFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {submission.submissionFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white border border-gray-200 rounded p-2"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">
                                  {file.split('/').pop() || `File ${index + 1}`}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(file, '_blank');
                                }}
                                className="ml-2 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded flex items-center gap-1 flex-shrink-0"
                              >
                                <Download className="h-3 w-3" />
                                Tải xuống
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Content Message */}
                    {!submission.submissionText && 
                     !submission.submissionLink && 
                     (!submission.submissionFiles || submission.submissionFiles.length === 0) && (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Không có nội dung bài nộp</p>
                      </div>
                    )}

                    {/* Previous Feedback (if already graded) */}
                    {submission.feedback && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Phản hồi trước:</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {submission.feedback}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grading Form */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-4">
                      {submission.score !== null ? 'Cập nhật điểm' : 'Chấm bài'}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Điểm (Tối đa: {submission.maxScore || 100} điểm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={submission.maxScore || 100}
                          step="0.5"
                          placeholder={submission.score !== null ? `Điểm hiện tại: ${submission.score}` : 'Nhập điểm...'}
                          value={gradingScore}
                          onChange={(e) => setGradingScore(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phản hồi mới</label>
                        <textarea
                          placeholder="Nhập nhận xét cho sinh viên..."
                          value={gradingFeedback}
                          onChange={(e) => setGradingFeedback(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleGradeSubmission}
                          disabled={grading || !gradingScore}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {grading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {submission.score !== null ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(null);
                            setGradingScore('');
                            setGradingFeedback('');
                          }}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentGrading;