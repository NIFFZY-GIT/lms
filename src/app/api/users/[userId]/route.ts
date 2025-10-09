import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { sendRoleChangeEmail } from '@/lib/notify';

// PATCH: Update a user's details
export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { userId } = await params;
        const body = await req.json();
        
        const { name, email, phone, address, role } = body;
        if (role && !Object.values(Role).includes(role)) {
            return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
        }

        const existingResult = await db.query('SELECT id, name, email, role FROM "User" WHERE id = $1', [userId]);
        if (existingResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const existingUser = existingResult.rows[0] as { id: string; name: string; email: string; role: Role };

        // Password updates should ideally be a separate, more secure flow
        
        const sql = `
            UPDATE "User"
            SET name = $1, email = $2, phone = $3, address = $4, role = COALESCE($5, role)
            WHERE id = $6 RETURNING id, name, email, phone, address, role;
        `;
        const result = await db.query(sql, [name, email, phone, address, role ?? null, userId]);
        const updatedUser = result.rows[0];

        if (role && role !== existingUser.role) {
            try {
                await sendRoleChangeEmail(existingUser.email, existingUser.name ?? 'there', existingUser.role, role as Role);
            } catch (emailError) {
                console.error('Role change email failed:', emailError);
            }
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

// DELETE: Delete a user
export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { userId } = await params;
        // ON DELETE CASCADE in the database will handle removing related payments, attempts, etc.
        await db.query('DELETE FROM "User" WHERE id = $1', [userId]);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}