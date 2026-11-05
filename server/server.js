require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const mongoose = require('mongoose');
const multer = require('multer');
const cookieParser = require('cookie-parser');

const useInMemoryDb = process.env.USE_IN_MEMORY_DB === 'true' && process.env.NODE_ENV !== 'production';

const { Users, Reminder, Album, Task, CareNote, CheckIn } = useInMemoryDb
    ? require('./dev/inMemoryModels')
    : {
        Users: require('./Models/UsersInfo'),
        Reminder: require('./Models/reminders'),
        Album: require('./Models/memoryAlbum'),
        Task: require('./Models/tasks'),
        CareNote: require('./Models/careNote'),
        CheckIn: require('./Models/checkIn'),
    };

const app = express();
const port = Number(process.env.PORT) || 3000;
const jwtSecret = process.env.JWT_SECRET
    || process.env.JWT_SECRETE
    || (useInMemoryDb ? crypto.randomBytes(32).toString('hex') : undefined);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const uploadsDirectory = path.join(__dirname, 'uploads');

if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random secret of at least 32 characters.');
}

fs.mkdirSync(uploadsDirectory, { recursive: true });

app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
        },
    },
}));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Secure cookies need HTTPS. Set COOKIE_SECURE=false only for local HTTP
// deployments (for example Docker Compose without TLS); production HTTPS
// deployments should leave it unset so it follows NODE_ENV.
const secureCookies = process.env.COOKIE_SECURE === undefined
    ? process.env.NODE_ENV === 'production'
    : process.env.COOKIE_SECURE === 'true';

const authCookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ITEM_ID_PATTERN = /^(reminder:[a-f0-9]{24}|routine:[a-f0-9]{24}:\d{1,3})$/i;
const PROFILE_FIELDS = {
    preferredName: 60,
    aboutMe: 600,
    allergies: 300,
    medications: 500,
    emergencyContactName: 100,
    emergencyContactPhone: 40,
    doctorName: 100,
    doctorPhone: 40,
    homeAddress: 200,
};

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// Very small in-memory rate limiter for the credential endpoints.
const rateBuckets = new Map();
function rateLimit({ windowMs = 10 * 60 * 1000, max = 20 } = {}) {
    return (req, res, next) => {
        const now = Date.now();
        if (rateBuckets.size > 5000) {
            for (const [key, bucket] of rateBuckets) {
                if (bucket.resetAt <= now) rateBuckets.delete(key);
            }
        }
        const key = `${req.ip}:${req.path}`;
        const bucket = rateBuckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        bucket.count += 1;
        if (bucket.count > max) {
            res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
            return res.status(429).json({ message: 'Too many attempts. Please wait a few minutes and try again.' });
        }
        return next();
    };
}

