# AR Lipstick Project - Requirements Analysis

## 1. Sequence Diagram - Feedback

### Overview

The feedback system allows users to provide reviews and ratings for products, and administrators to manage these reviews.

### Actors

- **Customer**: End user who can submit reviews and ratings
- **Admin**: Administrator who can moderate and manage feedback
- **System**: Automated processes for feedback validation

### Key Interactions

1. Customer browses products and submits feedback
2. System validates feedback content and user authentication
3. Admin reviews and approves/rejects feedback
4. System updates product ratings and displays approved feedback

### Sequence Flow

```
Customer -> System: Submit Review
System -> Database: Validate User
System -> Database: Store Review (Pending)
System -> Admin: Notify New Review
Admin -> System: Review Feedback
Admin -> System: Approve/Reject
System -> Database: Update Status
System -> Customer: Confirm Submission
```

---

## 2. Class Diagram - Redo (Comprehensive Story & Cardinality Ratios)

### User Stories for Class Diagram Development

#### Core User Stories

1. **As a customer**, I want to browse products so that I can find lipsticks to try on virtually
2. **As a customer**, I want to use AR try-on so that I can see how lipsticks look on my face
3. **As a customer**, I want to add products to cart so that I can purchase them
4. **As a customer**, I want to place orders so that I can receive my lipsticks
5. **As a customer**, I want to provide feedback so that I can share my experience
6. **As an admin**, I want to manage products so that I can maintain inventory
7. **As an admin**, I want to process orders so that I can fulfill customer requests
8. **As an admin**, I want to view analytics so that I can understand business performance

#### Extended User Stories

9. **As a customer**, I want to create an account so that I can track my orders
10. **As a customer**, I want to view order history so that I can track my purchases
11. **As a customer**, I want to make payments so that I can complete purchases
12. **As an admin**, I want to manage users so that I can control access
13. **As an admin**, I want to view statistics so that I can make business decisions
14. **As a system**, I want to process AR data so that I can provide virtual try-on
15. **As a system**, I want to handle payments so that transactions are secure

### Cardinality Ratios

#### Primary Relationships

1. **User (1) : Order (M)** - One user can have many orders
2. **User (1) : Feedback (M)** - One user can provide many feedback entries
3. **Product (1) : OrderItem (M)** - One product can be in many order items
4. **Order (1) : OrderItem (M)** - One order can contain many order items
5. **Product (1) : ProductImage (M)** - One product can have many images
6. **Product (1) : Feedback (M)** - One product can receive many feedback entries
7. **User (1) : Payment (M)** - One user can make many payments
8. **Order (1) : Payment (1)** - One order has one payment

#### Secondary Relationships

9. **Admin (1) : Product (M)** - One admin can manage many products
10. **Admin (1) : Order (M)** - One admin can process many orders
11. **Admin (1) : User (M)** - One admin can manage many users
12. **System (1) : ARSession (M)** - System handles many AR sessions
13. **User (1) : ARSession (M)** - One user can have many AR sessions

### Class Diagram Structure

#### Core Classes

- **User** (Customer/Admin)
- **Product** (Lipstick items)
- **Order** (Purchase orders)
- **OrderItem** (Individual items in orders)
- **Feedback** (Reviews and ratings)
- **Payment** (Transaction records)
- **ProductImage** (Product photos)
- **ARSession** (AR try-on sessions)

#### Supporting Classes

- **Cart** (Shopping cart)
- **Category** (Product categories)
- **Statistics** (Analytics data)
- **Notification** (System notifications)

---

## 3. Well-Labelled Database Design

### Database Schema Overview

#### Users Table

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Products Table

