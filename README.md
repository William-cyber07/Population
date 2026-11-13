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
Create a `.env` file in the root (copy `.env.example`) and fill in real values. Never commit `.env`.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=population_app
DB_PASSWORD=your_app_user_password
DB_DATABASE=williamdb
PORT=3000

# Required, at least 32 characters each. Generate with:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=24h
PASSWORD_PEPPER=your_long_random_password_pepper

# Optional transport hardening
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
COOKIE_SECURE=false
TWO_FACTOR_ISSUER=AHIES Population Survey
```

Set up the Database:

Open MySQL Workbench.

Create a new database named `williamdb`.

Run the schema (`db/Query.sql`) to create the tables and seed initial data.

Apply the security migrations in order:

```bash
mysql -u root -p williamdb < db/migrations/001_p0_security.sql
mysql -u root -p williamdb < db/migrations/002_p1_security.sql
```

Create a least-privilege application user (do not run the app as `root`):

```sql
CREATE USER 'population_app'@'localhost' IDENTIFIED BY 'your_app_user_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON williamdb.* TO 'population_app'@'localhost';
FLUSH PRIVILEGES;
```

(Optional) Run `node reset-passwords.js` to reset the seeded accounts. Passwords are hashed with the app pepper, so `PASSWORD_PEPPER` must already be set in `.env`.

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
Create a `.env.local` file in the root (copy `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Must match the backend JWT_SECRET exactly; proxy.ts verifies the session cookie with it.
JWT_SECRET=your_long_random_jwt_secret
```
Start the frontend:

bash
npm run dev
Open your browser to: http://localhost:3001

🔑 Default Login Credentials
Role	    Username	Password
Admin	     admin	    admin123
FieldUser	fielduser	user123