function requireAuth(req, res, next) {
    const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const token = req.cookies.authToken || bearer;

    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

    try {
        const payload = jwt.verify(token, jwtSecret);
        req.authUserId = payload.userId;
        return next();
    } catch {
        return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
}

function requireRole(...roles) {
    return asyncRoute(async (req, res, next) => {
        const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
        if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
        if (!roles.includes(user.role)) return res.status(403).json({ message: 'You do not have permission to do that.' });
        req.authUser = user;
        return next();
    });
}

function profileOf(user) {
    return Object.fromEntries(Object.keys(PROFILE_FIELDS).map((field) => [field, user[field] || '']));
}

function linkedCaregiverSummary(linked) {
    if (!linked) return null;
    const isPopulated = typeof linked === 'object' && linked.fullname;
    return {
        id: String(isPopulated ? linked._id : linked),
        fullname: isPopulated ? linked.fullname : null,
        preferredName: isPopulated ? linked.preferredName || '' : '',
    };
}

// Resolves the linked caregiver without mutating the user document (mutating
// would corrupt the stored reference in lean/in-memory stores).
async function resolveLinkedCaregiver(user) {
    if (!user) return null;
    const linked = user.linkedCaregiverId;
    if (!linked) return null;
    if (typeof linked === 'object' && linked.fullname) return linkedCaregiverSummary(linked);

    const linkedId = typeof linked === 'object' ? linked._id || String(linked) : linked;
    const caregiver = await Users.findById(linkedId).select('fullname preferredName').lean();
    return caregiver ? linkedCaregiverSummary(caregiver) : null;
}

function publicUser(user, linkedCaregiverOverride) {
    return {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        caregiverCode: user.role === 'caregiver' ? user.caregiverCode : undefined,
        linkedCaregiver: linkedCaregiverOverride !== undefined
            ? linkedCaregiverOverride
            : linkedCaregiverSummary(user.linkedCaregiverId),
        locationSharing: user.role === 'patient' ? Boolean(user.locationSharing) : undefined,
        lastLocation: user.role === 'patient' ? user.lastLocation || null : undefined,
        profile: profileOf(user),
    };
}

function createSession(res, user) {
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
    res.cookie('authToken', token, { ...authCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function isValidDateKey(value) {
    if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isRecentDateKey(value, days = 7) {
    const parsed = new Date(`${value}T00:00:00Z`).getTime();
    return Math.abs(Date.now() - parsed) <= days * 24 * 60 * 60 * 1000;
}

function splitSteps(tasks) {
    return String(tasks || '').split(/\r?\n/).map((step) => step.trim()).filter(Boolean);
}

async function itemBelongsToCaregiver(itemId, caregiverId) {
    if (typeof itemId !== 'string' || !ITEM_ID_PATTERN.test(itemId)) return false;
    const [kind, id, stepIndex] = itemId.split(':');
    if (!mongoose.isValidObjectId(id) && !/^[a-f0-9]{24}$/i.test(id)) return false;

    if (kind === 'reminder') {
        return Boolean(await Reminder.findOne({ _id: id, caregiverId }));
    }
    const task = await Task.findOne({ _id: id, caregiverId });
    if (!task) return false;
    return Number(stepIndex) < splitSteps(task.tasks).length;
}

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        database: useInMemoryDb ? 'in-memory' : (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'),
        uptime: Math.round(process.uptime()),
    });
});

// Readiness gate for orchestrators: traffic must not reach an instance that
// cannot serve requests because the database connection is not up (yet).
app.get('/api/ready', (req, res) => {
    const databaseReady = useInMemoryDb || mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ready' : 'unavailable',
        database: useInMemoryDb ? 'in-memory' : (databaseReady ? 'connected' : 'disconnected'),
    });
});

app.post('/api/auth/signup', rateLimit({ max: 15 }), asyncRoute(async (req, res) => {
    const { fullname, email, password, role, caregiverCode } = req.body;
    if (typeof fullname !== 'string' || fullname.trim().length < 2 || fullname.trim().length > 100) {
        return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    }
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
    }
    if (!['patient', 'caregiver'].includes(role)) {
        return res.status(400).json({ message: 'Choose patient or caregiver.' });
    }

    let linkedCaregiverId = null;
    let linkedCaregiver = null;
    if (role === 'patient' && typeof caregiverCode === 'string' && caregiverCode.trim()) {
        const caregiver = await Users.findOne({
            caregiverCode: caregiverCode.trim().toUpperCase(),
            role: 'caregiver',
        }).select('_id fullname preferredName');
        if (!caregiver) return res.status(404).json({ message: 'That caregiver code was not found. Check it and try again.' });
        linkedCaregiverId = caregiver._id;
        linkedCaregiver = linkedCaregiverSummary(caregiver);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await Users.exists({ email: normalizedEmail })) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await Users.create({
        fullname: fullname.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        role,
        linkedCaregiverId,
        caregiverCode: role === 'caregiver' ? crypto.randomBytes(5).toString('hex').toUpperCase() : undefined,
    });

    createSession(res, user);
    return res.status(201).json({ user: publicUser(user, linkedCaregiver), message: 'Your account is ready.' });
}));

