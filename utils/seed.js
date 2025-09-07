import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from '../models/User.js';
import Product from '../models/Product.js';
import Contact from '../models/Contact.js';
import Transaction from '../models/Transaction.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedData = async () => {
    try {
        console.log('Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Contact.deleteMany({});
        await Transaction.deleteMany({});
        console.log('Cleared existing data');

        // Create sample user
        // const hashedPassword = await bcrypt.hash('123456', 10);
        const user = new User({
            username: 'Himanshu Swami',
            email: 'Himanshu@gmail.com',
            password: '123456',
            businessName: 'IOTA'
        });
        await user.save();
        console.log('Created sample user');

        const businessId = user.businessId;

        // Create sample products
        const products = [
            {
                name: 'iPhone 15 Pro',
                description: 'Latest iPhone with advanced camera system',
                price: 120000,
                stock: 25,
                category: 'Smartphones',
                businessId
            },
            {
                name: 'Samsung Galaxy S24',
                description: 'Flagship Android smartphone',
                price: 80000,
                stock: 30,
                category: 'Smartphones',
                businessId
            },
            {
                name: 'MacBook Pro M3',
                description: '14-inch laptop with M3 chip',
                price: 200000,
                stock: 15,
                category: 'Laptops',
                businessId
            },
            {
                name: 'Dell XPS 13',
                description: 'Ultrabook with Intel processor',
                price: 90000,
                stock: 20,
                category: 'Laptops',
                businessId
            },
            {
                name: 'iPad Air',
                description: 'Versatile tablet for work and play',
                price: 60000,
                stock: 40,
                category: 'Tablets',
                businessId
            },
            {
                name: 'AirPods Pro',
                description: 'Wireless earbuds with noise cancellation',
                price: 25000,
                stock: 50,
                category: 'Accessories',
                businessId
            },
            {
                name: 'Samsung Monitor 27"',
                description: '4K display monitor',
                price: 35000,
                stock: 12,
                category: 'Monitors',
                businessId
            },
            {
                name: 'Logitech Mouse',
                description: 'Wireless gaming mouse',
                price: 5000,
                stock: 100,
                category: 'Accessories',
                businessId
            },
            {
                name: 'Mechanical Keyboard',
                description: 'RGB backlit mechanical keyboard',
                price: 8000,
                stock: 35,
                category: 'Accessories',
                businessId
            },
            {
                name: 'External Hard Drive 1TB',
                description: 'Portable storage solution',
                price: 4500,
                stock: 60,
                category: 'Storage',
                businessId
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log('Created sample products');

        // Create sample contacts
        const customers = [
            {
                name: 'John Doe',
                phone: '+91-9876543210',
                email: 'john@example.com',
                address: '123 Main St, Delhi',
                type: 'customer',
                businessId
            },
            {
                name: 'Jane Smith',
                phone: '+91-9876543211',
                email: 'jane@example.com',
                address: '456 Park Ave, Mumbai',
                type: 'customer',
                businessId
            },
            {
                name: 'Mike Johnson',
                phone: '+91-9876543212',
                email: 'mike@example.com',
                address: '789 Oak St, Bangalore',
                type: 'customer',
                businessId
            },
            {
                name: 'Sarah Wilson',
                phone: '+91-9876543213',
                email: 'sarah@example.com',
                address: '321 Pine St, Chennai',
                type: 'customer',
                businessId
            }
        ];

        const vendors = [
            {
                name: 'Tech Supplies Co.',
                phone: '+91-9876543220',
                email: 'sales@techsupplies.com',
                address: 'Industrial Area, Gurgaon',
                type: 'vendor',
                businessId
            },
            {
                name: 'Electronics Wholesale',
                phone: '+91-9876543221',
                email: 'orders@elecwholesale.com',
                address: 'Market Complex, Delhi',
                type: 'vendor',
                businessId
            },
            {
                name: 'Global Tech Distributors',
                phone: '+91-9876543222',
                email: 'supply@globaltech.com',
                address: 'Tech Park, Pune',
                type: 'vendor',
                businessId
            }
        ];

        const createdCustomers = await Contact.insertMany(customers);
        const createdVendors = await Contact.insertMany(vendors);
        console.log('Created sample customers and vendors');

        // Create sample transactions
        const sampleTransactions = [
            // Sales
            {
                type: 'sale',
                customerId: createdCustomers[0]._id,
                products: [
                    {
                        productId: createdProducts[0]._id,
                        quantity: 1,
                        price: 120000
                    },
                    {
                        productId: createdProducts[5]._id,
                        quantity: 1,
                        price: 25000
                    }
                ],
                totalAmount: 145000,
                date: new Date('2024-09-01'),
                businessId
            },
            {
                type: 'sale',
                customerId: createdCustomers[1]._id,
                products: [
                    {
                        productId: createdProducts[2]._id,
                        quantity: 1,
                        price: 200000
                    }
                ],
                totalAmount: 200000,
                date: new Date('2024-09-02'),
                businessId
            },
            {
                type: 'sale',
                customerId: createdCustomers[2]._id,
                products: [
                    {
                        productId: createdProducts[1]._id,
                        quantity: 2,
                        price: 80000
                    }
                ],
                totalAmount: 160000,
                date: new Date('2024-09-03'),
                businessId
            },
            // Purchases
            {
                type: 'purchase',
                vendorId: createdVendors[0]._id,
                products: [
                    {
                        productId: createdProducts[0]._id,
                        quantity: 10,
                        price: 100000
                    }
                ],
                totalAmount: 1000000,
                date: new Date('2024-08-25'),
                businessId
            },
            {
                type: 'purchase',
                vendorId: createdVendors[1]._id,
                products: [
                    {
                        productId: createdProducts[7]._id,
                        quantity: 50,
                        price: 3500
                    },
                    {
                        productId: createdProducts[8]._id,
                        quantity: 20,
                        price: 6000
                    }
                ],
                totalAmount: 295000,
                date: new Date('2024-08-28'),
                businessId
            }
        ];

        // Create transactions and update stock
        for (const transactionData of sampleTransactions) {
            const transaction = new Transaction(transactionData);
            await transaction.save();

            // Update product stock
            for (const item of transactionData.products) {
                const stockUpdate = transactionData.type === 'sale' ? -item.quantity : item.quantity;
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: stockUpdate } }
                );
            }
        }

        console.log('Created sample transactions and updated stock');

        console.log('\n Database seeding completed successfully!');
        console.log('\n Sample Data Created:');
        console.log(`User: Himanshu@gmail.com / 123456`);
        console.log(`Products: ${createdProducts.length}`);
        console.log(`Customers: ${createdCustomers.length}`);
        console.log(`Vendors: ${createdVendors.length}`);
        console.log(`Transactions: ${sampleTransactions.length}`);

        console.log('\nYou can now start the server and test the API endpoints!');

    } catch (error) {
        console.error(' Seeding failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();