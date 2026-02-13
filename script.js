// Configuration
const CONFIG = {
    // Replace with your actual Stripe publishable key
    STRIPE_PUBLISHABLE_KEY: 'pk_live_51RgRBRG6ZGE2Rl3oAODxJMejteYv858nAPO5OkhMycDqT1zRIhnYnT47KAt4EaWAev2QKeQbIM6YVfXEpkJxXz7B0080qNWNbM', // Live Stripe publishable key
    DYNADOT_API_KEY: '8z9R6Z7D8i8JF84LE7P8g7j9J9W706n9R9F6YRa7E7X',
    DYNADOT_API_URL: 'https://storefront457991568429.gdg.website',
    BACKEND_URL: 'https://packie-designs.onrender.com/api', // Render backend for production
    COMMISSION_RATE: 0.15, // 15% commission on domain sales
    // Base URL for return URLs - use production URL for Stripe compatibility
    BASE_URL: 'https://www.cmameet.site'
};

// Initialize Stripe (replace with your publishable key)
let stripe;
try {
    stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
} catch (error) {
    console.warn('Stripe initialization failed:', error);
    // Fallback for demo mode
    stripe = null;
}

// Pricing configuration
const PRICING = {
    basic: {
        name: 'Basic Website',
        price: 2500,
        type: 'one-time'
    },
    professional: {
        name: 'Professional Website',
        price: 3500,
        type: 'one-time'
    },
    premium: {
        name: 'Premium Website',
        price: 4500,
        type: 'one-time'
    },
    'basic-maintenance': {
        name: 'Basic Maintenance',
        price: 150,
        type: 'monthly'
    },
    'premium-maintenance': {
        name: 'Premium Maintenance',
        price: 300,
        type: 'monthly'
    }
};

// DOM Elements
const paymentModal = document.getElementById('paymentModal');
const domainModal = document.getElementById('domainModal');
const paymentForm = document.getElementById('paymentForm');
const domainResults = document.getElementById('domainResults');
const domainNameInput = document.getElementById('domainName');
const checkDomainBtn = document.getElementById('checkDomain');

// Inline domain search elements
const inlineDomainNameInput = document.getElementById('inlineDomainName');
const inlineCheckDomainBtn = document.getElementById('inlineCheckDomain');
const inlineDomainResults = document.getElementById('inlineDomainResults');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializePricingButtons();
    initializeModals();
    initializeDomainSearch();
    initializeInlineDomainSearch();
    initializePortfolioImages();
});

// Open domain modal
function openDomainModal() {
    domainModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Initialize inline domain search
function initializeInlineDomainSearch() {
    if (inlineCheckDomainBtn) {
        inlineCheckDomainBtn.addEventListener('click', function() {
            const domainName = inlineDomainNameInput.value.trim();
            
            if (!domainName) {
                alert('Please enter a domain name');
                return;
            }
            
            // Validate domain format
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(domainName)) {
                alert('Please enter a valid domain name (e.g., example.com)');
                return;
            }
            
            checkInlineDomainAvailability(domainName);
        });
    }
    
    // Allow Enter key to trigger domain check
    if (inlineDomainNameInput) {
        inlineDomainNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                inlineCheckDomainBtn.click();
            }
        });
    }
}

// Check domain availability for inline search
async function checkInlineDomainAvailability(domainName) {
    const resultsDiv = inlineDomainResults;
    
    // Show loading state
    resultsDiv.innerHTML = '<div class="domain-result-inline"><p><i class="fas fa-spinner fa-spin"></i> Checking domain availability...</p></div>';
    
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/check-domain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain: domainName,
                apiKey: CONFIG.DYNADOT_API_KEY
            })
        });
        
        const data = await response.json();
        displayInlineDomainResults(data);
        
    } catch (error) {
        console.error('Error checking domain:', error);
        resultsDiv.innerHTML = `
            <div class="domain-result-inline unavailable">
                <h4>❌ Error checking domain</h4>
                <p>Error checking domain availability. Please try again.</p>
            </div>
        `;
    }
}

