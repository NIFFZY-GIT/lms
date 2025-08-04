import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

// PATCH: Update a user's details
export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { userId } = await params;
        const body = await req.json();
        
        const { name, email, phone, address } = body;
        // Password updates should ideally be a separate, more secure flow
        
        const sql = `
            UPDATE "User"
            SET name = $1, email = $2, phone = $3, address = $4
            WHERE id = $5 RETURNING id, name, email, phone, address;
        `;
        const result = await db.query(sql, [name, email, phone, address, userId]);
        return NextResponse.json(result.rows[0]);
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