const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { checkDomainAvailability } = require('./dynadot-integration');
const namecom = require('./namecom-integration');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const SITES_DIR = path.join(__dirname, 'sites');

if (!fs.existsSync(DATA_DIR)) fse.ensureDirSync(DATA_DIR);
if (!fs.existsSync(SITES_DIR)) fse.ensureDirSync(SITES_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
let users = {};
if (fs.existsSync(USERS_FILE)) {
    try { users = JSON.parse(fs.readFileSync(USERS_FILE)); } catch (e) { users = {}; }
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
    const parts = auth.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' });
    const token = parts[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create payment intent for one-time payments
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', plan } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: currency,
            metadata: {
                plan: plan
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create subscription
app.post('/api/create-subscription', async (req, res) => {
    try {
        const { price, currency = 'usd', plan } = req.body;
        
        // Create a price object for the subscription
        const stripePrice = await stripe.prices.create({
            unit_amount: price, // Amount in cents
            currency: currency,
            recurring: { interval: 'month' },
            product_data: {
                name: plan
            }
        });

        // Create a setup intent for subscription
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ['card'],
            usage: 'off_session'
        });

        res.json({
            clientSecret: setupIntent.client_secret,
            priceId: stripePrice.id
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('Payment succeeded:', paymentIntent.id);
                // If this was a domain purchase, process registration
                try {
                    const meta = paymentIntent.metadata || {};
                    if (meta.type === 'domain_purchase' && meta.domain) {
                        console.log('Processing domain order for', meta.domain);
                        const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
                        let orders = {};
                        if (fs.existsSync(ORDERS_FILE)) {
                            try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE)); } catch (e) { orders = {}; }
                        }
                        const orderKey = Object.keys(orders).find(k => orders[k].stripePaymentIntent === paymentIntent.id);
                        if (orderKey) {
                            orders[orderKey].status = 'paid';
                            orders[orderKey].paidAt = new Date().toISOString();
                            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
                        }

                        // Attempt to register the domain via Name.com (best-effort)
                        try {
                            const regResult = await namecom.registerDomain(meta.domain, 1, {});
                            console.log('Name.com register result:', regResult);
                            if (orderKey) {
                                orders[orderKey].namecomResult = regResult;
                                orders[orderKey].status = regResult && regResult.error ? 'registration_failed' : 'registered';
                                fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
                            }
                        } catch (regErr) {
                            console.error('Error registering domain with Name.com:', regErr.message || regErr);
                            if (orderKey) {
                                orders[orderKey].namecomResult = { error: regErr.message || String(regErr) };
                                orders[orderKey].status = 'registration_failed';
                                fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
                            }
                        }
                    }
                } catch (processErr) {
                    console.error('Error handling payment_intent.succeeded metadata:', processErr.message || processErr);
                }
                break;
            }
            case 'invoice.payment_succeeded':
                console.log('Invoice payment succeeded:', event.data.object.id);
                break;
            case 'payment_method.attached':
                console.log('PaymentMethod was attached to a Customer!');
                break;
            case 'customer.subscription.deleted':
                console.log('Subscription canceled:', event.data.object.id);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.error('Error processing webhook:', err.message || err);
    }

    res.json({received: true});
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Stripe payment server is running' });
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({ status: 'OK', message: 'Stripe payment server is running' });
});

// Check domain availability using Dynadot API
app.post('/api/check-domain', async (req, res) => {
    try {
        const { domain } = req.body;
        
        if (!domain) {
            return res.status(400).json({ error: 'Domain name is required' });
        }

        // Use the real Dynadot API integration
        const resultDyn = await checkDomainAvailability(domain);
        // Also check Name.com (best-effort)
        const resultNamecom = await namecom.checkDomainAvailability(domain);

        res.json({ dynadot: resultDyn, namecom: resultNamecom });
        
    } catch (error) {
        console.error('Error checking domain:', error);
        res.status(500).json({ error: 'Error checking domain availability' });
    }
});

// Create domain purchase payment intent
app.post('/api/create-domain-payment', async (req, res) => {
    try {
        const { domain, price, currency = 'usd' } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100), // Convert to cents
            currency: currency,
            metadata: {
                type: 'domain_purchase',
                domain: domain
            }
        });

        // persist order record
        const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
        let orders = {};
        if (fs.existsSync(ORDERS_FILE)) {
            try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE)); } catch (e) { orders = {}; }
        }
        const orderId = `order_${Date.now()}`;
        orders[orderId] = {
            id: orderId,
            domain,
            price,
            currency,
            stripePaymentIntent: paymentIntent.id,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

        res.json({ clientSecret: paymentIntent.client_secret, orderId });
    } catch (error) {
        console.error('Error creating domain payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe customer + subscription helper endpoints
app.post('/api/stripe/create-customer', async (req, res) => {
    try {
        const { email, userId } = req.body;
        const customer = await stripe.customers.create({ email, metadata: { userId } });
        res.json({ customerId: customer.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stripe/create-subscription', async (req, res) => {
    try {
        const { customerId, priceId, payment_method } = req.body;
        // attach payment method to customer
        if (payment_method) {
            await stripe.paymentMethods.attach(payment_method, { customer: customerId });
            await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: payment_method } });
        }

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            expand: ['latest_invoice.payment_intent']
        });

        res.json(subscription);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Simple user auth (demo) ---
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (users[email]) return res.status(400).json({ error: 'User already exists' });

        const hashed = await bcrypt.hash(password, 8);
        users[email] = { id: Object.keys(users).length + 1, email, password: hashed };
        saveUsers();

        const token = jwt.sign({ id: users[email].id, email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users[email];
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a site (saved to user's workspace) but not yet published
app.post('/api/site/create', authMiddleware, async (req, res) => {
    try {
        const { name, html } = req.body;
        if (!name || !html) return res.status(400).json({ error: 'Name and html required' });

        const userId = req.user.id;
        const siteId = `${Date.now()}`; // simple id
        const sitePath = path.join(SITES_DIR, String(userId), siteId);
        await fse.ensureDir(sitePath);
        await fse.writeFile(path.join(sitePath, 'index.html'), html, 'utf8');

        res.json({ siteId, previewUrl: `/published/${userId}/${siteId}/index.html` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Publish is same as create for now (keeps public file)
app.post('/api/site/publish', authMiddleware, async (req, res) => {
    try {
        const { siteId } = req.body;
        const userId = req.user.id;
        const sitePath = path.join(SITES_DIR, String(userId), String(siteId));
        if (!fs.existsSync(sitePath)) return res.status(404).json({ error: 'Site not found' });

        // public URL
        const publicUrl = `/published/${userId}/${siteId}/index.html`;
        res.json({ publicUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Name.com endpoints (proxy to helper)
app.post('/api/namecom/check', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain required' });
        const result = await namecom.checkDomainAvailability(domain);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/namecom/register', authMiddleware, async (req, res) => {
    try {
        const { domain, years, contact } = req.body;
        const result = await namecom.registerDomain(domain, years, contact);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve published static sites
app.use('/published', express.static(path.join(__dirname, 'sites')));

// Admin endpoints (protected by ADMIN_KEY env var)
function adminAuth(req, res, next) {
    const key = req.headers['x-admin-key'] || '';
    if (!process.env.ADMIN_KEY) return res.status(403).json({ error: 'Admin key not configured' });
    if (key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Invalid admin key' });
    next();
}

app.get('/api/admin/orders', adminAuth, (req, res) => {
    try {
        const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
        let orders = {};
        if (fs.existsSync(ORDERS_FILE)) {
            try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE)); } catch (e) { orders = {}; }
        }
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin static dashboard
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
