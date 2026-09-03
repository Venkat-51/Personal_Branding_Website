# y2solutions — Personal Branding Portfolio & Web App

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A high-end personal branding website and digital portfolio for **Venkateswaran G (y2solutions)** — Junior Freelance Web Developer. Designed with precision, modern typography, glassmorphic UI components, and backed by a robust Node.js/Express service with automated dual email notification dispatching.

---

## 🌟 Key Features

- 🎨 **Modern & Aesthetic UI/UX**: Built with Tailwind CSS, Google Fonts (*Inter*), Material Symbols, glassmorphic headers, and smooth-scrolling animations.
- 📱 **Fully Responsive Layout**: Optimized for seamless viewing across smartphones, tablets, laptops, and ultra-wide desktops.
- ⚡ **Instant Contact Form**: Asynchronous, non-blocking form handling delivering under-200ms user feedback with backend validation.
- 📧 **Dual Email Notification System**:
  - **Primary**: Nodemailer with Gmail SMTP SSL integration.
  - **Fallback**: Brevo (Sendinblue) REST API integration.
  - **Automated Customer Confirmations**: Sends instant auto-reply confirmation emails to clients upon submission.
- 💾 **Submission Data Persistence**: Safely stores contact form submissions in JSON format (`submissions.json` or dynamic cloud `/tmp` directory on Vercel/Render).
- 🚀 **Multi-Cloud Deployment Ready**: Pre-configured configurations for **Vercel** serverless functions and **Render** web services.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Semantic mark-up & custom CSS utility tokens (`styles.css`).
- **Tailwind CSS**: Utility-first CSS styling via CDN with customized color palette tokens.
- **JavaScript (ES6+)**: Dynamic UI interactivity, form handling (`app.js`).

### Backend
- **Node.js & Express.js**: REST API server managing API routes, CORS policies, static assets, and request processing.
- **Nodemailer**: Node.js module for sending emails via Gmail SMTP.
- **Dotenv**: Environment variable management.

### Deployment & Infra
- **Vercel**: Serverless rewrite setup via `vercel.json` & `/api/index.js`.
- **Render**: Infrastructure as Code setup via `render.yaml`.

---

## 📁 Repository Structure

```
Personal BRANDING/
├── api/
│   └── index.js              # Serverless entrypoint for Vercel deployment
├── backend/
│   ├── data/
│   │   └── submissions.json  # Local storage for contact submissions
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend dependencies & scripts
│   └── server.js             # Primary Express server & email engine
├── frontend/
│   ├── public/               # Favicon & media assets
│   ├── app.js                # Frontend client-side JS logic
│   ├── index.html            # Main portfolio HTML document
│   └── styles.css            # Custom CSS & design system tokens
├── package.json              # Root project scripts & meta
├── render.yaml               # Render Infrastructure deployment blueprint
├── vercel.json               # Vercel deployment & routing config
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher

### Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Venkat-51/Personal_Branding_Website.git
   cd Personal_Branding_Website
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` directory (or copy from `.env.example`):
   ```bash
   cp backend/.env.example backend/.env
   ```

   Fill in your configuration credentials:
   ```env
   PORT=5000
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   EMAIL_USER=gvenkateswaran3@gmail.com
   EMAIL_PASS=your_gmail_app_password
   BREVO_API_KEY=your_brevo_api_key_optional
   ```

4. **Run the Application**:
   - **Start backend server & serve frontend**:
     ```bash
     npm start
     ```
   - Open your browser and navigate to `http://localhost:5000`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning system status and mailer configs |
| `POST` | `/api/contact` | Submit contact inquiry (Triggers email notifications & auto-reply) |
| `GET` | `/api/contact` | Retrieve list of submitted inquiries (Admin route) |

### Sample Contact Request (`POST /api/contact`)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "service": "Web Application Development",
  "message": "Looking to build a custom dashboard web application."
}
```

---

## ☁️ Deployment

### Deploying to Vercel
The project includes a root `vercel.json` configured for zero-config serverless backend routes (`/api/*`) and static frontend hosting.
1. Import the repository on [Vercel](https://vercel.com).
2. Set Environment Variables (`EMAIL_USER`, `EMAIL_PASS`, `BREVO_API_KEY`).
3. Deploy!

### Deploying to Render
Use the included `render.yaml` file for continuous deployment on Render:
1. Connect your repository to [Render Blueprint](https://render.com).
2. Render will automatically provision both the **Express Web Service** and the **Static Frontend Service**.

---

## 📬 Contact & Support

**Venkateswaran G**  
- **Email**: [gvenkateswaran3@gmail.com](mailto:gvenkateswaran3@gmail.com)  
- **Brand**: y2solutions  
- **Role**: Junior Freelance Web Developer  

---

*Built with precision & passion by Venkateswaran G.*
