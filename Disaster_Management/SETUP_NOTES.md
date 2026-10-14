# DISASTRA Backend

## Configure application.properties
- razorpay.key.id / razorpay.key.secret
- spring.mail.username / spring.mail.password (Gmail app password)
- app.mail.from

## Image uploads
POST /api/media/upload (multipart file) → { url, fileUrl }
Files stored in ./uploads and served at http://localhost:8081/uploads/...

## Run
mvn spring-boot:run
