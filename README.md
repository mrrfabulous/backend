# Train Ticketing System Backend

A Node.js/Express backend for the Train Ticketing System with MongoDB database.

## Features

- User Authentication (Register/Login)
- Train Management
- Seat Management
- Booking System
- Payment Integration
- Admin Dashboard
- Input Validation
- Error Handling
- Rate Limiting
- Security Features

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd train-ticketing-system/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/train-ticketing
JWT_SECRET=your_secure_jwt_secret
```

5. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register User
- **POST** `/api/auth/register`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phoneNumber": "+1234567890"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Trains

#### Search Trains
- **GET** `/api/trains`
- Query Parameters:
  - from (string)
  - to (string)
  - date (ISO date)
  - class (economy/business/first/all)

#### Create Train (Admin)
- **POST** `/api/trains`
- Headers: `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "name": "Express 101",
    "from": "New York",
    "to": "Boston",
    "departureTime": "2024-03-20T08:00:00Z",
    "arrivalTime": "2024-03-20T12:00:00Z",
    "basePrice": 89.99,
    "seats": [
      {
        "number": "A1",
        "class": "first",
        "price": 150
      }
    ]
  }
  ```

### Bookings

#### Create Booking
- **POST** `/api/bookings`
- Headers: `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "trainId": "train_id",
    "seats": ["A1", "A2"],
    "paymentMethod": "credit_card",
    "paymentDetails": {
      "cardNumber": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "25",
      "cvv": "123"
    }
  }
  ```

#### Get User's Bookings
- **GET** `/api/bookings/my-bookings`
- Headers: `Authorization: Bearer <token>`

#### Cancel Booking
- **POST** `/api/bookings/:id/cancel`
- Headers: `Authorization: Bearer <token>`

## Testing

1. Import the Postman collection:
   - Open Postman
   - Import `Train_Ticketing_API.postman_collection.json`
   - Set up environment variables:
     - baseUrl: `http://localhost:5000`
     - authToken: (after login)

2. Run tests:
```bash
npm test
```

## Security Features

- JWT Authentication
- Password Hashing
- Rate Limiting
- Helmet Security Headers
- Input Validation
- Error Handling
- MongoDB Injection Prevention

## Error Handling

The API uses a centralized error handling mechanism:

- Validation Errors (400)
- Authentication Errors (401)
- Authorization Errors (403)
- Not Found Errors (404)
- Server Errors (500)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
