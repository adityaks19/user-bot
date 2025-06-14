const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string from .env file
const MONGODB_URI = process.env.MONGODB_URI;

// Models
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Pass = require('../models/Pass');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// Connect to MongoDB Atlas
const setupDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    console.log('Setting up database...');
    
    // Create routes
    console.log('Creating routes...');
    
    // Delete existing routes if any
    try {
      await Route.deleteMany({});
    } catch (error) {
      console.log('Note: Could not delete existing routes. Continuing...');
    }
    
    // Create routes
    // const routes = [
    //   {
    //     routeNumber: '1',
    //     name: 'ISBT 17 - Airport',
    //     stops: [
    //       { name: 'ISBT 17', order: 1, arrivalTime: '06:00' },
    //       { name: 'Sector 22', order: 2, arrivalTime: '06:10' },
    //       { name: 'Sector 35', order: 3, arrivalTime: '06:20' },
    //       { name: 'Sector 43', order: 4, arrivalTime: '06:30' },
    //       { name: 'Airport', order: 5, arrivalTime: '06:45' }
    //     ],
    //     fare: 15,
    //     distance: 12,
    //     estimatedTime: '45 min'
    //   },
    //   {
    //     routeNumber: '2',
    //     name: 'ISBT 43 - PGI',
    //     stops: [
    //       { name: 'ISBT 43', order: 1, arrivalTime: '07:00' },
    //       { name: 'Sector 44', order: 2, arrivalTime: '07:10' },
    //       { name: 'Sector 34', order: 3, arrivalTime: '07:20' },
    //       { name: 'Sector 16', order: 4, arrivalTime: '07:30' },
    //       { name: 'PGI', order: 5, arrivalTime: '07:40' }
    //     ],
    //     fare: 15,
    //     distance: 10,
    //     estimatedTime: '40 min'
    //   },
      // {
      //   routeNumber: '3',
      //   name: 'Mohali - Panchkula',
      //   stops: [
      //     { name: 'Mohali Bus Stand', order: 1, arrivalTime: '08:00' },
      //     { name: 'Phase 7', order: 2, arrivalTime: '08:10' },
      //     { name: 'Sector 26', order: 3, arrivalTime: '08:30' },
      //     { name: 'Sector 7', order: 4, arrivalTime: '08:45' },
      //     { name: 'Panchkula Bus Stand', order: 5, arrivalTime: '09:00' }
      //   ],
      //   fare: 20,
      //   distance: 15,
      //   estimatedTime: '60 min'
      // }
    // ];
    
    try {
      await Route.insertMany(routes);
      console.log(`Created ${routes.length} routes`);
    } catch (error) {
      console.error('Error creating routes:', error.message);
    }
    
    // Create buses
    console.log('Creating buses...');
    
    // Delete existing buses if any
    try {
      await Bus.deleteMany({});
    } catch (error) {
      console.log('Note: Could not delete existing buses. Continuing...');
    }
    
    // Create buses
    const buses = [
      {
        busNumber: 'CTU-101',
        routeNumber: '1',
        source: 'ISBT 17',
        destination: 'Airport',
        currentLocation: {
          latitude: 30.7333,
          longitude: 76.7794,
          lastUpdated: new Date()
        },
        capacity: 40,
        isActive: true
      },
      {
        busNumber: 'CTU-102',
        routeNumber: '1',
        source: 'ISBT 17',
        destination: 'Airport',
        currentLocation: {
          latitude: 30.7350,
          longitude: 76.7820,
          lastUpdated: new Date()
        },
        capacity: 40,
        isActive: true
      },
      {
        busNumber: 'CTU-201',
        routeNumber: '2',
        source: 'ISBT 43',
        destination: 'PGI',
        currentLocation: {
          latitude: 30.7372,
          longitude: 76.7872,
          lastUpdated: new Date()
        },
        capacity: 40,
        isActive: true
      },
      {
        busNumber: 'CTU-301',
        routeNumber: '3',
        source: 'Mohali Bus Stand',
        destination: 'Panchkula Bus Stand',
        currentLocation: {
          latitude: 30.7046,
          longitude: 76.7179,
          lastUpdated: new Date()
        },
        capacity: 40,
        isActive: true
      }
    ];
    
    try {
      await Bus.insertMany(buses);
      console.log(`Created ${buses.length} buses`);
    } catch (error) {
      console.error('Error creating buses:', error.message);
    }
    
    console.log('Database setup completed successfully!');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

// Run setup
setupDatabase();