app.post('/api/auth/signin', rateLimit({ max: 20 }), asyncRoute(async (req, res) => {
    const { email, password, role } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !['patient', 'caregiver'].includes(role)) {
        return res.status(400).json({ message: 'Enter your email, password, and account type.' });
    }

    const user = await Users.findOne({ email: email.trim().toLowerCase(), role });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Email, password, or account type is incorrect.' });
    }

    createSession(res, user);
    return res.status(200).json({ user: publicUser(user, await resolveLinkedCaregiver(user)), message: 'Welcome back.' });
}));

app.get('/api/auth/me', requireAuth, asyncRoute(async (req, res) => {
    const expiresBefore = new Date(Date.now() - 30 * 60 * 1000);
    await Users.updateOne(
        { _id: req.authUserId, role: 'patient', locationSharing: true, 'lastLocation.updatedAt': { $lt: expiresBefore } },
        { $set: { locationSharing: false }, $unset: { lastLocation: 1 } }
    );
    const user = await Users.findById(req.authUserId).select('-password');
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    return res.json({ user: publicUser(user, await resolveLinkedCaregiver(user)) });
}));

app.patch('/api/auth/password', requireAuth, rateLimit({ max: 10 }), asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
        return res.status(400).json({ message: 'Your new password must be between 8 and 128 characters.' });
    }

    const user = await Users.findById(req.authUserId);
    if (!user || typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ message: 'Your current password is incorrect.' });
    }

    await Users.updateOne(
        { _id: req.authUserId },
        { $set: { password: await bcrypt.hash(newPassword, 12) } }
    );
    return res.json({ message: 'Your password has been updated.' });
}));

app.post('/api/auth/signout', (req, res) => {
    res.clearCookie('authToken', { ...authCookieOptions, maxAge: undefined });
    return res.status(200).json({ message: 'You have been signed out.' });
});

app.post('/api/auth/link-caregiver', requireAuth, requireRole('patient'), asyncRoute(async (req, res) => {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!/^[A-F0-9]{10}$/.test(code)) return res.status(400).json({ message: 'Enter the 10-character code from your caregiver.' });

    const caregiver = await Users.findOne({ caregiverCode: code, role: 'caregiver' }).select('_id');
    if (!caregiver) return res.status(404).json({ message: 'That caregiver code was not found. Check it and try again.' });

    await Users.updateOne(
        { _id: req.authUserId },
        {
            $set: { linkedCaregiverId: caregiver._id, locationSharing: false },
            $unset: { lastLocation: 1 },
        }
    );
    return res.json({ message: 'You are now connected with your caregiver.' });
}));

app.delete('/api/auth/link-caregiver', requireAuth, requireRole('patient'), asyncRoute(async (req, res) => {
    await Users.updateOne(
        { _id: req.authUserId },
        { $set: { linkedCaregiverId: null, locationSharing: false }, $unset: { lastLocation: 1 } }
    );
    return res.json({ message: 'You have disconnected from your caregiver.' });
}));

app.get('/api/profile', requireAuth, asyncRoute(async (req, res) => {
    const user = await Users.findById(req.authUserId).select('-password');
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    return res.json({ user: publicUser(user, await resolveLinkedCaregiver(user)) });
}));

