const crypto = require('crypto');
const pool = require('./db/pool');
const express = require('express');

const personRepo = require('./repositories/personrepository');
const educationService = require('./services/educationService');
const healthService =require('./services/healthservice');
const employmentService = require('./services/employmentservice');
const personService = require('./services/personService');
const lookupService = require('./services/lookupService');
const accessService = require('./services/accessService');
const auditService = require('./services/auditService');
const passwordService = require('./services/passwordService');
const authRoutes = require('./routes/auth');
const withTransaction = require('./db/transaction');
const { requireAuth, requirePasswordChanged, requireRole } = require('./middleware/auth');
const {
    ROLES,
    ADMIN_ROLES,
    USER_MANAGEMENT_ROLES,
    CREATABLE_ROLES,
    DELETABLE_ROLES
} = require('./constants/roles');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security headers. The API only returns JSON, so CSP is not useful here and
// is disabled to avoid interfering with the separate Next.js frontend.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true 
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTHENTICATION ---
// Auth routes are mounted BEFORE the global guard so that login/logout stay
// reachable without a token. Every /api route registered after the guard below
// now requires a valid signed JWT.
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
// Temporary-password accounts may only use the auth routes above until they
// have set a new password.
app.use('/api', requirePasswordChanged);

// --- OWNERSHIP HELPERS ---

/**
 * Returns true when the caller may access the given person_round row.
 * Writes a 404 and returns false otherwise, so unprivileged users cannot probe
 * for records that exist but belong to someone else.
 */
async function allowPersonRound(req, res, personRoundId) {
    const id = parseInt(personRoundId, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'A valid person_round_id is required' });
        return false;
    }

    const allowed = await accessService.canAccessPersonRound(req.user, id);
    if (!allowed) {
        res.status(404).json({ error: 'Record not found' });
        return false;
    }
    return true;
}

/**
 * Checks household_round district scoping. Privileged roles bypass the check.
 */
async function allowHousehold(req, res, householdRoundId) {
    const id = parseInt(householdRoundId, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'A valid household_round_id is required' });
        return false;
    }

    const { exists, allowed } = await accessService.checkHouseholdAccess(req.user, id);
    if (!exists) {
        res.status(404).json({ error: 'Household not found' });
        return false;
    }
    if (!allowed) {
        res.status(403).json({ error: 'This household is outside your assigned district' });
        return false;
    }
    return true;
}

// --- API ROUTES ---

/**
 * GET /api/persons-round/:id
 */
app.get('/api/persons-round/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!(await allowPersonRound(req, res, id))) return;
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
        // Unprivileged users may only add people to households in their
        // assigned district.
        if (!(await allowHousehold(req, res, req.body.household_round_id))) return;

        // Never trust a client-supplied created_by: attribute the record to the
        // authenticated user from the signed token instead.
        const result = await personRepo.createPersonAndRound({
            ...req.body,
            created_by: req.user.user_id
        });
        
        res.status(201).json({
            message: 'Person created successfully',
            data: result
        });
    } catch (error) {
        console.error('========================================');
        console.dir(error, { depth: null });
        console.error('========================================');
        
        const errorMessage = error.sqlMessage || 'Failed to create person';
        res.status(500).json({ error: errorMessage });
    }
});
 
app.post('/api/education', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const result = await educationService.saveEducationRecord(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error saving education record:', error);
        res.status(500).json({ error: 'An error occurred while saving the education record.' });
    }
});

app.post('/api/health', async (req, res) => {
    try{
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const results = await healthService.saveHealthRecord(req.body);
        res.status(201).json(results);
    } catch (error) {
        console.error('Error saving health record:', error);
        res.status(500).json({ error : 'n error occurred while saving the health record.'})
    }
})

