# PizzaCraft – Pizza Delivery System

## Project Overview
PizzaCraft is a full-stack pizza delivery application developed as part of the Oasis Infobyte internship -Level 3.

The application allows customers to explore pizzas, customize ingredients, place orders, and track order status. Administrators can manage pizzas, inventory, and customer orders.

# Technologies Used
- Frontend: React.js, HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Email:Nodemailer
- Image Uploads:Cloudinary
- Payment Gateway: Safepay Sandbox

# Main Features

# Customer
- User registration and login
- Email verification
- Forgot-password and password-reset functionality
- Pizza menu and customization
- Cart and order summary
- Sandbox payment checkout
- Order history and status tracking

## Admin
- Separate admin login
- Pizza management
- Inventory management
- Ingredient stock management
- Order management
- Low-stock email notifications

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aimansanaullah5-ops/OIBSIP.git
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Install backend dependencies:
   ```bash
   cd ../server
   npm install
   ```

5. Configure the required environment variables in `server/.env`. Never upload this file or share its secret values.

6. Start the backend and frontend in separate terminals using their respective development scripts.

## Payment Gateway Integration – Important Note

The internship task specified Razorpay as the required payment gateway. However, I faced availability and integration limitations with Razorpay for my project in Pakistan.

I attempted to contact the Oasis Infobyte support team through email and Telegram to request guidance regarding the payment gateway requirement, but I did not receive a response in time.

To avoid delaying project completion, I independently researched and integrated **Safepay Sandbox** as an alternative payment gateway.

This integration allowed me to implement and test the checkout and payment verification flow.

**Note:** Safepay was used as an alternative to Razorpay. The integration uses sandbox mode and does not process live payments.

## Internship
Developed as part of the Oasis Infobyte Internship – Level 3.