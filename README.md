# DealHub 🚀

DealHub is a full-stack enterprise web platform designed  **Facility Agreements**.  
It enables Agents, Lenders, and Admins to collaborate on the same validated agreement data through a secure, role-based system.

This repository is structured as a **monorepo** containing both backend and frontend applications.

---

## 🧱 Architecture Overview


---

## 🛠️ Technologies Used

### Backend
- **Java 17**
- **Spring Boot**
- Spring Security (JWT)
- Spring Data JPA
- MySQL
- REST APIs
- Maven

### Frontend
- **React.js**
- TypeScript
- Vite
- Tailwind CSS
- Axios

### Dev & Tools
- Git / GitHub / Bitbucket
- Swagger / OpenAPI
- RESTful architecture

---

## 🔐 User Roles

- **Admin**
  - Manage users and platform configuration
- **Agent**
  - Upload and manage Facility Agreements
  - Trigger document extraction
  - Validate agreement data
- **Lender**
  - View validated deal information
  - Access lender-specific payloads
  - Communicate with Agents

---

## ⚙️ Backend Setup (Local)
```bash
cd dealhub-backend
mvn clean install
mvn spring-boot:run
```

## 🎨 Frontend Setup (Local)
```bash
cd dealhub-frontend
npm install
npm run dev