app.post('/api/employment',async (req, res)=>{
    try{
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
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
        if (!(await allowPersonRound(req, res, id))) return;
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
app.delete('/api/persons/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await personRepo.deletePersonAndAllData(id);
        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'PERSON_DELETED',
            targetType: 'person_round',
            targetId: id,
            req
        });
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
        if (!(await allowPersonRound(req, res, id))) return;
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
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
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
        if (!(await allowPersonRound(req, res, id))) return;
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
        // Privileged roles see every record; everyone else only sees the
        // records they entered.
        const privileged = accessService.isPrivileged(req.user);
        const query = `
            SELECT 
                pr.person_round_id,
                p.personid,
                pr.sex,
                pr.age_years
            FROM person_round pr
            JOIN person p ON pr.person_id = p.person_id
            ${privileged ? '' : 'WHERE pr.created_by = ?'}
            ORDER BY pr.person_round_id ASC
        `;
        const [rows] = await pool.query(query, privileged ? [] : [req.user.user_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all persons:', error);
        res.status(500).json({ error: 'Failed to fetch persons' });
    }
});

// --- WORK HISTORY ROUTES ---
app.get('/api/employment/history/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const data = await employmentService.getWorkHistoryRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch work history' });
    }
});
app.put('/api/employment/history', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const result = await employmentService.saveWorkHistoryRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save work history' });
    }
});
app.delete('/api/employment/history/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const result = await employmentService.deleteWorkHistoryRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete work history' });
    }
});

// --- UNDEREMPLOYMENT ROUTES ---
app.get('/api/employment/underemployment/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const data = await employmentService.getUnderemploymentRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch underemployment' });
    }
});
app.put('/api/employment/underemployment', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const result = await employmentService.saveUnderemploymentRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save underemployment' });
    }
});
app.delete('/api/employment/underemployment/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const result = await employmentService.deleteUnderemploymentRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete underemployment' });
    }
});

// --- JOB SEARCH ROUTES ---
app.get('/api/employment/job-search/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const data = await employmentService.getJobSearchRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch job search' });
    }
});
app.put('/api/employment/job-search', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const result = await employmentService.saveJobSearchRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save job search' });
    }
});
app.delete('/api/employment/job-search/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const result = await employmentService.deleteJobSearchRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete job search' });
    }
});

// --- WORKPLACE SAFETY ROUTES ---
app.get('/api/workplace-safety/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const data = await employmentService.getWorkplaceSafetyRecord(parseInt(req.params.person_round_id));
        res.json(data || null);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch workplace safety' });
    }
});
app.put('/api/workplace-safety', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.body.person_round_id))) return;
        const result = await employmentService.saveWorkplaceSafetyRecord(req.body);
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to save workplace safety' });
    }
});
app.delete('/api/workplace-safety/:person_round_id', async (req, res) => {
    try {
        if (!(await allowPersonRound(req, res, req.params.person_round_id))) return;
        const result = await employmentService.deleteWorkplaceSafetyRecord(parseInt(req.params.person_round_id));
        res.json(result);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to delete workplace safety' });
    }
});


app.post('/api/surveys/sync', async (req, res) => {
    try {
        // req.user is set by the global requireAuth middleware.
        const result = await personService.syncSurveysForUser(req.user.user_id);
        res.json(result);
    } catch (error) {
        console.error('Error syncing surveys:', error);
        res.status(500).json({ error: 'Failed to sync surveys' });
    }
});


// --- ADMIN ROUTES ---

