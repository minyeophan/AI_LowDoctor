# API 명세 (초안)

## 1. 파일 업로드

### POST /upload
- Request: multipart/form-data
  - file: 계약서 PDF 또는 이미지

- Response (성공):
```json
{
  "document_id": "uuid-1234",
  "status": "uploaded"
}
```

- Response (실패):
```json
{
  "status": "error",
  "error_code": "UPLOAD_FAILED",
  "message": "파일 업로드 실패"
}
```

