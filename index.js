const pool = require('./db/pool');
const express = require('express');

const personRepo = require('./repositories/personrepository');
const educationService = require('./services/educationservice');
const healthService =require('./services/healthservice');
const employmentService = require('./services/employmentservice');
const personService = require('./services/personService');
const lookupService = require('./services/lookupService');
const authService = require('./services/authService');

const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true 
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---

/**
 * GET /api/persons-round/:id
 */
app.get('/api/persons-round/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const personRound = await personRepo.getPersonRoundById(id);

        if (!personRound) {
            return res.status(404).json({ error: 'Person round not found' });
        }

        res.json(personRound);
    } catch (error) {
        console.error('Error fetching person:', error);
        res.status(500).json({ error: 'Failed to fetch person' });
    }
});

app.post('/api/persons', async (req, res) => {
    try {
        // Call the repository to create the person
        // We will pass 'status' and 'created_by' inside req.body
        const result = await personRepo.createPersonAndRound(req.body);
        
        res.status(201).json({
            message: 'Person created successfully',
            data: result
        });
    } catch (error) {
        console.error('========================================');
        console.dir(error, { depth: null });
        console.error('========================================');
        
        // Send the actual MySQL error message to the frontend if available
        const errorMessage = error.sqlMessage || 'Failed to create person';
        res.status(500).json({ error: errorMessage });
    }
});

 
app.post('/api/education', async (req, res) => {
    try {
        const result = await educationService.saveEducationRecord(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error saving education record:', error);
        res.status(500).json({ error: 'An error occurred while saving the education record.' });
    }
});

app.post('/api/health', async (req, res) => {
    try{
        const results = await healthService.saveHealthRecord(req.body);
        res.status(201).json(results);
    } catch (error) {
        console.error('Error saving health record:', error);
        res.status(500).json({ error : 'n error occurred while saving the health record.'})
    }
})

app.post('/api/employment',async (req, res)=>{
    try{
        const results = await employmentService.savaEmploymentRecord(req.body);
        res.status(201).json(results);
    } catch (error) {
        console.error('Error saving Eployment record:', error);
        res.status(500).json({ error :' error occurred while trying to save the employment record.'})
    }
})


/**
 * GET /api/persons-full/:id
 * Returns the full profile of the person (including education, health, etc.)
 */
app.get('/api/persons-full/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const fullProfile = await personRepo.getFullPersonProfile(id);

        if (!fullProfile) {
            return res.status(404).json({ error: 'Person not found' });
        }

        res.json(fullProfile);
    } catch (error) {
        console.error('Error fetching full profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * DELETE /api/persons/:id
 * Deletes the person and all their associated data (education, health, etc.)
 */
app.delete('/api/persons/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await personRepo.deletePersonAndAllData(id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting person:', error);
        res.status(500).json({ error: 'Failed to delete person' });
    }
});

// --- SECONDARY JOB ROUTES ---

// GET: Read the secondary job
app.get('/api/employment/secondary/:person_round_id', async (req, res) => {
    try {
        const id = parseInt(req.params.person_round_id);
        const data = await employmentService.getSecondaryJob(id);
        if (!data) return res.status(404).json({ error: 'Secondary job not found' });
        res.json(data);
    } catch (error) {
        console.error('Error fetching secondary job:', error);
        res.status(500).json({ error: 'Failed to fetch secondary job' });
    }
});

// PUT: Create or Update the secondary job (CRUD Update)
app.put('/api/employment/secondary', async (req, res) => {
    try {
        const result = await employmentService.upsertSecondaryJobRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving secondary job:', error);
        res.status(500).json({ error: 'Failed to save secondary job' });
    }
});