// GET: Fetch all pending surveys for Admin review
app.get('/api/admin/pending', requireRole(...ADMIN_ROLES), async (req, res) => {
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
app.put('/api/admin/review/:personRoundId', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const personRoundId = parseInt(req.params.personRoundId);
        const { action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // req.user is set by the global requireAuth middleware.
        const query = `
            UPDATE person_round 
            SET status = ?, reviewed_by = ?, rejection_reason = ?
            WHERE person_round_id = ?
        `;
        const [result] = await pool.query(query, [
            action === 'approve' ? 'approved' : 'rejected',
            req.user.user_id,
            action === 'reject' ? reason : null,
            personRoundId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        await auditService.logEvent({
            userId: req.user.user_id,
            action: action === 'approve' ? 'SURVEY_APPROVED' : 'SURVEY_REJECTED',
            targetType: 'person_round',
            targetId: personRoundId,
            req,
            details: action === 'reject' ? reason : null
        });

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
        const { hhid, cluster, urban_rural, region_id } = req.body;

        if (!hhid || typeof hhid !== 'string') {
            return res.status(400).json({ error: 'A household ID is required' });
        }

        // Authentication is enforced by the global requireAuth middleware.

        // District scoping: privileged roles may choose any district, while
        // field users are locked to their assigned district.
        let districtId = req.body.district_id ?? null;
        if (!accessService.isPrivileged(req.user)) {
            const assigned = req.user.assigned_district_id ?? null;
            if (districtId !== null && assigned !== null && Number(districtId) !== Number(assigned)) {
                return res.status(403).json({ error: 'You may only create households in your assigned district' });
            }
            districtId = assigned;
        }
        if (districtId !== null && districtId !== '') {
            districtId = parseInt(districtId, 10);
            if (Number.isNaN(districtId)) {
                return res.status(400).json({ error: 'district_id must be a number' });
            }
        } else {
            districtId = null;
        }

        // 1. Insert the household
        const householdQuery = 'INSERT INTO household (hhid) VALUES (?)';
        const [householdResult] = await pool.query(householdQuery, [hhid]);
        const householdId = householdResult.insertId;

        // 2. Determine the round_id (we can just use 1 for testing)
        const roundId = 1;

        // 3. Insert the household_round
        const roundQuery = `
            INSERT INTO household_round
                (household_id, round_id, cluster, urban_rural, region_id, district_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(roundQuery, [
            householdId,
            roundId,
            cluster,
            urban_rural,
            region_id || null,
            districtId
        ]);

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

function lookupErrorResponse(res, error, fallbackMessage) {
    // Invalid/unknown table names are client errors (400), not server errors.
    if (error.status === 400) {
        return res.status(400).json({ error: error.message });
    }
    console.error(fallbackMessage + ':', error);
    return res.status(500).json({ error: fallbackMessage });
}

// GET: Fetch all records from a lookup table (e.g., /api/lookups/region)
app.get('/api/lookups/:tableName', async (req, res) => {
    try {
        const data = await lookupService.getAllLookupRecords(req.params.tableName);
        res.json(data);
    } catch (error) {
        lookupErrorResponse(res, error, 'Failed to fetch data');
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
        lookupErrorResponse(res, error, 'Failed to fetch record');
    }
});

// POST: Create a new record (e.g., /api/lookups/region)
app.post('/api/lookups/:tableName', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const result = await lookupService.createLookupRecord(req.params.tableName, req.body);
        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'LOOKUP_CREATED',
            targetType: req.params.tableName,
            targetId: result.insertId,
            req
        });
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (error) {
        lookupErrorResponse(res, error, 'Failed to create record');
    }
});

// PUT: Update an existing record (e.g., /api/lookups/region/1)
app.put('/api/lookups/:tableName/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await lookupService.updateLookupRecord(req.params.tableName, id, req.body);
        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'LOOKUP_UPDATED',
            targetType: req.params.tableName,
            targetId: id,
            req
        });
        res.json({ message: 'Record updated successfully' });
    } catch (error) {
        lookupErrorResponse(res, error, 'Failed to update record');
    }
});

// DELETE: Delete a record (e.g., /api/lookups/region/1)
app.delete('/api/lookups/:tableName/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await lookupService.deleteLookupRecord(req.params.tableName, id);
        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'LOOKUP_DELETED',
            targetType: req.params.tableName,
            targetId: id,
            req
        });
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        lookupErrorResponse(res, error, 'Failed to delete record');
    }
});

// --- USER MANAGEMENT ---

function generatePassword(length = 14) {
    // Exclude ambiguous characters (0/O, 1/l/I) to make hand-off easier.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return password;
}

async function generateUniqueUsername() {
    for (let attempt = 0; attempt < 5; attempt++) {
        const username = `user_${crypto.randomBytes(4).toString('hex')}`;
        const [rows] = await pool.query('SELECT 1 FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return username;
    }
    throw new Error('Could not generate a unique username');
}

// POST: Create a user. Managers may add inputers; admins may add inputers and
// field users; administrators may also add managers.
app.post('/api/admin/users', requireRole(...USER_MANAGEMENT_ROLES), async (req, res) => {
    try {
        const { full_name, assigned_district_id } = req.body;

        if (typeof full_name !== 'string' || !full_name.trim()) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        // Default role depends on who is creating the account, so the existing
        // "create field user" screen keeps working for managers.
        const requestedRole = req.body.role ||
            (req.user.role === ROLES.MANAGER ? ROLES.INPUTER : ROLES.FIELD_USER);

        const allowedRoles = CREATABLE_ROLES[req.user.role] || [];
        if (!allowedRoles.includes(requestedRole)) {
            return res.status(403).json({
                error: `Role '${req.user.role}' is not allowed to create '${requestedRole}' accounts`
            });
        }

        let districtId = null;
        if (assigned_district_id !== undefined && assigned_district_id !== null && assigned_district_id !== '') {
            districtId = parseInt(assigned_district_id, 10);
            if (Number.isNaN(districtId)) {
                return res.status(400).json({ error: 'assigned_district_id must be a number' });
            }
        }

        const username = await generateUniqueUsername();
        const password = generatePassword();
        const hashedPassword = await passwordService.hashPassword(password);

        const insertQuery = `
            INSERT INTO users
                (username, password_hash, role, full_name, assigned_district_id, must_change_password)
            VALUES (?, ?, ?, ?, ?, 1)
        `;
        const [insertResult] = await pool.query(insertQuery, [
            username,
            hashedPassword,
            requestedRole,
            full_name.trim(),
            districtId
        ]);

        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'USER_CREATED',
            targetType: 'user',
            targetId: insertResult.insertId,
            req,
            details: `role=${requestedRole}`
        });

        // The plaintext password is shown to the creator exactly once.
        res.status(201).json({
            message: 'User created successfully',
            user_id: insertResult.insertId,
            username,
            password,
            full_name: full_name.trim(),
            role: requestedRole
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DELETE: Remove a user. Admins may delete inputers; administrators may also
// delete field users, managers and admins. Nobody may delete themselves or an
// administrator, and referenced person_round rows are detached first so the
// foreign keys do not block the deletion.
app.delete('/api/admin/users/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
        const targetId = parseInt(req.params.id, 10);

        if (Number.isNaN(targetId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        if (targetId === req.user.user_id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const [rows] = await pool.query(
            'SELECT user_id, username, role FROM users WHERE user_id = ?',
            [targetId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const target = rows[0];
        const allowedTargets = DELETABLE_ROLES[req.user.role] || [];
        if (!allowedTargets.includes(target.role)) {
            return res.status(403).json({
                error: `Role '${req.user.role}' is not allowed to delete '${target.role}' accounts`
            });
        }

        await withTransaction(async (connection) => {
            // Detach references so the users foreign keys do not block deletion.
            await connection.query(
                'UPDATE person_round SET created_by = NULL WHERE created_by = ?',
                [targetId]
            );
            await connection.query(
                'UPDATE person_round SET reviewed_by = NULL WHERE reviewed_by = ?',
                [targetId]
            );
            await connection.query('DELETE FROM users WHERE user_id = ?', [targetId]);
        });

        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'USER_DELETED',
            targetType: 'user',
            targetId: targetId,
            req,
            details: `role=${target.role}`
        });

        res.json({ message: `User '${target.username}' deleted successfully` });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});