// Display inline domain search results
function displayInlineDomainResults(data) {
    const resultsDiv = inlineDomainResults;
    
    if (data.available) {
        const price = data.price || 'Contact for pricing';
        resultsDiv.innerHTML = `
            <div class="domain-result-inline available">
                <h4>✅ ${data.domain} is available!</h4>
                <div class="domain-details-inline">
                    <p><strong>Domain:</strong> ${data.domain}</p>
                    <p><strong>Price:</strong> <span class="price">$${price}</span> ${data.currency || 'USD'}</p>
                    <p><strong>Status:</strong> Available for registration</p>
                </div>
                <button class="btn btn-primary" onclick="purchaseDomain('${data.domain}', ${price})" style="margin-top: 1rem;">
                    <i class="fas fa-shopping-cart"></i> Purchase Domain
                </button>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = `
            <div class="domain-result-inline unavailable">
                <h4>❌ ${data.domain} is not available</h4>
                <p>This domain is already registered. Try searching for a different domain name.</p>
            </div>
        `;
    }
}

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
}

// Pricing buttons functionality
function initializePricingButtons() {
    document.querySelectorAll('.pricing-btn, .maintenance-btn').forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            if (plan) {
                openPaymentModal(plan);
            }
        });
    });
}



// Modal functionality
function initializeModals() {
    // Close modals when clicking the X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// Portfolio images functionality
function initializePortfolioImages() {
    const portfolioImages = document.querySelectorAll('.portfolio-image img');
    const portfolioScreenshots = document.querySelectorAll('.portfolio-screenshot');
    
    // Handle screenshot images
    portfolioScreenshots.forEach(img => {
        img.addEventListener('load', function() {
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('portfolio-fallback')) {
                fallback.style.display = 'none';
            }
        });
        
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('portfolio-fallback')) {
                fallback.style.display = 'flex';
            }
        });
        
        // Show fallback initially, hide when image loads
        const fallback = img.nextElementSibling;
        if (fallback && fallback.classList.contains('portfolio-fallback')) {
            fallback.style.display = 'flex';
        }
    });
    
    // Handle image fallbacks (for backward compatibility)
    portfolioImages.forEach(img => {
        // Check if image loads successfully
        img.addEventListener('load', function() {
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('portfolio-fallback')) {
                fallback.style.display = 'none';
            }
        });
        
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const fallback = this.nextElementSibling;
            if (fallback && fallback.classList.contains('portfolio-fallback')) {
                fallback.style.display = 'flex';
            }
        });
        
        // If image src is empty or invalid, show fallback immediately
        if (!img.src || img.src.includes('placeholder') || img.src.endsWith('.jpg')) {
            img.style.display = 'none';
            const fallback = img.nextElementSibling;
            if (fallback && fallback.classList.contains('portfolio-fallback')) {
                fallback.style.display = 'flex';
            }
        }
    });
}

// Domain search functionality
function initializeDomainSearch() {
    checkDomainBtn.addEventListener('click', function() {
        const domainName = domainNameInput.value.trim();
        
        if (!domainName) {
            alert('Please enter a domain name');
            return;
        }
        
        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domainName)) {
            alert('Please enter a valid domain name (e.g., example.com)');
            return;
        }
        
        checkDomainAvailability(domainName);
    });
    
    // Allow Enter key to trigger domain check
    domainNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkDomainBtn.click();
        }
    });
}

// Check domain availability using Dynadot API
async function checkDomainAvailability(domainName) {
    const resultsDiv = domainResults;
    resultsDiv.innerHTML = '<div class="loading">Checking availability...</div>';
    
    try {
        // Note: In a real implementation, you would make this call from your backend
        // to keep your API key secure
        const response = await fetch(`${CONFIG.BACKEND_URL}/check-domain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain: domainName,
                apiKey: CONFIG.DYNADOT_API_KEY
            })
        });
        
        const data = await response.json();
        displayDomainResults(data);
        
    } catch (error) {
        console.error('Error checking domain:', error);
        resultsDiv.innerHTML = `
            <div class="error">
                <p>Error checking domain availability. Please try again.</p>
                <p>Note: This is a demo. In production, you would need to set up a backend to handle the Dynadot API calls.</p>
            </div>
        `;
    }
}