app.patch('/api/profile', requireAuth, asyncRoute(async (req, res) => {
    const updates = {};

    if (req.body.fullname !== undefined) {
        if (typeof req.body.fullname !== 'string' || req.body.fullname.trim().length < 2 || req.body.fullname.trim().length > 100) {
            return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
        }
        updates.fullname = req.body.fullname.trim();
    }

    for (const [field, maxLength] of Object.entries(PROFILE_FIELDS)) {
        const value = req.body[field];
        if (value === undefined) continue;
        if (typeof value !== 'string') {
            return res.status(400).json({ message: 'Profile details must be text.' });
        }
        const trimmed = value.trim();
        if (trimmed.length > maxLength) {
            return res.status(400).json({ message: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} must be ${maxLength} characters or fewer.` });
        }
        updates[field] = trimmed;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'There are no changes to save.' });
    }

    await Users.updateOne({ _id: req.authUserId }, { $set: updates });
    const user = await Users.findById(req.authUserId).select('-password');
    return res.json({ user: publicUser(user, await resolveLinkedCaregiver(user)), message: 'Your details have been saved.' });
}));

app.post('/api/location', requireAuth, requireRole('patient'), asyncRoute(async (req, res) => {
    if (req.body.sharing === false) {
        await Users.updateOne({ _id: req.authUserId }, { $set: { locationSharing: false }, $unset: { lastLocation: 1 } });
        return res.json({ message: 'Location sharing is off.' });
    }

    const patient = await Users.findById(req.authUserId).select('linkedCaregiverId');
    if (!patient.linkedCaregiverId) {
        return res.status(400).json({ message: 'Connect with your caregiver before sharing your location.' });
    }

    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number'
        || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'A valid device location is required.' });
    }

    await Users.updateOne({ _id: req.authUserId }, {
        $set: {
            locationSharing: true,
            lastLocation: { latitude, longitude, updatedAt: new Date() },
        },
    });
    return res.json({ message: 'Your current location was shared with your caregiver.' });
}));

app.get('/api/location', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    const expiresBefore = new Date(Date.now() - 30 * 60 * 1000);
    await Users.updateMany(
        { role: 'patient', linkedCaregiverId: req.authUserId, locationSharing: true, 'lastLocation.updatedAt': { $lt: expiresBefore } },
        { $set: { locationSharing: false }, $unset: { lastLocation: 1 } }
    );
    const patients = await Users.find({
        role: 'patient',
        linkedCaregiverId: req.authUserId,
        locationSharing: true,
        'lastLocation.updatedAt': { $gte: expiresBefore },
    }).select('fullname preferredName lastLocation').lean();
    return res.json(patients.map((patient) => ({
        id: patient._id,
        fullname: patient.fullname,
        preferredName: patient.preferredName || '',
        ...patient.lastLocation,
    })));
}));

app.get('/api/patients', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10);
    if (!isValidDateKey(date)) return res.status(400).json({ message: 'Choose a valid date.' });

    const patients = await Users.find({ role: 'patient', linkedCaregiverId: req.authUserId })
        .select('-password')
        .lean();
    const patientIds = patients.map((patient) => patient._id);
    const checkIns = patientIds.length
        ? await CheckIn.find({ patientId: { $in: patientIds }, dateKey: date }).select('patientId itemId').lean()
        : [];

    return res.json(patients.map((patient) => ({
        id: String(patient._id),
        fullname: patient.fullname,
        profile: profileOf(patient),
        locationSharing: Boolean(patient.locationSharing),
        lastLocation: patient.lastLocation || null,
        completed: checkIns
            .filter((entry) => String(entry.patientId) === String(patient._id))
            .map((entry) => entry.itemId),
    })));
}));

app.get('/api/checkins', requireAuth, asyncRoute(async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10);
    if (!isValidDateKey(date)) return res.status(400).json({ message: 'Choose a valid date.' });

    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    if (user.role === 'patient') {
        const entries = await CheckIn.find({ patientId: req.authUserId, dateKey: date }).select('itemId').lean();
        return res.json({ date, completed: entries.map((entry) => entry.itemId) });
    }

    const patients = await Users.find({ role: 'patient', linkedCaregiverId: req.authUserId }).select('_id fullname').lean();
    const patientIds = patients.map((patient) => patient._id);
    const entries = patientIds.length
        ? await CheckIn.find({ patientId: { $in: patientIds }, dateKey: date }).select('patientId itemId').lean()
        : [];
    return res.json(patients.map((patient) => ({
        patientId: String(patient._id),
        fullname: patient.fullname,
        completed: entries
            .filter((entry) => String(entry.patientId) === String(patient._id))
            .map((entry) => entry.itemId),
    })));
}));

app.post('/api/checkins', requireAuth, requireRole('patient'), asyncRoute(async (req, res) => {
    const { dateKey, itemId, done } = req.body;
    if (!isValidDateKey(dateKey) || !isRecentDateKey(dateKey)) {
        return res.status(400).json({ message: 'That day can no longer be updated.' });
    }
    if (typeof itemId !== 'string' || !ITEM_ID_PATTERN.test(itemId)) {
        return res.status(400).json({ message: 'That plan item is not valid.' });
    }

    // Clearing a completed item is always allowed so stale check-ins for a
    // reminder or routine a caregiver has since removed can be cleaned up.
    if (done === false) {
        await CheckIn.deleteOne({ patientId: req.authUserId, dateKey, itemId });
        return res.json({ itemId, done: false });
    }

    const patient = await Users.findById(req.authUserId).select('linkedCaregiverId');
    if (!patient?.linkedCaregiverId) {
        return res.status(400).json({ message: 'Connect with your caregiver before tracking your plan.' });
    }
    if (!(await itemBelongsToCaregiver(itemId, patient.linkedCaregiverId))) {
        return res.status(404).json({ message: 'That plan item is no longer available.' });
    }

    const existing = await CheckIn.findOne({ patientId: req.authUserId, dateKey, itemId });
    if (!existing) {
        await CheckIn.create({ patientId: req.authUserId, dateKey, itemId });
    }
    return res.json({ itemId, done: true });
}));

app.post('/api/reminders', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    const { time, reminder } = req.body;
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return res.status(400).json({ message: 'Choose a valid reminder time.' });
    }
    if (typeof reminder !== 'string' || !reminder.trim() || reminder.trim().length > 240) {
        return res.status(400).json({ message: 'Enter a reminder of up to 240 characters.' });
    }

    const savedReminder = await Reminder.create({ time, reminder: reminder.trim(), caregiverId: req.authUserId });
    return res.status(201).json(savedReminder);
}));

app.get('/api/reminders', requireAuth, asyncRoute(async (req, res) => {
    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    const caregiverId = user.role === 'caregiver' ? user._id : user.linkedCaregiverId;
    const records = caregiverId
        ? await Reminder.find({ caregiverId }).sort({ time: 1, createdAt: 1 }).lean()
        : [];
    return res.json(records);
}));

app.patch('/api/reminders/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid reminder.' });
    const { time, reminder } = req.body;
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return res.status(400).json({ message: 'Choose a valid reminder time.' });
    }
    if (typeof reminder !== 'string' || !reminder.trim() || reminder.trim().length > 240) {
        return res.status(400).json({ message: 'Enter a reminder of up to 240 characters.' });
    }

    const updated = await Reminder.findOneAndUpdate(
        { _id: req.params.id, caregiverId: req.authUserId },
        { $set: { time, reminder: reminder.trim() } },
    );
    if (!updated) return res.status(404).json({ message: 'Reminder not found.' });
    return res.json(updated);
}));

app.delete('/api/reminders/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid reminder.' });
    const removed = await Reminder.findOneAndDelete({ _id: req.params.id, caregiverId: req.authUserId });
    if (!removed) return res.status(404).json({ message: 'Reminder not found.' });
    return res.status(204).end();
}));

app.post('/api/tasks', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    const { title, tasks } = req.body;
    if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 100) {
        return res.status(400).json({ message: 'Enter a routine name between 2 and 100 characters.' });
    }
    if (typeof tasks !== 'string' || !tasks.trim() || tasks.trim().length > 2000) {
        return res.status(400).json({ message: 'Add routine steps (up to 2,000 characters).' });
    }

    const savedTask = await Task.create({ title: title.trim(), tasks: tasks.trim(), caregiverId: req.authUserId });
    return res.status(201).json(savedTask);
}));

app.get('/api/tasks', requireAuth, asyncRoute(async (req, res) => {
    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    const caregiverId = user.role === 'caregiver' ? user._id : user.linkedCaregiverId;
    const records = caregiverId
        ? await Task.find({ caregiverId }).sort({ createdAt: -1 }).lean()
        : [];
    return res.json(records);
}));

app.patch('/api/tasks/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid routine.' });
    const { title, tasks } = req.body;
    if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 100) {
        return res.status(400).json({ message: 'Enter a routine name between 2 and 100 characters.' });
    }
    if (typeof tasks !== 'string' || !tasks.trim() || tasks.trim().length > 2000) {
        return res.status(400).json({ message: 'Add routine steps (up to 2,000 characters).' });
    }

    const updated = await Task.findOneAndUpdate(
        { _id: req.params.id, caregiverId: req.authUserId },
        { $set: { title: title.trim(), tasks: tasks.trim() } },
    );
    if (!updated) return res.status(404).json({ message: 'Routine not found.' });
    return res.json(updated);
}));

app.delete('/api/tasks/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid routine.' });
    const removed = await Task.findOneAndDelete({ _id: req.params.id, caregiverId: req.authUserId });
    if (!removed) return res.status(404).json({ message: 'Routine not found.' });
    return res.status(204).end();
}));

app.get('/api/care-notes', requireAuth, requireRole('patient', 'caregiver'), asyncRoute(async (req, res) => {
    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    const caregiverId = user.role === 'caregiver' ? user._id : user.linkedCaregiverId;
    const notes = caregiverId
        ? await CareNote.find({ caregiverId }).sort({ createdAt: -1 }).limit(50).lean()
        : [];
    return res.json(notes);
}));

app.post('/api/care-notes', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    const { title, note, category } = req.body;
    if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 100) {
        return res.status(400).json({ message: 'Enter a note title between 2 and 100 characters.' });
    }
    if (typeof note !== 'string' || !note.trim() || note.trim().length > 1000) {
        return res.status(400).json({ message: 'Enter a care note of up to 1,000 characters.' });
    }
    if (!['handoff', 'preference', 'conversation'].includes(category)) {
        return res.status(400).json({ message: 'Choose a care note type.' });
    }

    const savedNote = await CareNote.create({
        title: title.trim(),
        note: note.trim(),
        category,
        caregiverId: req.authUserId,
    });
    return res.status(201).json(savedNote);
}));

app.delete('/api/care-notes/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid care note.' });
    const removed = await CareNote.findOneAndDelete({ _id: req.params.id, caregiverId: req.authUserId });
    if (!removed) return res.status(404).json({ message: 'Care note not found.' });
    return res.status(204).end();
}));

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (req, file, callback) => {
            const extensions = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp',
                'image/gif': '.gif',
            };
            callback(null, `${crypto.randomUUID()}${extensions[file.mimetype]}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
            return callback(new Error('Upload a JPG, PNG, WEBP, or GIF image.'));
        }
        return callback(null, true);
    },
});

app.post('/api/albums', requireAuth, requireRole('caregiver'), upload.single('image'), asyncRoute(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Choose an image to add to the memory album.' });
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description || description.length > 240) {
        await fs.promises.unlink(req.file.path);
        return res.status(400).json({ message: 'Add a description of up to 240 characters.' });
    }

    const savedAlbum = await Album.create({
        imageName: req.file.filename,
        description,
        caregiverId: req.authUserId,
    });
    return res.status(201).json({ id: savedAlbum._id, description: savedAlbum.description });
}));

