# DISASTRA Frontend

```bash
npm install
npm run dev
```

API default: http://localhost:8081/api

## Image fix
Images are uploaded to the backend (`POST /api/media/upload`) and the permanent `/uploads/...` URL is saved on the disaster.
Do NOT rely on data-URLs — they caused images to revert to random fallbacks.

## Payment success
After Razorpay success, a designed modal shows amount, payment ID, and email confirmation note.