// Display domain search results
function displayDomainResults(data) {
    const resultsDiv = domainResults;
    
    if (data.available) {
        const price = data.price || 12.99; // Default price if not provided
        const commission = (price * CONFIG.COMMISSION_RATE).toFixed(2);
        
        resultsDiv.innerHTML = `
            <div class="domain-result available">
                <h4>✅ ${data.domain} is available!</h4>
                <div class="domain-details">
                    <p><strong>Price:</strong> $${price}/year</p>
                    <p><strong>Your Commission:</strong> $${commission}</p>
                    <p><strong>Total Cost:</strong> $${(parseFloat(price) + parseFloat(commission)).toFixed(2)}</p>
                </div>
                <button class="btn btn-primary" onclick="purchaseDomain('${data.domain}', ${price})">
                    Purchase Domain
                </button>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = `
            <div class="domain-result unavailable">
                <h4>❌ ${data.domain} is not available</h4>
                <p>This domain is already registered. Try searching for a different domain name.</p>
            </div>
        `;
    }
}

// Purchase domain
async function purchaseDomain(domainName, price) {
    try {
        // Close domain modal if it's open
        if (domainModal && domainModal.style.display === 'block') {
            domainModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Small delay to ensure smooth transition
            setTimeout(() => {
                showDomainPaymentModal(domainName, price);
            }, 100);
        } else {
            // Show payment modal immediately if no domain modal is open
            showDomainPaymentModal(domainName, price);
        }
        
    } catch (error) {
        console.error('Error purchasing domain:', error);
        alert('Error purchasing domain. Please try again.');
    }
}

// Show domain payment modal
function showDomainPaymentModal(domainName, price) {
    // Update modal title and content
    const modal = document.getElementById('paymentModal');
    const modalTitle = modal.querySelector('h2');
    const paymentForm = document.getElementById('paymentForm');
    
    modalTitle.textContent = `Purchase Domain: ${domainName}`;
    
    // Create domain payment form
    paymentForm.innerHTML = `
        <div class="domain-purchase-info">
            <div class="purchase-item">
                <h4>Domain Registration</h4>
                <p><strong>Domain:</strong> ${domainName}</p>
                <p><strong>Price:</strong> $${price}</p>
                <p><strong>Commission (15%):</strong> $${(price * CONFIG.COMMISSION_RATE).toFixed(2)}</p>
                <hr>
                <p class="total-price"><strong>Total: $${(price + (price * CONFIG.COMMISSION_RATE)).toFixed(2)}</strong></p>
            </div>
        </div>
        <div id="domainPaymentForm">
            <!-- Stripe payment form will be loaded here -->
        </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Initialize Stripe payment for domain
    initializeDomainPayment(domainName, price);
}

// Initialize domain payment with Stripe
async function initializeDomainPayment(domainName, price) {
    try {
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }
        
        // Create payment intent for domain purchase
        const response = await fetch(`${CONFIG.BACKEND_URL}/create-domain-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain: domainName,
                price: price,
                currency: 'usd'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }
        
        const { clientSecret } = await response.json();
        
        // Create Stripe Elements
        const elements = stripe.elements({
            clientSecret: clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#6366f1',
                }
            }
        });
        
        // Create payment element
        const paymentElement = elements.create('payment');
        paymentElement.mount('#domainPaymentForm');
        
        // Handle form submission
        const form = document.createElement('form');
        form.id = 'domainPaymentFormElement';
        form.innerHTML = `
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                <i class="fas fa-credit-card"></i> Complete Purchase - $${(price + (price * CONFIG.COMMISSION_RATE)).toFixed(2)}
            </button>
        `;
        
        document.getElementById('domainPaymentForm').appendChild(form);
        
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const submitButton = form.querySelector('button');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            try {
                const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/success.html?domain=${encodeURIComponent(domainName)}`,
                },
            });
                
                if (error) {
                    console.error('Payment failed:', error);
                    alert(`Payment failed: ${error.message}`);
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-credit-card"></i> Complete Purchase';
                }
                
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment error. Please try again.');
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-credit-card"></i> Complete Purchase';
            }
        });
        
    } catch (error) {
        console.error('Error initializing domain payment:', error);
        document.getElementById('domainPaymentForm').innerHTML = `
            <div class="error-message">
                <p><i class="fas fa-exclamation-triangle"></i> Error setting up payment. Please try again.</p>
                <button class="btn btn-secondary" onclick="document.getElementById('paymentModal').style.display='none'">Close</button>
            </div>
        `;
    }
}