app.get('/api/albums', requireAuth, asyncRoute(async (req, res) => {
    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    const caregiverId = user.role === 'caregiver' ? user._id : user.linkedCaregiverId;
    const albums = caregiverId
        ? await Album.find({ caregiverId }).sort({ createdAt: -1 }).lean()
        : [];
    return res.json(albums.map(({ _id, description, createdAt }) => ({
        _id,
        description,
        createdAt,
        imageUrl: `/api/albums/${_id}/image`,
    })));
}));

app.patch('/api/albums/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid album entry.' });
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description || description.length > 240) {
        return res.status(400).json({ message: 'Add a description of up to 240 characters.' });
    }

    const updated = await Album.findOneAndUpdate(
        { _id: req.params.id, caregiverId: req.authUserId },
        { $set: { description } },
    );
    if (!updated) return res.status(404).json({ message: 'Memory not found.' });
    return res.json({ id: updated._id, description: updated.description });
}));

app.get('/api/albums/:id/image', requireAuth, asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid album entry.' });
    const user = await Users.findById(req.authUserId).select('role linkedCaregiverId');
    const caregiverId = user.role === 'caregiver' ? user._id : user.linkedCaregiverId;
    if (!caregiverId) return res.status(404).json({ message: 'Memory not found.' });

    const album = await Album.findOne({ _id: req.params.id, caregiverId }).select('imageName');
    if (!album) return res.status(404).json({ message: 'Memory not found.' });
    return res.sendFile(path.join(uploadsDirectory, path.basename(album.imageName)));
}));

