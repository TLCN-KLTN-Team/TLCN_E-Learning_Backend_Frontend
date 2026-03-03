# Quiz Generation API Guide

## Overview

API để generate quiz từ context sử dụng AI service. API này gọi đến Python AI service để tạo các câu hỏi quiz dựa trên nội dung được cung cấp.

## Architecture

```
Client → Spring AI Service (Java) → Python AI Service (FastAPI) → LLM
```

## Endpoint

### Generate Quiz

**POST** `/ai/quiz/generate`

Generate quiz questions từ text content sử dụng AI.

#### Request Body

```json
{
  "context": "String - Nội dung text để generate quiz (required)",
  "questions": [
    {
      "type": "QuizType - Loại câu hỏi (required)",
      "numberOfQuestions": [
        {
          "difficulty": "QuizDifficulty - Độ khó (required)",
          "number": "Integer - Số lượng câu hỏi (min: 1, required)"
        }
      ]
    }
  ]
}
```

#### Quiz Types

- `SINGLE` - Single choice (một đáp án đúng)
- `MULTIPLE` - Multiple choice (nhiều đáp án đúng)
- `TRUE_FALSE` - True/False questions
- `FILL_BLANK` - Fill in the blank questions

#### Quiz Difficulty

- `EASY` - Dễ
- `MEDIUM` - Trung bình
- `HARD` - Khó

#### Example Request

```json
{
  "context": "Photosynthesis is the process used by plants to convert light energy into chemical energy. Plants use chlorophyll to absorb light energy from the sun. Carbon dioxide and water are converted into glucose and oxygen during this process.",
  "questions": [
    {
      "type": "SINGLE",
      "numberOfQuestions": [
        {
          "difficulty": "EASY",
          "number": 2
        },
        {
          "difficulty": "MEDIUM",
          "number": 1
        }
      ]
    },
    {
      "type": "MULTIPLE",
      "numberOfQuestions": [
        {
          "difficulty": "HARD",
          "number": 1
        }
      ]
    },
    {
      "type": "TRUE_FALSE",
      "numberOfQuestions": [
        {
          "difficulty": "EASY",
          "number": 2
        }
      ]
    }
  ]
}
```

#### Response

```json
{
  "code": "SYS_1000",
  "status": 200,
  "message": "Quiz generated successfully",
  "result": {
    "questions": [
      {
        "question_type": "SINGLE_CHOICE",
        "question": "What is photosynthesis?",
        "difficulty": "EASY",
        "score": 1,
        "tags": ["biology", "plants"],
        "options": [
          {
            "text": "Process of converting light to chemical energy",
            "is_correct": true
          },
          {
            "text": "Process of converting water to oxygen",
            "is_correct": false
          }
        ]
      },
      {
        "question_type": "MULTIPLE_CHOICE",
        "question": "What are the products of photosynthesis?",
        "difficulty": "HARD",
        "score": 2,
        "tags": ["biology", "chemistry"],
        "options": [
          {
            "text": "Glucose",
            "is_correct": true
          },
          {
            "text": "Oxygen",
            "is_correct": true
          },
          {
            "text": "Carbon dioxide",
            "is_correct": false
          }
        ]
      },
      {
        "question_type": "TRUE_FALSE",
        "question": "Plants use chlorophyll to absorb light energy",
        "difficulty": "EASY",
        "score": 1,
        "tags": ["biology"],
        "options": [
          {
            "text": "True",
            "is_correct": true
          },
          {
            "text": "False",
            "is_correct": false
          }
        ]
      },
      {
        "question_type": "FILL_IN_THE_BLANK",
        "question": "Plants convert _____ and _____ into glucose during photosynthesis",
        "difficulty": "MEDIUM",
        "score": 2,
        "tags": ["biology"],
        "options": [
          {
            "blank_number": 1,
            "answer": "carbon dioxide"
          },
          {
            "blank_number": 2,
            "answer": "water"
          }
        ]
      }
    ]
  }
}
```

## Response DTOs

### BaseQuestion (Abstract)

- `question`: String - Nội dung câu hỏi
- `difficulty`: String - Độ khó (EASY, MEDIUM, HARD)
- `score`: Integer - Điểm số (default: 1)
- `tags`: List<String> - Tags/keywords
- `question_type`: String - Loại câu hỏi (discriminator field)

### SingleChoiceQuestion

Extends BaseQuestion

- `options`: List<ChoiceOption> - Danh sách đáp án

### MultipleChoiceQuestion

Extends BaseQuestion

- `options`: List<ChoiceOption> - Danh sách đáp án

### TrueFalseQuestion

Extends BaseQuestion

- `options`: List<ChoiceOption> - 2 đáp án (True/False)

### FillInTheBlankQuestion

Extends BaseQuestion

- `options`: List<BlankOption> - Danh sách chỗ trống cần điền

### ChoiceOption

- `text`: String - Nội dung đáp án
- `is_correct`: Boolean - Đáp án có đúng không

### BlankOption

- `blank_number`: Integer - Số thứ tự chỗ trống
- `answer`: String - Đáp án đúng

## Error Codes

| Code    | Description                         | HTTP Status               |
| ------- | ----------------------------------- | ------------------------- |
| AI_9001 | AI service không khả dụng           | 503 Service Unavailable   |
| AI_9002 | Không thể tạo quiz từ AI service    | 500 Internal Server Error |
| AI_9003 | AI service timeout                  | 408 Request Timeout       |
| AI_9004 | Phản hồi từ AI service không hợp lệ | 500 Internal Server Error |

## Configuration

### application.yaml

```yaml
ai:
  service:
    quiz: http://localhost:8003/api/v1
```

## Timeout Settings

- WebClient timeout: 60 seconds
- Response timeout: 60 seconds

Được thiết kế để xử lý các LLM calls có thể mất thời gian.

## Usage Example (Java)

```java
@Autowired
private QuizService quizService;

public void generateQuizExample() {
    GenerateQuizRequest request = GenerateQuizRequest.builder()
        .context("Your learning content here...")
        .questions(List.of(
            GenerateQuizRequest.QuizTypeConfig.builder()
                .type(QuizType.SINGLE)
                .numberOfQuestions(List.of(
                    GenerateQuizRequest.QuizNumberConfig.builder()
                        .difficulty(QuizDifficulty.EASY)
                        .number(3)
                        .build()
                ))
                .build()
        ))
        .build();

    GenerateQuizResponse response = quizService.generateQuiz(request);

    // Process questions
    response.getQuestions().forEach(question -> {
        System.out.println("Question: " + question.getQuestion());
        System.out.println("Type: " + question.getQuestionType());
        System.out.println("Difficulty: " + question.getDifficulty());
    });
}
```

## Notes

1. **Validation**: Request body được validate tự động với Jakarta Validation
2. **Polymorphism**: Response sử dụng Jackson polymorphic deserialization với `@JsonTypeInfo` và `@JsonSubTypes`
3. **Error Handling**: Tất cả errors được handle centrally bởi GlobalExceptionHandler
4. **Logging**: Service logs request và response details cho debugging
5. **Timeout**: 60 giây timeout được cấu hình để xử lý LLM processing time

## Python AI Service Requirements

Python service phải expose endpoint:

- **POST** `/generate`
- Accept: `GenerateQuizRequest` JSON
- Return: `GenerateQuizResponse` JSON

Format phải match chính xác với các DTOs đã định nghĩa ở trên.