// Open payment modal
function openPaymentModal(planKey) {
    const plan = PRICING[planKey];
    if (!plan) {
        console.error('Invalid plan:', planKey);
        return;
    }
    
    paymentModal.style.display = 'block';
    
    // Create payment form based on plan type
    if (plan.type === 'one-time') {
        createOneTimePaymentForm(plan);
    } else {
        createSubscriptionForm(plan);
    }
}

// Create one-time payment form
function createOneTimePaymentForm(plan) {
    paymentForm.innerHTML = `
        <div class="payment-plan-info">
            <h3>${plan.name}</h3>
            <div class="price-display">
                <span class="currency">$</span>
                <span class="amount">${plan.price.toLocaleString()}</span>
                <span class="period">one-time</span>
            </div>
        </div>
        
        <form id="payment-form">
            <div class="form-group">
                <label for="customer-name">Full Name</label>
                <input type="text" id="customer-name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="customer-email">Email</label>
                <input type="email" id="customer-email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="customer-phone">Phone Number</label>
                <input type="tel" id="customer-phone" name="phone">
            </div>
            
            <div class="form-group">
                <label for="project-details">Project Details</label>
                <textarea id="project-details" name="projectDetails" rows="4" 
                    placeholder="Tell me about your project requirements..."></textarea>
            </div>
            
            <div id="payment-element">
                <!-- Stripe Elements will be inserted here -->
            </div>
            
            <button type="submit" id="submit-payment" class="btn btn-primary">
                Pay $${plan.price.toLocaleString()}
            </button>
        </form>
    `;
    
    initializeStripeElements(plan);
}

// Create subscription form
function createSubscriptionForm(plan) {
    paymentForm.innerHTML = `
        <div class="payment-plan-info">
            <h3>${plan.name}</h3>
            <div class="price-display">
                <span class="currency">$</span>
                <span class="amount">${plan.price}</span>
                <span class="period">/month</span>
            </div>
        </div>
        
        <form id="subscription-form">
            <div class="form-group">
                <label for="customer-name">Full Name</label>
                <input type="text" id="customer-name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="customer-email">Email</label>
                <input type="email" id="customer-email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="customer-phone">Phone Number</label>
                <input type="tel" id="customer-phone" name="phone">
            </div>
            
            <div class="form-group">
                <label for="website-url">Website URL (if applicable)</label>
                <input type="url" id="website-url" name="websiteUrl" 
                    placeholder="https://yourwebsite.com">
            </div>
            
            <div id="payment-element">
                <!-- Stripe Elements will be inserted here -->
            </div>
            
            <button type="submit" id="submit-subscription" class="btn btn-primary">
                Subscribe for $${plan.price}/month
            </button>
        </form>
    `;
    
    initializeStripeSubscription(plan);
}

// Initialize Stripe Elements for one-time payments
async function initializeStripeElements(plan) {
    try {
        // Check if Stripe is available
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        // Create payment intent on your backend
        const response = await fetch(`${CONFIG.BACKEND_URL}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: plan.price * 100, // Convert to cents
                currency: 'usd',
                plan: plan.name
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }
        
        const { clientSecret } = await response.json();
        
        // Create Stripe Elements
        const elements = stripe.elements({
            clientSecret: clientSecret
        });
        
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
        // Handle form submission
        const form = document.getElementById('payment-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const submitButton = document.getElementById('submit-payment');
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/esign.html`,
                },
            });
            
            if (error) {
                console.error('Payment failed:', error);
                alert('Payment failed. Please try again.');
                submitButton.disabled = false;
                submitButton.textContent = `Pay $${plan.price.toLocaleString()}`;
            }
        });
        
    } catch (error) {
        console.error('Error initializing payment:', error);
        // Fallback to demo mode
        showDemoPaymentForm(plan);
    }
}

// Demo payment form fallback
function showDemoPaymentForm(plan) {
    const paymentElement = document.getElementById('payment-element');
    paymentElement.innerHTML = `
        <div class="demo-payment-form">
            <div class="payment-info">
                <h4>Demo Payment Form</h4>
                <p>This is a demonstration of the payment flow. In production, this would connect to Stripe.</p>
            </div>
            <div class="form-group">
                <label for="card-number">Card Number</label>
                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="expiry">Expiry</label>
                    <input type="text" id="expiry" placeholder="MM/YY" maxlength="5">
                </div>
                <div class="form-group">
                    <label for="cvc">CVC</label>
                    <input type="text" id="cvc" placeholder="123" maxlength="4">
                </div>
            </div>
            <div class="form-group">
                <label for="cardholder-name">Cardholder Name</label>
                <input type="text" id="cardholder-name" placeholder="John Doe">
            </div>
        </div>
    `;
    
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-payment');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        // Simulate payment processing
        setTimeout(() => {
            // Redirect to e-signature form
            window.location.href = 'esign.html';
        }, 2000);
    });
}