app.delete('/api/albums/:id', requireAuth, requireRole('caregiver'), asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid album entry.' });
    const album = await Album.findOneAndDelete({ _id: req.params.id, caregiverId: req.authUserId });
    if (!album) return res.status(404).json({ message: 'Memory not found.' });
    await fs.promises.unlink(path.join(uploadsDirectory, path.basename(album.imageName))).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
    });
    return res.status(204).end();
}));

// Weather is proxied so the client has one predictable contract and the
// Open-Meteo request is cached server-side. No API key is required.
const weatherCache = new Map();
app.get('/api/weather', requireAuth, asyncRoute(async (req, res) => {
    let latitude = Number(req.query.latitude);
    let longitude = Number(req.query.longitude);
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    let place = null;

    try {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            if (!city) return res.status(400).json({ message: 'Choose a city or allow location access.' });
            const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
            geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' });
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) throw new Error('Geocoding request failed');
            const geo = await geoResponse.json();
            const hit = geo.results?.[0];
            if (!hit) return res.status(404).json({ message: `We could not find “${city}”. Try a nearby town or city name.` });
            latitude = hit.latitude;
            longitude = hit.longitude;
            place = [hit.name, hit.admin1, hit.country].filter(Boolean).join(', ');
        }

        const cacheKey = place ? `city:${place}` : `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
        const cached = weatherCache.get(cacheKey);
        if (cached && Date.now() - cached.at < 10 * 60 * 1000) {
            return res.json(cached.data);
        }

        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.search = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
            timezone: 'auto',
        });
        const response = await fetch(url);
        if (!response.ok) throw new Error('Forecast request failed');
        const data = await response.json();

        const payload = {
            place,
            timezone: data.timezone,
            current: data.current,
            units: data.current_units,
        };
        weatherCache.set(cacheKey, { at: Date.now(), data: payload });
        return res.json(payload);
    } catch (error) {
        console.error('Weather lookup failed:', error.message);
        return res.status(502).json({ message: 'Weather is temporarily unavailable. Please try again in a moment.' });
    }
}));

app.use((req, res) => {
    res.status(404).json({ message: 'That page could not be found.' });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : 'Unable to process this upload.';
        return res.status(400).json({ message });
    }
    if (error.message?.startsWith('Upload a JPG')) return res.status(400).json({ message: error.message });
    if (error.message === 'Origin is not allowed by CORS.') return res.status(403).json({ message: error.message });
    if (error.code === 11000) return res.status(409).json({ message: 'That account is already registered.' });
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

async function start() {
    if (useInMemoryDb) {
        console.log('Using the in-memory development database. All data is cleared when the server stops.');
    } else {
        const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_NAME;
        if (!mongoUri) throw new Error('MONGODB_URI must point to your MongoDB database (or set USE_IN_MEMORY_DB=true for local demos).');
        await mongoose.connect(mongoUri);
    }
    app.listen(port, () => console.log(`weCare API listening on port ${port}`));
}

if (require.main === module) {
    start().catch((error) => {
        console.error('Unable to start weCare API:', error.message);
        process.exitCode = 1;
    });
}

module.exports = app;