// DELETE: Delete the secondary job
app.delete('/api/employment/secondary/:person_round_id', async (req, res) => {
    try {
        const id = parseInt(req.params.person_round_id);
        const result = await employmentService.deleteSecondaryJobRecord(id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting secondary job:', error);
        res.status(500).json({ error: 'Failed to delete secondary job' });
    }
});

//Fetch all person rounds (for the frontend list)
app.get('/api/persons', async (req, res) => {
    try {
        const query = `
            SELECT 
                pr.person_round_id,
                p.personid,
                pr.sex,
                pr.age_years
            FROM person_round pr
            JOIN person p ON pr.person_id = p.person_id
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all persons:', error);
        res.status(500).json({ error: 'Failed to fetch persons' });
    }
});

// --- WORK HISTORY ROUTES ---
app.get('/api/employment/history/:person_round_id', async (req, res) => {
    try {
        const data = await employmentService.getWorkHistoryRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch work history' });
    }
});
app.put('/api/employment/history', async (req, res) => {
    try {
        const result = await employmentService.saveWorkHistoryRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save work history' });
    }
});
app.delete('/api/employment/history/:person_round_id', async (req, res) => {
    try {
        const result = await employmentService.deleteWorkHistoryRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete work history' });
    }
});

// --- UNDEREMPLOYMENT ROUTES ---
app.get('/api/employment/underemployment/:person_round_id', async (req, res) => {
    try {
        const data = await employmentService.getUnderemploymentRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch underemployment' });
    }
});
app.put('/api/employment/underemployment', async (req, res) => {
    try {
        const result = await employmentService.saveUnderemploymentRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save underemployment' });
    }
});
app.delete('/api/employment/underemployment/:person_round_id', async (req, res) => {
    try {
        const result = await employmentService.deleteUnderemploymentRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete underemployment' });
    }
});

// --- JOB SEARCH ROUTES ---
app.get('/api/employment/job-search/:person_round_id', async (req, res) => {
    try {
        const data = await employmentService.getJobSearchRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch job search' });
    }
});
app.put('/api/employment/job-search', async (req, res) => {
    try {
        const result = await employmentService.saveJobSearchRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save job search' });
    }
});
app.delete('/api/employment/job-search/:person_round_id', async (req, res) => {
    try {
        const result = await employmentService.deleteJobSearchRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete job search' });
    }
});

// --- WORKPLACE SAFETY ROUTES ---
app.get('/api/workplace-safety/:person_round_id', async (req, res) => {
    try {
        const data = await employmentService.getWorkplaceSafetyRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch workplace safety' });
    }
});
app.put('/api/workplace-safety', async (req, res) => {
    try {
        const result = await employmentService.saveWorkplaceSafetyRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save workplace safety' });
    }
});
app.delete('/api/workplace-safety/:person_round_id', async (req, res) => {
    try {
        const result = await employmentService.deleteWorkplaceSafetyRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete workplace safety' });
    }
});


app.post('/api/surveys/sync', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = 'your_secret_key_here_change_this_to_something_long';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded || !decoded.user_id) {
            return res.status(401).json({ error: 'Invalid authentication' });
        }

        // 2. Call the service to perform the sync
        const result = await personService.syncSurveysForUser(decoded.user_id);
        
        res.json(result);
    } catch (error) {
        console.error('Error syncing surveys:', error);
        res.status(500).json({ error: 'Failed to sync surveys' });
    }
});


// --- ADMIN ROUTES ---

// GET: Fetch all pending surveys for Admin review
app.get('/api/admin/pending', async (req, res) => {
    try {
        // Fetch pending surveys with person details
        const query = `
            SELECT 
                pr.person_round_id,
                p.personid,
                pr.age_years,
                pr.status
            FROM person_round pr
            JOIN person p ON pr.person_id = p.person_id
            WHERE pr.status = 'pending_review'
            ORDER BY pr.person_round_id ASC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending surveys:', error);
        res.status(500).json({ error: 'Failed to fetch pending surveys' });
    }
});

// PUT: Review a survey (Approve or Reject)
app.put('/api/admin/review/:personRoundId', async (req, res) => {
    try {
        const personRoundId = parseInt(req.params.personRoundId);
        const { action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // Get the admin's user_id from the token
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = 'your_secret_key_here_change_this_to_something_long';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Update the status
        const query = `
            UPDATE person_round 
            SET status = ?, reviewed_by = ?, rejection_reason = ?
            WHERE person_round_id = ?
        `;
        await pool.query(query, [
            action === 'approve' ? 'approved' : 'rejected',
            decoded.user_id,
            action === 'reject' ? reason : null,
            personRoundId
        ]);

        res.json({ message: `Survey ${action === 'approve' ? 'approved' : 'rejected'} successfully` });
    } catch (error) {
        console.error('Error reviewing survey:', error);
        res.status(500).json({ error: 'Failed to review survey' });
    }
});

// --- HOUSEHOLD ROUTES ---

// POST: Create a new household and household_round
app.post('/api/households', async (req, res) => {
    try {
        const { hhid, cluster, urban_rural } = req.body;

        // We need to verify the user is authenticated
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // 1. Insert the household
        const householdQuery = 'INSERT INTO household (hhid) VALUES (?)';
        const [householdResult] = await pool.query(householdQuery, [hhid]);
        const householdId = householdResult.insertId;

        // 2. Determine the round_id (we can just use 1 for testing)
        const roundId = 1;

        // 3. Insert the household_round
        const roundQuery = `
            INSERT INTO household_round (household_id, round_id, cluster, urban_rural)
            VALUES (?, ?, ?, ?)
        `;
        await pool.query(roundQuery, [householdId, roundId, cluster, urban_rural]);

        res.status(201).json({ 
            message: 'Household created successfully', 
            household_id: householdId 
        });

        } catch (error) {
        console.error('Error creating household:', error);
        res.status(500).json({ 
            error: error.sqlMessage || 'Failed to create household' 
        });
    }
});

// --- DYNAMIC LOOKUP TABLE ROUTES ---

// GET: Fetch all records from a lookup table (e.g., /api/lookups/region)
app.get('/api/lookups/:tableName', async (req, res) => {
    try {
        const data = await lookupService.getAllLookupRecords(req.params.tableName);
        res.json(data);
    } catch (error) {
        console.error('Error fetching lookup data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// GET: Fetch a single lookup record by ID (e.g., /api/lookups/region/1)
app.get('/api/lookups/:tableName/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await lookupService.getSingleLookupRecord(req.params.tableName, id);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json(data);
    } catch (error) {
        console.error('Error fetching lookup record:', error);
        res.status(500).json({ error: 'Failed to fetch record' });
    }
});

// POST: Create a new record (e.g., /api/lookups/region)
app.post('/api/lookups/:tableName', async (req, res) => {
    try {
        const result = await lookupService.createLookupRecord(req.params.tableName, req.body);
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (error) {
        console.error('Error creating lookup record:', error);
        res.status(500).json({ error: 'Failed to create record' });
    }
});

// PUT: Update an existing record (e.g., /api/lookups/region/1)
app.put('/api/lookups/:tableName/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await lookupService.updateLookupRecord(req.params.tableName, id, req.body);
        res.json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error('Error updating lookup record:', error);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

// DELETE: Delete a record (e.g., /api/lookups/region/1)
app.delete('/api/lookups/:tableName/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await lookupService.deleteLookupRecord(req.params.tableName, id);
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting lookup record:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { full_name, assigned_district_id } = req.body;

        // 1. Generate a unique username
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const username = `user_${randomNum}`;

        // 2. Generate a random password for this user
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 3. Hash it before storing
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insert the hash, not the plain password
        const insertQuery = `
            INSERT INTO users (username, password_hash, role, full_name, assigned_district_id)
            VALUES (?, ?, 'field_user', ?, ?)
        `;
        await pool.query(insertQuery, [username, hashedPassword, full_name, assigned_district_id]);

        // 5. Return the plain password to the admin — the only time it's ever shown
        res.status(201).json({
            message: 'Field user created successfully',
            username: username,
            password: password,
            full_name: full_name
        });

    } catch (error) {
        console.error('Error creating field user:', error);
        res.status(500).json({ error: 'Failed to create field user' });
    }
});
// Import and use the auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});