# Population Survey System (AHIES)

A comprehensive, full-stack **Field Survey Management System** built for the Ghana Annual Household Income and Expenditure Survey (AHIES). This system allows Administrators to manage users and data, and Field Users to collect detailed citizen data in the field.

## 🚀 Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL (via `mysql2`)
- **Authentication:** JSON Web Tokens (JWT) with Cookie-based sessions
- **Password Security:** `bcryptjs` (Hashing) & `bcrypt` comparison

## ✨ Features

### 👨‍💼 Admin Portal
- Secure login and logout.
- **Review Dashboard:** View, Approve, or Reject pending survey submissions from Field Users.
- **Configuration Panel:** Dynamically manage lookup tables (Regions, Districts, Marital Status, Education Levels, etc.).
- **Create Field Users:** Generate unique usernames and temporary passwords for new Field Staff. Assign them to specific districts.
- **View All Citizens:** Browse all collected citizen data and view their full profiles (Education, Health, Employment).

### 🏃‍♂️ Field User Portal
- Secure login and logout.
- **Assigned Zone Dashboard:** View assigned district and pending submission counts.
- **Create Household:** Register new households within their assigned cluster.
- **Enter Citizen Facts:** Comprehensive forms to collect detailed demographic, migration, education, health, disability, and employment data.
- **Sync Pending Submissions:** Upload draft surveys to the Admin for review.

## 🏗️ System Architecture (Workflow)

1. **Field User** logs in and creates a new Household.
2. **Field User** enters citizen facts (Basic Info, Education, Health, Employment).
3. **Field User** clicks "Sync" to move the data from `Draft` to `Pending Review`.
4. **Admin** logs in, reviews the pending surveys, and either **Approves** or **Rejects** them (with a reason).
5. **Admin** can view all approved data across the entire system.

## 🛠️ Installation & Setup (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- MySQL Workbench (Optional, for GUI database management)

### 1. Clone the Repository
```bash
git clone https://github.com/William-cyber07/Population.git
cd Population

 2. Set up the Backend
Navigate to the backend folder (if not already there):

bash
cd population-project
Install dependencies:

bash
npm install
Create a .env file in the root and add the following:

env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=williamdb
PORT=3000
Set up the Database:

Open MySQL Workbench.

Create a new database named williamdb.

Run the SQL script (setup.sql or the provided schema) to create all tables and seed initial data.

(Optional) Run node reset-passwords.js or node fix-final-password.js to ensure the admin and fielduser accounts are correctly configured with your local bcrypt settings.

Start the backend:

bash
node index.js


3. Set up the Frontend
Open a new terminal and navigate to the frontend folder:

bash
cd ahies-frontend
Install dependencies:

bash
npm install
Create a .env.local file in the root:

env
NEXT_PUBLIC_API_URL=http://localhost:3000
Start the frontend:

bash
npm run dev
Open your browser to: http://localhost:3001

🔑 Default Login Credentials
Role	    Username	Password
Admin	     admin	    admin123
FieldUser	fielduser	user123