import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Test MongoDB connection
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const connectionState = mongoose.connection.readyState;
    const states: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbInfo = {
      status: states[connectionState] || 'unknown',
      database: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host,
      timestamp: new Date().toISOString(),
    };

    if (connectionState === 1) {
      // Get collection stats
      const collections = await mongoose.connection.db?.listCollections().toArray();
      
      return NextResponse.json({
        success: true,
        message: 'MongoDB connection is active',
        connection: dbInfo,
        collections: collections?.map(c => c.name) || [],
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'MongoDB connection is not active',
        connection: dbInfo,
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error.message,
    }, { status: 500 });
  }
}
