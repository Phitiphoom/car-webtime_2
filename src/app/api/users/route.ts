import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';

// GET - Fetch all users
export async function GET() {
  try {
    const users = await prisma.tV_USERNAME.findMany({
      select: {
        ID: true,
        USERNAME: true,
        NAME: true,
        DEPARTMENT: true,
        EMAIL: true,
        CREATED_AT: true,
        LASTACTION: true,
        FLAG: true,
      },
      orderBy: {
        NAME: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.USERNAME || !body.PASSWORD || !body.NAME || !body.DEPARTMENT) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.tV_USERNAME.findUnique({
      where: {
        USERNAME: body.USERNAME,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(body.PASSWORD, 10);

    // Create the user
    const user = await prisma.tV_USERNAME.create({
      data: {
        USERNAME: body.USERNAME,
        PASSWORD: hashedPassword,
        NAME: body.NAME,
        DEPARTMENT: body.DEPARTMENT,
        EMAIL: body.EMAIL || null,
        IPADDRESS: body.IPADDRESS || null,
        FLAG: body.FLAG || null,
        CREATED_AT: new Date(),
        LOGDATE: new Date(),
      },
      select: {
        ID: true,
        USERNAME: true,
        NAME: true,
        DEPARTMENT: true,
        EMAIL: true,
        CREATED_AT: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
