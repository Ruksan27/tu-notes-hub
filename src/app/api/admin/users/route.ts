// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Fetch all users
export async function GET() {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        subscriptionExpiresAt: true,
        isEmailVerified: true,
        facultyId: true,
        semesterOrder: true,
        adminFacultyId: true,
        adminSemesterId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Create new user (Child Admin or Student)
export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, password, role, adminFacultyId, adminSemesterId } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STUDENT',
        isEmailVerified: true, // Auto-verify users created by admin
        adminFacultyId: adminFacultyId || null,
        adminSemesterId: adminSemesterId || null,
      }
    })

    return NextResponse.json({ user, message: 'User created successfully! 🎉' })
  } catch (error) {
    console.error('[ADMIN_USERS_POST]', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// Update user details
export async function PUT(req: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, name, email, role, packageType, months, facultyId, semesterOrder, adminFacultyId, adminSemesterId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role as 'STUDENT' | 'ADMIN' | 'CHILD_ADMIN'
    
    // Allow clearing faculty or setting it
    if (facultyId !== undefined) {
      updateData.facultyId = facultyId === '' ? null : facultyId
    }
    
    // Allow clearing semesterOrder or setting it
    if (semesterOrder !== undefined) {
      updateData.semesterOrder = semesterOrder === '' ? null : parseInt(semesterOrder)
    }
    
    // Child Admin fields
    if (adminFacultyId !== undefined) {
      updateData.adminFacultyId = adminFacultyId === '' ? null : adminFacultyId
    }
    if (adminSemesterId !== undefined) {
      updateData.adminSemesterId = adminSemesterId === '' ? null : adminSemesterId
    }
    
    if (packageType) {
      updateData.packageType = packageType as 'FREE' | 'SEMESTER_PASS' | 'ELITE_AI'
      
      if (months !== undefined) {
        if (packageType === 'FREE') {
          updateData.subscriptionExpiresAt = null
        } else if (months > 0) {
          const subscriptionExpiresAt = new Date()
          subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + parseInt(months))
          updateData.subscriptionExpiresAt = subscriptionExpiresAt
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        subscriptionExpiresAt: true
      },
    })

    return NextResponse.json({ user: updatedUser, message: 'User details updated successfully! 🎉' })
  } catch (error) {
    console.error('[ADMIN_USERS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// Delete user
export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Delete user from the database
    // Note: Due to foreign key constraints, Prisma will handle cascading deletes
    // if configured in schema.prisma, otherwise this will throw an error if the user has related records
    // that don't have onDelete: Cascade.
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('[ADMIN_USERS_DELETE]', error)
    
    // Handle foreign key constraint failures explicitly if needed
    if (error.code === 'P2003') {
       return NextResponse.json({ error: 'Cannot delete user because they have associated records (e.g., payments, orders, blogs). Please remove those first.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
