const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinepilot';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected successfully to', MONGO_URI);
    seedAdminUser();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Schemas ---

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true }
});

const businessSchema = new mongoose.Schema({
    id: String,
    name: String,
    type: String,
    address: String,
    contact: String,
    slogan: String,
    synced: Boolean
});

const customerSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    phone: String,
    address: String,
    synced: Boolean
});

const transactionSchema = new mongoose.Schema({
    id: String,
    date: String,
    type: String,
    category: String,
    amount: Number,
    description: String,
    isBusiness: Boolean,
    businessId: String,
    customerId: String,
    isLoan: Boolean,
    assetId: String,
    assetAction: String,
    attachment: String,
    synced: Boolean,
    parentId: String
});

const assetSchema = new mongoose.Schema({
    id: String,
    name: String,
    type: String,
    status: String,
    usageMetric: Number,
    nextServiceAt: Number,
    synced: Boolean
});

const User = mongoose.model('User', userSchema);
const Business = mongoose.model('Business', businessSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Asset = mongoose.model('Asset', assetSchema);

// --- Auth / Seeding ---

async function seedAdminUser() {
    try {
        const existingUser = await User.findOne({ username: 'admin' });
        if (!existingUser) {
            console.log('Seeding default admin user...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);
            
            await User.create({
                username: 'admin',
                passwordHash: hash
            });
            console.log('Admin user created. Username: admin, Password: admin123');
        }
    } catch (e) {
        console.error('Error seeding admin:', e);
    }
}

// --- Generic Bulk Sync Helper ---
const syncCollection = async (Model, items) => {
    if (items && items.length > 0) {
        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { id: item.id },
                update: { $set: { ...item, synced: true } },
                upsert: true
            }
        }));
        await Model.bulkWrite(bulkOps);
    }
};


// --- Routes ---

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ success: true, message: 'Login successful', username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sync', async (req, res) => {
    try {
        const { transactions, assets, businesses, customers } = req.body;
        await syncCollection(Transaction, transactions);
        await syncCollection(Asset, assets);
        await syncCollection(Business, businesses);
        await syncCollection(Customer, customers);
        res.json({ success: true, message: 'Sync successful' });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 25, startDate, endDate, q, type, isLoan } = req.query;

        const findQuery = {};
        if (startDate && endDate) {
            findQuery.date = { $gte: startDate, $lte: endDate };
        }
        if (q) {
            const regex = new RegExp(q, 'i');
            findQuery.$or = [{ category: regex }, { description: regex }];
        }
        
        const allFilteredTransactions = await Transaction.find(findQuery);

        const summary = {
            totalIncome: allFilteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
            totalExpense: allFilteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
            businessIncome: allFilteredTransactions.filter(t => t.isBusiness && t.type === 'income').reduce((s, t) => s + t.amount, 0),
            businessExpenses: allFilteredTransactions.filter(t => t.isBusiness && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
            personalIncome: allFilteredTransactions.filter(t => !t.isBusiness && t.type === 'income').reduce((s, t) => s + t.amount, 0),
            personalExpenses: allFilteredTransactions.filter(t => !t.isBusiness && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
        summary.netProfit = summary.totalIncome - summary.totalExpense;
        summary.businessNet = summary.businessIncome - summary.businessExpenses;
        summary.personalNet = summary.personalIncome - summary.personalExpenses;

        const pageQuery = { ...findQuery };
        if (type && type !== 'all') {
            pageQuery.type = type;
            pageQuery.isLoan = { $ne: true }; // Exclude loans if filtering by income/expense
        }
        if(isLoan === 'true') {
            pageQuery.isLoan = true;
            delete pageQuery.type; // Loan filter overrides type filter
        }
        pageQuery.parentId = { $exists: false }; // Only show parent transactions in main list

        const p = parseInt(page, 10);
        const l = parseInt(limit, 10);
        const totalDocs = await Transaction.countDocuments(pageQuery);
        const docs = await Transaction.find(pageQuery)
            .sort({ date: -1, _id: -1 })
            .skip((p - 1) * l)
            .limit(l);
        
        const pagination = {
            docs,
            totalDocs,
            totalPages: Math.ceil(totalDocs / l),
            page: p,
        };

        res.json({ pagination, summary });
    } catch (error) {
        console.error('Fetch Transactions Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/data', async (req, res) => {
    try {
        const [assets, businesses, customers, transactions] = await Promise.all([
            Asset.find({}),
            Business.find({}),
            Customer.find({}),
            Transaction.find({ isLoan: { $ne: true } }) // Load non-loan transactions for summaries
        ]);

        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();

        const businessesWithSummaries = businesses.map(bizDoc => {
            const biz = bizDoc.toObject();
            const bizTransactions = transactions.filter(t => t.businessId === biz.id);

            const monthlyProfit = bizTransactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === curMonth && d.getFullYear() === curYear;
            }).reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
            
            const yearlyProfit = bizTransactions.filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === curYear;
            }).reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

            return { ...biz, monthlyProfit, yearlyProfit };
        });

        res.json({ assets, businesses: businessesWithSummaries, customers });
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance Manager Backend running on http://127.0.0.1:${PORT}`);
});