```sql
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    category_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

#### Product Images Table

```sql
CREATE TABLE product_images (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### Orders Table

```sql
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Order Items Table

```sql
CREATE TABLE order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### Feedback Table

```sql
CREATE TABLE feedback (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### Payments Table

```sql
CREATE TABLE payments (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

#### AR Sessions Table

```sql
CREATE TABLE ar_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    session_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 4. ER Diagram to Table Conversion (Reduction Process)

### Entity-Relationship Analysis

#### Primary Entities

1. **User** (Strong Entity)

   - Attributes: id, email, name, role, created_at, updated_at
   - Primary Key: id

2. **Product** (Strong Entity)

   - Attributes: id, name, description, price, stock_quantity, category_id, created_at, updated_at
   - Primary Key: id
   - Foreign Key: category_id → Category.id

3. **Order** (Strong Entity)

   - Attributes: id, user_id, status, total_amount, shipping_address, created_at, updated_at
   - Primary Key: id
   - Foreign Key: user_id → User.id

4. **Feedback** (Strong Entity)
   - Attributes: id, user_id, product_id, rating, review, status, created_at
   - Primary Key: id
   - Foreign Keys: user_id → User.id, product_id → Product.id

#### Weak Entities

5. **OrderItem** (Weak Entity)

   - Attributes: id, order_id, product_id, quantity, unit_price
   - Primary Key: id
   - Foreign Keys: order_id → Order.id, product_id → Product.id

6. **ProductImage** (Weak Entity)
   - Attributes: id, product_id, image_url, is_primary, created_at
   - Primary Key: id
   - Foreign Key: product_id → Product.id

### Reduction Process Steps

#### Step 1: Identify Strong and Weak Entities

- Strong entities can exist independently
- Weak entities depend on strong entities for identification

#### Step 2: Map Attributes

- Simple attributes become table columns
- Composite attributes are broken down into simple columns
- Multi-valued attributes become separate tables

#### Step 3: Handle Relationships

- One-to-One: Foreign key in either table
- One-to-Many: Foreign key in the "many" side
- Many-to-Many: Junction table with foreign keys to both entities

#### Step 4: Normalize Tables

- First Normal Form (1NF): Atomic values, no repeating groups
- Second Normal Form (2NF): No partial dependencies
- Third Normal Form (3NF): No transitive dependencies

#### Step 5: Add Constraints

- Primary key constraints
- Foreign key constraints
- Check constraints (e.g., rating 1-5)
- Not null constraints
- Unique constraints

---

## 5. Development Process (Step-by-Step Comprehensive Guide)

### Phase 1: Project Setup and Foundation

#### 1.1 Environment Setup

1. **Development Environment**

   - Install Node.js (v18+)
   - Install Git for version control
   - Set up code editor (VS Code recommended)
   - Install browser developer tools

2. **Project Initialization**

   - Create Next.js project: `npx create-next-app@latest ar-lipstick`
   - Configure TypeScript: `npm install --save-dev typescript @types/node @types/react`
   - Set up ESLint and Prettier for code quality
   - Initialize Git repository: `git init`

3. **Dependencies Installation**
   - Core dependencies: React, Next.js, TypeScript
   - UI framework: Tailwind CSS
   - State management: React Context API or Redux
   - HTTP client: Axios or fetch API
   - Form handling: React Hook Form
   - Validation: Zod or Yup

#### 1.2 Project Structure Setup

1. **Directory Organization**

   ```
   src/
   ├── app/           # Next.js 13+ app directory
   ├── components/    # Reusable UI components
   ├── lib/          # Utility functions and configurations
   ├── types/        # TypeScript type definitions
   ├── hooks/        # Custom React hooks
   └── styles/       # Global styles and CSS modules
   ```

2. **Configuration Files**
   - `next.config.js` - Next.js configuration
   - `tailwind.config.js` - Tailwind CSS configuration
   - `tsconfig.json` - TypeScript configuration
   - `.eslintrc.js` - ESLint rules
   - `.prettierrc` - Prettier formatting rules

### Phase 2: Backend Infrastructure

#### 2.1 Database Setup

1. **Firebase Configuration**

   - Create Firebase project
   - Enable Firestore Database
   - Configure authentication methods
   - Set up security rules
   - Generate service account key

2. **Database Schema Implementation**
   - Create collections: users, products, orders, feedback
   - Define document structures
   - Set up indexes for efficient queries
   - Implement data validation rules

#### 2.2 API Development

1. **API Route Structure**

   ```
   src/app/api/
   ├── auth/         # Authentication endpoints
   ├── products/     # Product management
   ├── orders/       # Order processing
   ├── feedback/     # Review system
   └── users/        # User management
   ```

2. **Authentication System**

   - Implement Firebase Auth integration
   - Create login/logout functionality
   - Set up protected routes
   - Handle user session management

3. **CRUD Operations**
   - Product CRUD (Create, Read, Update, Delete)
   - Order management
   - User profile management
   - Feedback system

### Phase 3: Frontend Development

#### 3.1 Core Components Development

1. **Layout Components**

   - Header with navigation
   - Footer with links
   - Sidebar for dashboard
   - Responsive design implementation

2. **Authentication Components**

   - Login form
   - Registration form
   - Password reset
   - User profile management

3. **Product Components**
   - Product grid/list view
   - Product detail page
   - Product search and filtering
   - Product categories

#### 3.2 Shopping Cart System

1. **Cart Management**

   - Add/remove items
   - Update quantities
   - Calculate totals
   - Persistent cart storage

2. **Checkout Process**
   - Address collection
   - Payment integration
   - Order confirmation
   - Email notifications

#### 3.3 Dashboard Development

1. **Customer Dashboard**

   - Order history
   - Profile management
   - Wishlist
   - Recent activity

2. **Admin Dashboard**
   - Product management
   - Order processing
   - User management
   - Analytics and reports

### Phase 4: AR Integration

#### 4.1 AR Technology Setup

1. **MediaPipe Integration**

   - Install MediaPipe dependencies
   - Set up face detection models
   - Configure lip detection algorithms
   - Implement real-time video processing

2. **Face Parsing Implementation**
   - Lip region segmentation
   - Color mapping algorithms
   - Real-time rendering
   - Performance optimization

#### 4.2 AR User Interface

1. **Camera Integration**

   - WebRTC camera access
   - Video stream handling
   - Canvas rendering
   - Mobile responsiveness

2. **AR Controls**
   - Product selection interface
   - Color adjustment controls
   - Screenshot functionality
   - Session management

### Phase 5: Testing and Quality Assurance

#### 5.1 Unit Testing

1. **Component Testing**

   - React Testing Library setup
   - Component rendering tests
   - User interaction tests
   - Props validation tests

2. **Utility Testing**
   - API function tests
   - Data transformation tests
   - Validation logic tests
   - Error handling tests

#### 5.2 Integration Testing

1. **API Testing**

   - Endpoint functionality tests
   - Authentication flow tests
   - Database operation tests
   - Error response tests

2. **E2E Testing**
   - Cypress setup and configuration
   - User workflow tests
   - Payment flow tests
   - AR functionality tests

#### 5.3 Performance Testing

1. **Load Testing**

   - API response time tests
   - Database query optimization
   - Image loading performance
   - AR rendering performance

2. **Mobile Testing**
   - Responsive design validation
   - Touch interaction testing
   - Performance on mobile devices
   - Cross-browser compatibility

### Phase 6: Deployment and DevOps

#### 6.1 Production Environment

1. **Vercel Deployment**

   - Connect GitHub repository
   - Configure environment variables
   - Set up custom domain
   - Enable automatic deployments

2. **Environment Configuration**
   - Production API keys
   - Database connection strings
   - CDN configuration
   - Monitoring setup

#### 6.2 Monitoring and Analytics

1. **Performance Monitoring**

   - Vercel Analytics integration
   - Error tracking (Sentry)
   - User behavior analytics
   - Performance metrics

2. **Security Measures**
   - HTTPS enforcement
   - CORS configuration
   - Input validation
   - SQL injection prevention

### Phase 7: Documentation and Maintenance

#### 7.1 Technical Documentation

1. **API Documentation**

   - Endpoint descriptions
   - Request/response examples
   - Authentication requirements
   - Error codes

2. **User Documentation**
   - User guides
   - Feature explanations
   - Troubleshooting guides
   - FAQ section

#### 7.2 Code Maintenance

1. **Regular Updates**

   - Dependency updates
   - Security patches
   - Performance optimizations
   - Bug fixes

2. **Feature Enhancements**
   - User feedback integration
   - New feature development
   - UI/UX improvements
   - Performance enhancements

### Development Timeline

#### Week 1-2: Foundation

- Project setup and configuration
- Basic component structure
- Authentication system

#### Week 3-4: Core Features

- Product management
- Shopping cart
- Basic AR integration

#### Week 5-6: Advanced Features

- Complete AR functionality
- Dashboard development
- Payment integration

#### Week 7-8: Testing and Polish

- Comprehensive testing
- Performance optimization
- Bug fixes and refinements

#### Week 9-10: Deployment

- Production deployment
- Documentation
- User training

### Key Success Factors

1. **Modular Development**: Build components that can be reused and tested independently
2. **Progressive Enhancement**: Ensure core functionality works without JavaScript
3. **Mobile-First Design**: Prioritize mobile user experience
4. **Performance Optimization**: Optimize for fast loading and smooth AR experience
5. **Security Best Practices**: Implement proper authentication and data validation
6. **User Testing**: Regular user feedback and iteration
7. **Documentation**: Maintain comprehensive documentation for future maintenance

### Risk Mitigation

1. **Technical Risks**

   - AR performance issues: Implement fallback modes
   - Browser compatibility: Progressive enhancement
   - Mobile limitations: Responsive design and optimization

2. **Project Risks**

   - Timeline delays: Agile development with regular milestones
   - Scope creep: Clear requirements and change management
   - Resource constraints: Prioritize core features

3. **Business Risks**
   - User adoption: User-centered design and testing
   - Competition: Unique AR features and user experience
   - Technical debt: Regular refactoring and code reviews
