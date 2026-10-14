# Disaster Management System

A full-stack web application designed to support disaster reporting, incident monitoring, emergency response coordination, and disaster management activities. The system aims to connect citizens and response teams through a centralized platform for reporting incidents and managing disaster-related information.

## 📌 Project Overview

The **Disaster Management System** is developed as part of the Full Stack Web Engineering course at KL University. It provides a digital platform to report disasters, track incidents, and support emergency response operations.

The application combines a React-based frontend with a Spring Boot backend and a PostgreSQL database to manage disaster-related data efficiently.

## 🎯 Objectives

- Provide a platform for reporting disaster incidents.
- Maintain disaster reports and incident details.
- Track incident locations and severity.
- Support emergency response coordination.
- Provide a user-friendly interface for disaster-related information.
- Store and manage application data securely.

## ✨ Key Features

- **User Authentication:** User registration and login.
- **Disaster Reporting:** Submit reports about disaster incidents.
- **Incident Management:** Store and manage incident details, including location, description, and severity.
- **Location Information:** Display geographical information associated with reported incidents.
- **Dashboard:** View and monitor disaster-related information.
- **Database Integration:** Store application data using PostgreSQL.
- **Responsive Interface:** Access the application through a modern web interface.

## 🛠️ Technologies Used

### Frontend
- React
- TypeScript
- Vite
- HTML5
- CSS3
- JavaScript

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Maven
- REST APIs

### Database
- PostgreSQL

### Development Tools
- Visual Studio Code
- IntelliJ IDEA (optional)
- Git
- GitHub
- Postman (for API testing)

## 🏗️ System Architecture

The application follows a three-layer architecture:

1. **Presentation Layer:** The React frontend provides the user interface.
2. **Application Layer:** The Spring Boot backend handles business logic, authentication, and API requests.
3. **Data Layer:** PostgreSQL stores user information and disaster report data.

```text
+------------------------------+
|       React Frontend         |
|     TypeScript + Vite        |
+--------------+---------------+
               |
               | REST API Requests
               v
+------------------------------+
|      Spring Boot Backend     |
| Java + Spring Security + JPA |
+--------------+---------------+
               |
               | Database Queries
               v
+------------------------------+
|       PostgreSQL DB          |
|   Users and Disaster Reports |
+------------------------------+
```

## 📂 Project Structure

```text
Disaster_Management_updated/
│
├── Disaster-Managementt/       # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .gitignore
│
├── Disaster_Management/        # Spring Boot backend
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── pom.xml
│   └── Dockerfile
│
└── README.md
```

## ⚙️ Prerequisites

Install the following software before running the project:

- Node.js and npm
- Java JDK 21
- PostgreSQL
- Git

## 🚀 How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/gousie/Disaster-Management-Project.git
cd Disaster-Management-Project
```

### 2. Configure the Database

1. Start PostgreSQL.
2. Create a database named `Disaster_Management`, or use the database name configured in your backend.
3. Configure the database URL, username, and password using environment variables or your local application configuration.

### 3. Run the Backend

Open a terminal in the backend folder:

```bash
cd Disaster_Management
```

Run the Spring Boot application using Maven:

```bash
mvn spring-boot:run
```

The backend is configured to run on port `8081` by default, unless another port is configured.

### 4. Configure and Run the Frontend

Open another terminal in the frontend folder:

```bash
cd Disaster-Managementt
npm install
```

Create a local `.env` file in the frontend folder with the backend API URL:

```env
VITE_API_URL=http://localhost:8081/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

**Note:** Ensure PostgreSQL is running and the backend database credentials and required environment variables are configured before starting the application.

## 🔐 Security

- Authentication and backend security are handled through Spring Security.
- Keep database passwords, JWT secrets, email credentials, and payment gateway secrets out of source control.
- Configure sensitive values through environment variables.
- Do not upload real credentials or private `.env` files to GitHub.

## 👥 Project Team

**Team Leader**

- **Name:** Shaik Gouse Basha
- **Student ID:** 2601150020

**Team Member**

- **Name:** Nethala Joshua Solomon
- **Student ID:** 2601150048

**Institution:** KL University

**Course:** Full Stack Web Engineering

## 🔮 Future Enhancements

- Real-time disaster alerts and notifications.
- Interactive maps for incident visualization.
- Integration with weather and disaster monitoring services.
- Volunteer and emergency resource coordination.
- Advanced analytics and disaster trend visualization.
- Deployment to a cloud platform for public access.

## 📄 License

This project was developed for academic purposes as part of the Full Stack Web Engineering course at KL University.

---

**Disaster Management System — Technology for safer communities.**
