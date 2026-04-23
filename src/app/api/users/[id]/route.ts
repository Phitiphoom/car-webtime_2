// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
interface UpdateUserData {
  EDITDATE: Date;
  NAME?: string;
  DEPARTMENT?: string;
  EMAIL?: string;
  FLAG?: string;
  PASSWORD?: string;
}
// GET - Fetch a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
  try {
    const { id: idStr } = await params; // await params
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.tV_USERNAME.findUnique({
      where: { ID: userId },
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
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params; // await params
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const existingUser = await prisma.tV_USERNAME.findUnique({
      where: { ID: userId },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: UpdateUserData = { EDITDATE: new Date() };
    if (body.NAME) updateData.NAME = body.NAME;
    if (body.DEPARTMENT) updateData.DEPARTMENT = body.DEPARTMENT;
    if (body.EMAIL) updateData.EMAIL = body.EMAIL;
    if (body.FLAG) updateData.FLAG = body.FLAG;
    if (body.PASSWORD) {
      updateData.PASSWORD = await hash(body.PASSWORD, 10);
    }

    const user = await prisma.tV_USERNAME.update({
      where: { ID: userId },
      data: updateData,
      select: {
        ID: true,
        USERNAME: true,
        NAME: true,
        DEPARTMENT: true,
        EMAIL: true,
        EDITDATE: true,
        FLAG: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error updating user`, error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
  try {
    const { id: idStr } = await params; // await params
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const existingUser = await prisma.tV_USERNAME.findUnique({
      where: { ID: userId },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.tV_USERNAME.delete({ where: { ID: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting user`, error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