// Initialize Stripe subscription
async function initializeStripeSubscription(plan) {
    try {
        // Check if Stripe is available
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        // Create subscription on your backend
        const response = await fetch(`${CONFIG.BACKEND_URL}/create-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                price: plan.price * 100, // Convert to cents
                currency: 'usd',
                plan: plan.name
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create subscription');
        }
        
        const { clientSecret } = await response.json();
        
        // Create Stripe Elements
        const elements = stripe.elements({
            clientSecret: clientSecret
        });
        
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
        // Handle form submission
        const form = document.getElementById('subscription-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const submitButton = document.getElementById('submit-subscription');
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/esign.html`,
                },
            });
            
            if (error) {
                console.error('Subscription failed:', error);
                alert('Subscription failed. Please try again.');
                submitButton.disabled = false;
                submitButton.textContent = `Subscribe for $${plan.price}/month`;
            }
        });
        
    } catch (error) {
        console.error('Error initializing subscription:', error);
        // Fallback to demo mode
        showDemoSubscriptionForm(plan);
    }
}

// Demo subscription form fallback
function showDemoSubscriptionForm(plan) {
    const paymentElement = document.getElementById('payment-element');
    paymentElement.innerHTML = `
        <div class="demo-payment-form">
            <div class="payment-info">
                <h4>Demo Subscription Form</h4>
                <p>This is a demonstration of the subscription flow. In production, this would connect to Stripe.</p>
            </div>
            <div class="form-group">
                <label for="card-number">Card Number</label>
                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="expiry">Expiry</label>
                    <input type="text" id="expiry" placeholder="MM/YY" maxlength="5">
                </div>
                <div class="form-group">
                    <label for="cvc">CVC</label>
                    <input type="text" id="cvc" placeholder="123" maxlength="4">
                </div>
            </div>
            <div class="form-group">
                <label for="cardholder-name">Cardholder Name</label>
                <input type="text" id="cardholder-name" placeholder="John Doe">
            </div>
        </div>
    `;
    
    // Handle form submission
    const form = document.getElementById('subscription-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-subscription');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        // Simulate subscription processing
        setTimeout(() => {
            // Redirect to e-signature form
            window.location.href = 'esign.html';
        }, 2000);
    });
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'none';
    // Reset the form for next time
    setTimeout(() => {
        paymentForm.innerHTML = '';
    }, 300);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .domain-result {
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .domain-result.available {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
    }
    
    .domain-result.unavailable {
        background: #fef2f2;
        border: 1px solid #fecaca;
    }
    
    .domain-details {
        margin: 1rem 0;
    }
    
    .domain-details p {
        margin: 0.5rem 0;
    }
    
    .payment-plan-info {
        text-align: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 8px;
    }
    
    .price-display {
        margin-top: 1rem;
    }
    
    .error {
        color: #ef4444;
        text-align: center;
        padding: 1rem;
    }
    
    .demo-payment-form {
        padding: 1rem 0;
    }
    
    .payment-info {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    
    .payment-info h4 {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
    }
    
    .payment-info p {
        margin: 0;
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .payment-success {
        text-align: center;
        padding: 2rem;
    }
    
    .success-icon {
        width: 60px;
        height: 60px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1rem;
    }
    
    .payment-success h3 {
        color: #1f2937;
        margin-bottom: 1rem;
    }
    
    .payment-success p {
        color: #6b7280;
        margin-bottom: 0.5rem;
    }
    
    /* Payment Modal Scrolling */
    .modal-content {
        display: flex;
        flex-direction: column;
    }
    
    .modal-content h2 {
        flex-shrink: 0;
        margin-bottom: 1rem;
    }
    
    .modal-content form {
        flex: 1;
        overflow-y: auto;
        padding-right: 0.5rem;
    }
    
    .modal-content form::-webkit-scrollbar {
        width: 6px;
    }
    
    .modal-content form::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .modal-content form::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .modal-content form::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
`;
document.head.appendChild(style);
